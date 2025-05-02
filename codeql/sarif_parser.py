import json
import sys
import os
import re
from dataclasses import dataclass
from typing import List, Optional, Dict, Any


@dataclass
class Location:
    file_path: str
    start_line: int
    start_column: int
    end_line: int
    end_column: int
    snippet: Optional[str] = None
    message: Optional[str] = None  # For messages in codeFlow locations

@dataclass
class CodeFlow:
    locations: List[Location]

@dataclass
class RelatedLocation:
    id: int
    location: Location
    message: str

@dataclass
class CodeQLIssue:
    rule_id: str
    rule_name: str
    description: str
    severity: str
    security_severity: Optional[str]
    locations: List[Location]
    message: str
    code_flows: List[CodeFlow] = None  # For data flow paths
    related_locations: List[RelatedLocation] = None  # For sources and sinks
    source_code: Dict[str, List[str]] = None

class SarifParser:
    def __init__(self, sarif_file_path: str, repo_dir: str):
        """Initialize the SARIF parser with a file path to the SARIF report."""
        self.sarif_file_path = sarif_file_path
        self.data = self._load_sarif()
        self.rule_map = self._build_rule_map()
        self.repo_dir = repo_dir

    def _load_sarif(self) -> Dict[str, Any]:
        """Load the SARIF file content."""
        with open(self.sarif_file_path, 'r') as f:
            return json.load(f)

    def _build_rule_map(self) -> Dict[str, Dict[str, Any]]:
        """Build a map of rule IDs to rule details for quick lookup."""
        rule_map = {}
        for run in self.data.get('runs', []):
            for rule in run.get('tool', {}).get('driver', {}).get('rules', []):
                rule_id = rule.get('id')
                if rule_id:
                    rule_map[rule_id] = rule
        return rule_map

    def _parse_location(self, loc_obj: Dict[str, Any]) -> Optional[Location]:
        """Parse a location object from SARIF into a Location object."""
        physical_loc = loc_obj.get('physicalLocation', {})
        artifact_loc = physical_loc.get('artifactLocation', {})
        region = physical_loc.get('region', {})

        if not (artifact_loc and region):
            return None

        file_path = artifact_loc.get('uri', '')
        start_line = region.get('startLine', 0)
        start_column = region.get('startColumn', 0)
        end_line = region.get('endLine', start_line)
        end_column = region.get('endColumn', 0)

        # Try to get the snippet if available
        snippet = None
        if 'snippet' in physical_loc:
            snippet = physical_loc.get('snippet', {}).get('text')

        # Get message if available (for code flow locations)
        message = None
        if 'message' in loc_obj:
            message = loc_obj.get('message', {}).get('text')

        return Location(
            file_path=file_path,
            start_line=start_line,
            start_column=start_column,
            end_line=end_line,
            end_column=end_column,
            snippet=snippet,
            message=message
        )

    def _parse_code_flows(self, code_flows_data: List[Dict[str, Any]]) -> List[CodeFlow]:
        """Parse code flows data from SARIF."""
        result = []

        for flow in code_flows_data:
            for thread_flow in flow.get('threadFlows', []):
                locations = []

                for thread_loc in thread_flow.get('locations', []):
                    loc_obj = thread_loc.get('location', {})
                    location = self._parse_location(loc_obj)

                    if location:
                        # Add the message from the location object if present
                        if 'message' in loc_obj:
                            location.message = loc_obj.get('message', {}).get('text')

                        locations.append(location)

                if locations:
                    result.append(CodeFlow(locations=locations))

        return result

    def _parse_related_locations(self, related_locs_data: List[Dict[str, Any]]) -> List[RelatedLocation]:
        """Parse related locations from SARIF."""
        result = []

        for rel_loc in related_locs_data:
            loc_id = rel_loc.get('id')
            message = rel_loc.get('message', {}).get('text', '')
            location = self._parse_location(rel_loc)

            if location and loc_id is not None:
                result.append(RelatedLocation(
                    id=loc_id,
                    location=location,
                    message=message
                ))

        return result

    def get_full_function_context(self, file_lines: List[str], line_number: int) -> List[str]:
        """
        Extract the complete function or method containing the specified line.

        Args:
            file_lines: List of lines from the file
            line_number: The line number of interest (1-based)

        Returns:
            List of lines representing the entire function/method with line numbers
        """
        if not file_lines or line_number < 1 or line_number > len(file_lines):
            return ["Invalid line number or empty file"]

        # Convert to 0-based indexing
        line_idx = line_number - 1

        # Java-specific method signature patterns
        method_pattern = r'(public|private|protected|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])'
        class_pattern = r'(public|private|protected|static|\s) +(class|interface|enum) +(\w+)'

        # First, search backward for the start of the function/method
        start_idx = 0
        found_start = False

        # Look for method signature before the line of interest
        temp_idx = line_idx
        while temp_idx >= 0:
            line = file_lines[temp_idx]

            # Check if this line contains a method signature
            if re.search(method_pattern, line) and '{' in line:
                start_idx = temp_idx
                found_start = True
                break

            # If we find a closing brace, this might be from a previous method
            # Keep searching for the matching opening brace
            if '}' in line and not '{' in line:
                brace_level = 1  # Start with 1 closing brace
                back_idx = temp_idx - 1

                # Search backward to find matching opening brace
                while back_idx >= 0 and brace_level > 0:
                    back_line = file_lines[back_idx]
                    brace_level += back_line.count('}')
                    brace_level -= back_line.count('{')
                    back_idx -= 1

                # Skip to before the matched opening brace
                temp_idx = back_idx
                continue

            # If this line has an opening brace and we haven't found a method signature yet,
            # check if the previous line has a method signature
            if '{' in line and temp_idx > 0:
                prev_line = file_lines[temp_idx - 1]
                if re.search(method_pattern, prev_line) and not '{' in prev_line:
                    start_idx = temp_idx - 1
                    found_start = True
                    break

            temp_idx -= 1

        # If we couldn't find a method signature, fall back to simple context
        if not found_start:
            # Look for any class or interface declaration as a fallback
            temp_idx = line_idx
            while temp_idx >= 0:
                line = file_lines[temp_idx]
                if re.search(class_pattern, line):
                    start_idx = temp_idx
                    found_start = True
                    break
                temp_idx -= 1

            if not found_start:
                # Just provide context around the line
                start_idx = max(0, line_idx - 10)

        # Now search forward for the end of the function/method
        end_idx = len(file_lines) - 1

        # Start counting braces from the vulnerability line
        brace_level = 0
        for i in range(start_idx, line_idx + 1):
            brace_level += file_lines[i].count('{')
            brace_level -= file_lines[i].count('}')

        # If we're inside a method body (brace_level > 0), find its end
        if brace_level > 0:
            temp_idx = line_idx + 1

            while temp_idx < len(file_lines) and brace_level > 0:
                line = file_lines[temp_idx]
                brace_level += line.count('{')
                brace_level -= line.count('}')

                if brace_level == 0:
                    end_idx = temp_idx
                    break

                temp_idx += 1
        else:
            # If we're not clearly inside a method, just show some lines after
            end_idx = min(len(file_lines) - 1, line_idx + 10)

        # Add line numbers to the output
        result = []

        # Add a header line
        result.append(f"--- Function containing line {line_number} ---")

        # Add the function content with line numbers
        for i in range(start_idx, end_idx + 1):
            prefix = "→ " if i == line_idx else "  "
            result.append(f"{prefix}{i+1}: {file_lines[i].rstrip()}")

        return result

    def extract_xss_issues(self) -> List[CodeQLIssue]:
        """Extract XSS-related vulnerabilities from the SARIF report."""
        xss_issues = []

        for run in self.data.get('runs', []):
            for result in run.get('results', []):
                rule_id = result.get('ruleId')

                # Only process XSS issues (we can expand this later)
                if not rule_id or 'xss' not in rule_id.lower():
                    continue

                # Get rule details
                rule = self.rule_map.get(rule_id)
                if not rule:
                    continue

                # Extract locations
                locations = []
                for loc in result.get('locations', []):
                    location = self._parse_location(loc)
                    if location:
                        locations.append(location)

                # Skip if no locations found
                if not locations:
                    continue

                # Parse code flows (data flow paths)
                code_flows = None
                if 'codeFlows' in result:
                    code_flows = self._parse_code_flows(result.get('codeFlows', []))

                # Parse related locations (sources, sinks, etc.)
                related_locs = None
                if 'relatedLocations' in result:
                    related_locs = self._parse_related_locations(result.get('relatedLocations', []))

                # Create issue
                issue = CodeQLIssue(
                    rule_id=rule_id,
                    rule_name=rule.get('name', ''),
                    description=rule.get('fullDescription', {}).get('text', ''),
                    severity=rule.get('properties', {}).get('problem.severity', 'unknown'),
                    security_severity=rule.get('properties', {}).get('security-severity'),
                    locations=locations,
                    message=result.get('message', {}).get('text', ''),
                    code_flows=code_flows,
                    related_locations=related_locs
                )

                self.load_source_code(issue)
                xss_issues.append(issue)

        return xss_issues

    def format_issues(self, issues: Optional[List[CodeQLIssue]] = None) -> str:
        """Format the security issues into a human-readable string."""
        if issues is None:
            return "Issues is None"

        if not issues:
            return "No security issues found."

        result = []
        for i, issue in enumerate(issues, 1):
            result.append(f"Issue #{i}: {issue.rule_name} ({issue.rule_id})")
            result.append(f"Severity: {issue.severity}")
            if issue.security_severity:
                result.append(f"Security Severity: {issue.security_severity}")
            result.append(f"Description: {issue.description}")
            result.append(f"Message: {issue.message}")
            result.append("Locations:")

            for j, loc in enumerate(issue.locations, 1):
                result.append(f"  {j}. File: {loc.file_path}")
                result.append(f"     Line: {loc.start_line}:{loc.start_column} to {loc.end_line}:{loc.end_column}")
                if loc.snippet:
                    result.append(f"     Code: {loc.snippet}")

            # Add related locations information
            if issue.related_locations and len(issue.related_locations) > 0:
                result.append("\nRelated Locations:")
                for j, rel_loc in enumerate(issue.related_locations, 1):
                    loc = rel_loc.location
                    result.append(f"  {j}. ID: {rel_loc.id}")
                    result.append(f"     Message: {rel_loc.message}")
                    result.append(f"     File: {loc.file_path}")
                    result.append(f"     Line: {loc.start_line}:{loc.start_column} to {loc.end_line}:{loc.end_column}")
                    if loc.snippet:
                        result.append(f"     Code: {loc.snippet}")

            # Add data flow paths information
            if issue.code_flows and len(issue.code_flows) > 0:
                result.append("\nData Flow Path:")
                for j, flow in enumerate(issue.code_flows, 1):
                    result.append(f"  Flow #{j}:")
                    for k, step in enumerate(flow.locations, 1):
                        result.append(f"    Step {k}:")
                        result.append(f"      File: {step.file_path}")
                        result.append(f"      Line: {step.start_line}:{step.start_column} to {step.end_line}:{step.end_column}")
                        if step.message:
                            result.append(f"      Message: {step.message}")
                        if step.snippet:
                            result.append(f"      Code: {step.snippet}")

            result.append("-" * 80)

        return "\n".join(result)

    def get_all_issues(self) -> List[CodeQLIssue]:
        """Extract all vulnerability issues from the SARIF report."""
        all_issues = []

        for run in self.data.get('runs', []):
            for result in run.get('results', []):
                rule_id = result.get('ruleId')

                # Skip if no rule ID
                if not rule_id:
                    continue

                # Get rule details
                rule = self.rule_map.get(rule_id)
                if not rule:
                    continue

                # Extract locations
                locations = []
                for loc in result.get('locations', []):
                    location = self._parse_location(loc)
                    if location:
                        locations.append(location)

                # Skip if no locations found
                if not locations:
                    continue

                # Parse code flows (data flow paths)
                code_flows = None
                if 'codeFlows' in result:
                    code_flows = self._parse_code_flows(result.get('codeFlows', []))

                # Parse related locations (sources, sinks, etc.)
                related_locs = None
                if 'relatedLocations' in result:
                    related_locs = self._parse_related_locations(result.get('relatedLocations', []))

                # Create issue
                issue = CodeQLIssue(
                    rule_id=rule_id,
                    rule_name=rule.get('name', ''),
                    description=rule.get('fullDescription', {}).get('text', ''),
                    severity=rule.get('properties', {}).get('problem.severity', 'unknown'),
                    security_severity=rule.get('properties', {}).get('security-severity'),
                    locations=locations,
                    message=result.get('message', {}).get('text', ''),
                    code_flows=code_flows,
                    related_locations=related_locs
                )

                self.load_source_code(issue)
                all_issues.append(issue)

        return all_issues

    def load_source_code(self, issue: CodeQLIssue):
        """Load source code for all locations in the issue."""
        issue.source_code = {}

        # Collect all unique file paths from all locations
        file_paths = set()

        # Main locations
        for loc in issue.locations:
            file_paths.add(loc.file_path)

        # Related locations
        if issue.related_locations:
            for rel_loc in issue.related_locations:
                file_paths.add(rel_loc.location.file_path)

        # Code flow locations
        if issue.code_flows:
            for flow in issue.code_flows:
                for step in flow.locations:
                    file_paths.add(step.file_path)

        if not os.path.exists(self.repo_dir):
            print(f"Error: Repository directory '{self.repo_dir}' does not exist")
            issue.source_code = {"error": ["Repository directory not found"]}
            return

        # Load source code for each file
        for file_path in file_paths:
            full_path = os.path.join(self.repo_dir, file_path)
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    issue.source_code[file_path] = f.readlines()
            except Exception as e:
                print(f"Error loading source code for {full_path}: {e}")
                issue.source_code[file_path] = [f"Error loading file: {e}"]

    def get_function_context(self, file_lines: List[str], line_number: int, context_lines: int = 5) -> List[str]:
        """
        Extract the function or method containing the specified line.

        This is a simple heuristic that tries to find function/method boundaries.
        It looks for opening and closing braces to determine the function/method scope.

        Args:
            file_lines: List of lines from the file
            line_number: The line number of interest (1-based)
            context_lines: Number of additional lines to include before/after function

        Returns:
            List of lines representing the function/method
        """
        if not file_lines or line_number < 1 or line_number > len(file_lines):
            return ["Invalid line number or empty file"]

        # Convert to 0-based indexing
        line_idx = line_number - 1

        # Start with a simple context window
        start_idx = max(0, line_idx - context_lines)
        end_idx = min(len(file_lines) - 1, line_idx + context_lines)

        # Try to find function/method boundaries
        # First, search backward for the start of the function/method
        brace_level = 0
        in_function = False

        # Look for opening brace before the line of interest
        temp_idx = line_idx
        while temp_idx >= 0:
            line = file_lines[temp_idx]
            # Count closing braces as we go backward
            brace_level += line.count('}')
            brace_level -= line.count('{')

            # If we found a potential method signature
            if brace_level > 0 and ('public ' in line or 'private ' in line or 'protected ' in line):
                # Found a potential method start
                start_idx = max(0, temp_idx - 1)  # Include the line before for context
                in_function = True
                break

            temp_idx -= 1

        # If we've found a function start, look for its end
        if in_function:
            brace_level = 0
            temp_idx = line_idx

            while temp_idx < len(file_lines):
                line = file_lines[temp_idx]
                brace_level += line.count('{')
                brace_level -= line.count('}')

                # If braces balance out, we've found the end of the function
                if brace_level == 0:
                    end_idx = min(len(file_lines) - 1, temp_idx + 1)  # Include one line after for context
                    break

                temp_idx += 1

        # Add line numbers to the output
        result = []
        for i in range(start_idx, end_idx + 1):
            result.append(f"{i+1}: {file_lines[i].rstrip()}")

        return result

    def extract_code_context(self, issue: CodeQLIssue) -> Dict[str, List[str]]:
        """
        Extract relevant code context for an issue.

        Returns:
            Dictionary mapping file paths to lists of relevant code lines with context
        """
        if not issue.source_code:
            return {"error": ["Source code not loaded. Call load_source_code() first."]}

        context = {}

        # Process main vulnerability locations
        for loc in issue.locations:
            file_path = loc.file_path
            if file_path in issue.source_code:
                # Add full function context for main vulnerability location
                context_key = f"{file_path} (full function with vulnerability)"
                context[context_key] = self.get_full_function_context(
                    issue.source_code[file_path],
                    loc.start_line
                )

                # Add regular context window around the vulnerability
                context_key = f"{file_path} (context around vulnerability)"
                context[context_key] = self.get_function_context(
                    issue.source_code[file_path],
                    loc.start_line
                )

        # Process related locations (e.g., sources)
        if issue.related_locations:
            for rel_loc in issue.related_locations:
                loc = rel_loc.location
                file_path = loc.file_path
                if file_path in issue.source_code:
                    context_key = f"{file_path} ({rel_loc.message})"
                    context[context_key] = self.get_function_context(
                        issue.source_code[file_path],
                        loc.start_line
                    )

        # Process data flow steps
        if issue.code_flows:
            # Find the first and last steps in each flow for source and sink
            for i, flow in enumerate(issue.code_flows):
                if flow.locations:
                    # Source (first step)
                    first_loc = flow.locations[0]
                    first_file = first_loc.file_path
                    if first_file in issue.source_code:
                        context_key = f"{first_file} (data flow source)"
                        context[context_key] = self.get_function_context(
                            issue.source_code[first_file],
                            first_loc.start_line
                        )

                    # Sink (last step)
                    last_loc = flow.locations[-1]
                    last_file = last_loc.file_path
                    if last_file in issue.source_code and last_file != first_file:
                        context_key = f"{last_file} (data flow sink)"
                        context[context_key] = self.get_function_context(
                            issue.source_code[last_file],
                            last_loc.start_line
                        )

        return context

    def format_issues_with_code(self, issues: Optional[List[CodeQLIssue]] = None) -> str:
        """Format the security issues into a human-readable string with code context."""
        if issues is None:
            return "Issues is None"

        if not issues:
            return "No security issues found."

        result = []
        for i, issue in enumerate(issues, 1):
            result.append(f"Issue #{i}: {issue.rule_name} ({issue.rule_id})")
            result.append(f"Severity: {issue.severity}")
            if issue.security_severity:
                result.append(f"Security Severity: {issue.security_severity}")
            result.append(f"Description: {issue.description}")
            result.append(f"Message: {issue.message}")
            result.append("Locations:")

            for j, loc in enumerate(issue.locations, 1):
                result.append(f"  {j}. File: {loc.file_path}")
                result.append(f"     Line: {loc.start_line}:{loc.start_column} to {loc.end_line}:{loc.end_column}")
                if loc.snippet:
                    result.append(f"     Code: {loc.snippet}")

            # Add related locations information
            if issue.related_locations and len(issue.related_locations) > 0:
                result.append("\nRelated Locations:")
                for j, rel_loc in enumerate(issue.related_locations, 1):
                    loc = rel_loc.location
                    result.append(f"  {j}. ID: {rel_loc.id}")
                    result.append(f"     Message: {rel_loc.message}")
                    result.append(f"     File: {loc.file_path}")
                    result.append(f"     Line: {loc.start_line}:{loc.start_column} to {loc.end_line}:{loc.end_column}")
                    if loc.snippet:
                        result.append(f"     Code: {loc.snippet}")

            # Add data flow paths information
            if issue.code_flows and len(issue.code_flows) > 0:
                result.append("\nData Flow Path:")
                for j, flow in enumerate(issue.code_flows, 1):
                    result.append(f"  Flow #{j}:")
                    for k, step in enumerate(flow.locations, 1):
                        result.append(f"    Step {k}:")
                        result.append(f"      File: {step.file_path}")
                        result.append(f"      Line: {step.start_line}:{step.start_column} to {step.end_line}:{step.end_column}")
                        if step.message:
                            result.append(f"      Message: {step.message}")
                        if step.snippet:
                            result.append(f"      Code: {step.snippet}")

            # Add source code context
            result.append("\nSource Code Context:")
            code_context = self.extract_code_context(issue)
            for context_key, context_lines in code_context.items():
                result.append(f"  {context_key}:")
                for line in context_lines:
                    result.append(f"    {line}")
                result.append("")  # Empty line for better readability

            result.append("-" * 80)

        return "\n".join(result)



# Example usage
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python codeql_wrapper.py <results_file> <repository_path")
        sys.exit()

    results_file = sys.argv[1]
    repo_dir = sys.argv[2]

    parser = SarifParser(results_file, repo_dir)

    # Extract and format XSS issues
    xss_issues = parser.extract_xss_issues()
    formatted_output = parser.format_issues_with_code(xss_issues)
    print(formatted_output)

    # To get all issues, not just XSS
    all_issues = parser.get_all_issues()
    print(f"Total issues found: {len(all_issues)}")
    # Count issues by rule_id
    issue_counts = {}
    for issue in all_issues:
        if issue.rule_id in issue_counts:
            issue_counts[issue.rule_id] += 1
        else:
            issue_counts[issue.rule_id] = 1

    # Print rule_id counts
    print("\nIssue types breakdown:")
    for rule_id, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {rule_id}: {count} issue(s)")
