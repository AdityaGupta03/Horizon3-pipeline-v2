from sonarqube import SonarQubeClient
sonar = SonarQubeClient(sonarqube_url="http://localhost:9000", token='squ_4036c5b90f8ccb9121bd9cea1274285b9b6b9617')

# Get Request
# res = sonar.request_get(endpoint="/api/components/search", params={"qualifiers": "TRK"})

# proj = sonar.projects.search_projects()
# for p in proj:
#     print(proj[p])

# project_analyses_and_events = sonar.project_analyses.search_project_analyses_and_events(project="TestRun")
# for p in project_analyses_and_events:
#     print(project_analyses_and_events[p])
    

issues1 = sonar.issues.search_issues(componentKeys="TestRun", branch="main")
# for i in issues1:
#     print(i)
#     print(issues1[i])
# print(issues1['issues'])

list_of_issues = issues1['issues']
# for i in issues1['issues']:
#     print(i['scope'])

def issue_report(issue, idx):
    sev = issue.get("severity", "N/A")
    comp = issue.get("component", "N/A")
    file = comp.split(":")[1]
    code_w_issue = issue.get("textRange", {})
    description = issue.get("message", "N/A")
    impacts = issue.get("impacts", [])
    
    impacts_readable = ', '.join([f"{impact['softwareQuality']}: {impact['severity']}" for impact in impacts])
    
    report = f"""
    Issue {idx}:
    - Severity: {sev}
    - Component: {file}
    - Code Location: Start Line: {code_w_issue.get("startLine", "N/A")}, End Line: {code_w_issue.get("endLine", "N/A")}, Begin Offset: {code_w_issue.get("startOffset", "N/A")}, End Offset: {code_w_issue.get("endOffset", "N/A")}
    - Message: {description}
    - Impacts: {impacts_readable}
    """
    
    return report

def compile_prompt(issues):
    prompt = "Analyse the following vulnerabilities:\n"
    
    for i, iss in enumerate(issues, 1):
        report = issue_report(iss, i)
        prompt += report + "\n"
    
    prompt += "\nPlease provide an analysis of each issue, and suggest recommendations to fix them. Include code examples or best practices where applicable."
    
    return prompt

tester = compile_prompt(list_of_issues)
print(tester)