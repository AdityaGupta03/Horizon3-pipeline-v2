# CodeQL Automation with Docker

This project automates CodeQL analysis for any GitHub repository using a prebuilt Docker container.

## Requirements/Instructions

- Docker installed on your machine.
- enter docker container
  - docker run -it --rm --entrypoint /bin/sh custom-codeql

## How to Use

1. run the docker file:
   1. docker build -t custom-codeql .
2. chmod +x run_codeql.sh
3. ./analyze.sh -r https://github.com/<your_username>/<repo>.git -l java -t <your_personal_access_token>./analyze.sh -r <github_repo_url> -l <language> [-t <personal_access_token>]
4.
