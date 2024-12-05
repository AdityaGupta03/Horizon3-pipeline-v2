#!/usr/bin/env python3
import subprocess
import os
import requests
import boto3
import sys
import time
import git
from git import Repo
from urllib.parse import urlparse
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
import json

# Get AWS secrets
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# Testing usage: python3 codeql_wrapper.py https://github.com/AdityaGupta03/JavaVulnerable.git JavaVulnerable cs407gitmetadata asdf

s3 = boto3.client(
  's3',
  region_name='us-east-1',
  aws_access_key_id=AWS_ACCESS_KEY,
  aws_secret_access_key=AWS_SECRET_KEY
)

def create_kafka_producer(bootstrap_servers):
  while True:
    try:
      producer = KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
      )
      print("Kafka producer created successfully.")
      return producer  # Return the producer if successful
    except NoBrokersAvailable:
      print("No brokers available. Retrying in 5 seconds...")
      time.sleep(5)  # Wait before retrying
    except Exception as e:
      print(f"Failed to create Kafka producer: {e}. Retrying in 5 seconds...")
      time.sleep(5)  # Wait before retrying

# Setup kafka connection and standard failure event
kafka_failure = "codeql_failure"
producer = create_kafka_producer(['10.186.165.52:9092'])

def send_kafka_msg(event_type, msg):
  metadata = {
    "event_type": event_type,
    "metadata": msg
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

def clone_repository(repo_url, dest_dir, access_token):
  try:
    # Parse the URL to get the components
    parsed_url = urlparse(repo_url)

    # Construct the authenticated URL
    auth_url = f"https://{access_token}@{parsed_url.netloc}{parsed_url.path}"

    # Clone the repository
    repo = Repo.clone_from(auth_url, dest_dir)
    return repo
  except git.GitCommandError as e:
    send_kafka_msg(kafka_failure, f"Error cloning repository: {e.stderr}")
    sys.exit()

class CodeQLAnalyzer:
  def __init__(self, source_code_path):
    self.source_dir = source_code_path
    self.database_dir = "/opt/codeql/databases"

  def create_database(self, language):
    """Create a CodeQL database for the source code."""
    try:
      db_name = "source-code-db"
      db_path = os.path.join(self.database_dir, db_name)

      has_maven = os.path.exists(os.path.join(self.source_dir, "pom.xml"))
      has_gradle = os.path.exists(os.path.join(self.source_dir, "build.gradle"))

      build_command = ""
      if language == "java":
        if has_maven:
          build_command = "--command='mvn compile'"
        elif has_gradle:
          build_command = "--command='gradle build'"
        else:
          build_command = "--no-run-unnecessary-builds"


      print(f"Creating CodeQL database for {language}")
      subprocess.run(
        f"codeql database create {db_path} --language={language} --source-root={self.source_dir} {build_command}",
        shell=True,
        check=True
      )
      return db_path
    except subprocess.CalledProcessError as e:
      print(f"Error creating database: {e}")
      return None

  def run_analysis(self, db_path, query_suite="java/command-line-injection"):
    """Run CodeQL analysis using a specific query suite."""
    try:
      results_path = f"{db_path}-results.sarif"
      print(f"Running CodeQL analysis with {query_suite} suite")
      subprocess.run(
        f"codeql database analyze {db_path} "
        f"--ram=8192 "
        f"--format=sarif-latest "
        f"--output={results_path} "
        f"{query_suite}",
        shell=True,
        check=True
      )
      return results_path
    except subprocess.CalledProcessError as e:
      print(f"Error running analysis: {e}")
      return None

def main():
  # Initialize analyzer
  if len(sys.argv) != 6 and len(sys.argv) != 5:
    print("Usage: python codeql_wrapper.py <repo_url> <repo_name> <bucket_name> <repo_hash> <github_token>")
    send_kafka_msg(kafka_failure, "Invalid usage...")
    sys.exit()

  repo_url = sys.argv[1]
  repo_name = sys.argv[2]
  bucket_name = sys.argv[3]
  repo_hash = sys.argv[4]
  if(len(sys.argv) == 6):
    github_token = sys.argv[5]
  else:
    github_token = None

  try:
    cloned_repo = "/opt/codeql/source_code"
    clone_repository(repo_url, cloned_repo, github_token)
    analyzer = CodeQLAnalyzer(cloned_repo)
    language = "java"
    db_path = analyzer.create_database(language)
    if not db_path:
      send_kafka_msg(kafka_failure, "Failed to create CodeQL database")
      sys.exit()


    single_queries = 'codeql/java-queries:Security/CWE/CWE-078'
    results_path = analyzer.run_analysis(db_path, single_queries)
    if not results_path:
      send_kafka_msg(kafka_failure, "Failed to run analysis")
      sys.exit()

    # Read and parse SARIF results
    with open(results_path, 'r') as f:
      sarif_data = json.load(f)

    # Extract issues from SARIF
    issues = []
    for run in sarif_data.get('runs', []):
      for result in run.get('results', []):
        issue = {
          'ruleId': result.get('ruleId'),
          'message': result.get('message', {}).get('text'),
          'severity': result.get('level'),
          'location': result.get('locations', [{}])[0].get('physicalLocation', {}).get('artifactLocation', {}).get('uri'),
          'startLine': result.get('locations', [{}])[0].get('physicalLocation', {}).get('region', {}).get('startLine')
        }
        issues.append(issue)

    # Create JSON file with issues
    output_json = {
      'repository': repo_name,
      'commit_hash': repo_hash,
      'analysis_type': 'codeql',
      'issues': issues
    }

    # Upload to S3
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    results_filename = f"{repo_name}_{timestamp}_codeql.json"
    s3.put_object(
      Bucket=bucket_name,
      Key=results_filename,
      Body=json.dumps(output_json, indent=2)
    )

    print(f"Analysis results uploaded to s3://{bucket_name}/{results_filename}")

    message = {
      "codeql_results": results_filename,
      "repo_hash": repo_hash
    }
    send_kafka_msg("finished_sonar_qube", message)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
