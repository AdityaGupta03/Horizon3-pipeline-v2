from sonarqube import SonarQubeClient
sonar = SonarQubeClient(sonarqube_url="http://localhost:9000", token='squ_4036c5b90f8ccb9121bd9cea1274285b9b6b9617')

# Get Request
# res = sonar.request_get(endpoint="/api/components/search", params={"qualifiers": "TRK"})

proj = sonar.projects.search_projects()
for p in proj:
    print(proj[p])

# project_analyses_and_events = sonar.project_analyses.search_project_analyses_and_events(project="TestRun")
# for p in project_analyses_and_events:
#     print(project_analyses_and_events[p])