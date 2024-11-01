# Automatically install dependencies

import requests
from sonarqube import SonarQubeClient
import google.generativeai as genai
from fpdf import FPDF, HTMLMixin
import markdown

sonar = SonarQubeClient(sonarqube_url="http://localhost:9000", token='squ_4036c5b90f8ccb9121bd9cea1274285b9b6b9617')

issues1 = sonar.issues.search_issues(componentKeys="TestRun", branch="main")

list_of_issues = issues1['issues']

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
    file = """
    class Temp {
        public static void main(String[] args) {
            String s = null;
            System.out.println(s.length());
        }
    }
    """
    prompt = ""
  
    for i, iss in enumerate(issues, 1):
        report = issue_report(iss, i)
        prompt += report + "\n"
  
    prompt += f"\nGiven the following file (Temp.java), {file}, and the issues that we found above, please estimate a confidence score (between 0 and 1) for the severity of each issue, and suggest recommendations to fix them. Include code examples or best practices where applicable."
  
    return prompt

def ask_llm(prompt):
    genai.configure(api_key="AIzaSyBXMNHfBKbvU7V5ENQefdR-va9uU4fy-no")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text

tester = compile_prompt(list_of_issues)

def create_pdf(answer, filename="report.pdf"):
    text_to_html = markdown.markdown(answer)
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    pdf.write_html(text_to_html)
    pdf.output(filename)

what_llm_says = ask_llm(tester)
create_pdf(what_llm_says)