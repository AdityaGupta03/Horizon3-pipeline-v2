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
# from kafka import KafkaProducer
# from kafka.errors import NoBrokersAvailable
import json

# Get AWS secrets
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
# KAFKA_IP = os.getenv('KAFKA_IP')

# Testing usage: python3 codeql_wrapper.py https://github.com/greenlucky/spring-security-oauth2-resource-di.git spring-security-oauth2-resource-di asdf 787c9b47d801b0cf08d35bca4805986c43f56836

s3 = boto3.client(
  's3',
  region_name='us-east-1',
  aws_access_key_id=AWS_ACCESS_KEY,
  aws_secret_access_key=AWS_SECRET_KEY
)

# def create_kafka_producer(bootstrap_servers):
#   while True:
#     try:
#       producer = KafkaProducer(
#         bootstrap_servers=bootstrap_servers,
#         value_serializer=lambda v: json.dumps(v).encode('utf-8')
#       )
#       print("Kafka producer created successfully.")
#       return producer  # Return the producer if successful
#     except NoBrokersAvailable:
#       print("No brokers available. Retrying in 5 seconds...")
#       time.sleep(5)  # Wait before retrying
#     except Exception as e:
#       print(f"Failed to create Kafka producer: {e}. Retrying in 5 seconds...")
#       time.sleep(5)  # Wait before retrying

# # Setup kafka connection and standard failure event
# kafka_failure = "codeql_failure"
# producer = create_kafka_producer([f'{KAFKA_IP}:9092'])

# def send_kafka_msg(event_type, msg):
#   metadata = {
#     "event_type": event_type,
#     "metadata": msg
#   }
#   producer.send(topic="pipeline-analysis", value=metadata)
#   producer.flush()

def clone_repository_with_hash(repo_url, dest_dir, commit_hash, access_token):
  try:
    # Parse the URL to get the components
    parsed_url = urlparse(repo_url)

    # Construct the authenticated URL
    auth_url = f"https://{access_token}@{parsed_url.netloc}{parsed_url.path}"

    # Clone the repository
    repo = Repo.clone_from(auth_url, dest_dir)

    # Checkout the specific commit
    repo.git.checkout(commit_hash)

    return repo
  except git.GitCommandError as e:
    # send_kafka_msg(kafka_failure, f"Error cloning repository at commit {commit_hash}: {e.stderr}")
    sys.exit()

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
    # send_kafka_msg(kafka_failure, f"Error cloning repository: {e.stderr}")
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

  def create_db_no_build(self, language):
    try:
      db_name = "source-code-db"
      db_path = os.path.join(self.database_dir, db_name)

      # Create a shell script to handle compilation
      # compile_script = """
      #   #!/bin/bash
      #   mkdir -p /tmp/classes
      #   find . -name "*.java" -print0 | xargs -0 javac -d /tmp/classes || true
      #   """
      # script_path = "/tmp/compile.sh"

      # # Write the script and make it executable
      # with open(script_path, "w") as f:
      #   f.write(compile_script)
      # os.chmod(script_path, 0o755)

      print(f"Creating CodeQL database for {language}")
      command = (
        f"codeql database create {db_path} "
        f"--language={language} "
        f"--source-root={self.source_dir} "
        # f"--no-tracing --no-run-unnecessary-builds "
        f"--command='mvn install -P bootstrap -Dmaven.javadoc.skip=true'"
        # f"-O java.extraction.mode=standalone "  # Try standalone mode
        # f"-O java.build.skip=true "  # Try to skip build
        # f"-O java.classpath=/dev/null"  # Empty classpath
      )
      print(f"Running command: {command}")
      subprocess.run(command, shell=True, check=True)

      return db_path
    except subprocess.CalledProcessError as e:
      print(f"Error creating datbase: {e}")
      return None

  def run_analysis(self, db_path, query_suite="java/command-line-injection"):
    """Run CodeQL analysis using a specific query suite."""
    try:
      results_path = f"{db_path}-results.sarif"
      print(f"Running CodeQL analysis with {query_suite} suite")
      subprocess.run(
        f"codeql database analyze {db_path} "
        f"--ram=1024 --threads=1 "
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
    # send_kafka_msg(kafka_failure, "Invalid usage...")
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
    # clone_repository(repo_url, cloned_repo, github_token)

    # Clone repo with specified commit hash
    commit_hash = repo_hash
    clone_repository_with_hash(repo_url, cloned_repo, commit_hash, github_token)
    analyzer = CodeQLAnalyzer(cloned_repo)
    language = "java"
    db_path = analyzer.create_db_no_build(language)
    if not db_path:
      # send_kafka_msg(kafka_failure, "Failed to create CodeQL database")
      sys.exit()


    single_queries = 'codeql/java-queries'
    results_path = analyzer.run_analysis(db_path, single_queries)
    if not results_path:
      # send_kafka_msg(kafka_failure, "Failed to run analysis")
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
    try:
      timestamp = time.strftime("%Y%m%d-%H%M%S")
      results_filename = f"{repo_name}_{timestamp}_codeql.json"
      s3.put_object(
        Bucket=bucket_name,
        Key=results_filename,
        Body=json.dumps(output_json, indent=2)
      )

      print(f"Analysis results uploaded to s3://{bucket_name}/{results_filename}")
    except Exception as e:
      print(f"Failed to upload analysis results to S3: {e}")

    # message = {
    #   "codeql_results": results_filename,
    #   "repo_hash": repo_hash
    # }
    # send_kafka_msg("finished_codeql", message)
  except Exception as e:
    # send_kafka_msg(kafka_failure, f"Error running python script: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
