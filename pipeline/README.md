# Pipeline

This folder contains core analysis used in the event-driven pipeline. Most, if not all, of the code is written using Python 3.11.

## Building Docker Containers

In llmAnalysis folder: `docker build -t llm_analysis .`

In codeql folder (works with arm64 and should with intel chips):
`docker buildx build --platform linux/amd64 -t codeql_static --load .`

In gitProcessing folder:
`docker build -t git_analysis .`

In reportService:
`docker build -t report_gen .`

In sonarqube:
`docker buildx build --platform linux/amd64 --load -t sonar_scanner .`

In bindiff:
`docker buildx build --platform linux/amd64 --load -t bindiff .`

## Environment File

Keep a .env file in the lambdas folder with the following:
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
POSTGRES_HOST=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASS=
POSTGRES_PORT=
SONAR_HOST_URL=
SONAR_QUBE_TOKEN=
GOOGLE_API=
EMAIL=
EMAIL_PASS=
KAFKA_IP=
```
