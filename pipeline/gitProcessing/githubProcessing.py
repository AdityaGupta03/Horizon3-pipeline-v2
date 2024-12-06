import os
import subprocess
import shutil
import requests
import boto3
import json
import sys
import time
import git
from git import Repo
from urllib.parse import urlparse
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

KAFKA_IP = os.getenv('KAFKA_IP')

# Setup S3 bucket connection
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
kafka_failure = "git_analysis_failed"
producer = create_kafka_producer([f'{KAFKA_IP}:9092'])

def send_kafka_msg(event_type, msg):
  metadata = {
    "event_type": event_type,
    "metadata": msg
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

def run_command(command, cwd=None):
  try:
    result = subprocess.run(command, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    result.check_returncode()
    return result.stdout
  except subprocess.CalledProcessError as e:
    send_kafka_msg(kafka_failure, f"Error running command: {e.stderr}")
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
    send_kafka_msg(kafka_failure, f"Error cloning repository: {e.stderr}")
    sys.exit()

def detect_and_build_java_project(project_dir):
  for root, dirs, files in os.walk(project_dir):
    try:
      # Check for Maven project
      if "pom.xml" in files:
        run_command("mvn clean install", cwd=root)
        return

      # Check for Gradle project
      elif "build.gradle" in files:
        run_command("gradle build", cwd=root)
        return

      # Check for standalone Java files (basic structure with `src` directory)
      elif "src" in dirs:
        # Look for Java files in src
        java_files = [os.path.join(dp, f) for dp, dn, fn in os.walk(os.path.join(root, "src")) for f in fn if f.endswith(".java")]
        if java_files:
          bin_dir = os.path.join(root, "bin")
          if not os.path.exists(bin_dir):
            os.makedirs(bin_dir)
          javac_command = f"javac -d {bin_dir} " + " ".join(java_files)
          run_command(javac_command, cwd=root)
        return
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error building Java project in {root}: {str(e)}")
      sys.exit(1)

def find_binary_files(project_dir):
  search_paths = [
    os.path.join(project_dir, "bin"),
    os.path.join(project_dir, "build"),
    os.path.join(project_dir, "target"),  # Common for Maven builds
    os.path.join(project_dir, "out"),     # Common for general Java output
    project_dir  # Also search the root project directory
  ]
  binaries = []

  for dir in search_paths:
    if os.path.exists(dir):
      for file in os.listdir(dir):
        file_path = os.path.join(dir, file)
        if file_path.__contains__(".jar"):
          file_type = subprocess.run(['file', '--mime-type', '-b', file_path], stdout=subprocess.PIPE, text=True).stdout.strip()
          run_command(f'unzip {file_path} -d ./extracted_binary')
          find_result = run_command('find . -name "*.class"')
          file_path = os.path.abspath(find_result.split("\n")[0]).strip()
          print("adding binary: ", file_path)
          binaries.append(file_path)

  print("Binaries: ", binaries)

  return binaries

def build_and_push_binaries(repo, project_dir, commit):
  repo.git.checkout(commit)
  detect_and_build_java_project(project_dir)
  binaries = find_binary_files(project_dir)
  pushed_binaries = []
  if binaries:
    for binary in binaries:
      try:
        file_name = os.path.basename(binary) + '_' + commit[:7]
        print(file_name)
        s3.upload_file(binary, 'cs407gitmetadata', os.path.basename(binary) + '_' + commit[:7])
        pushed_binaries.append(file_name)
      except Exception as e:
        send_kafka_msg(kafka_failure, f"Error pushing to S3 bucket...")
        sys.exit()
  else:
    send_kafka_msg(kafka_failure, f"Error building and pushing binaries...")
    sys.exit()

  return pushed_binaries

def clone_build_and_find_binary(repo_url, repo_name, owner, github_token) -> dict:
  # Clone the repositories
  project_dir = './cloned_project'
  repo = clone_repository(repo_url, project_dir, github_token)

  # Get commit information
  try:
    commits = list(repo.iter_commits('main', max_count=50))
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Failed to get commit info...")
    sys.exit()

  # Build the projects and upload binaries to S3 bucket
  bins1 = build_and_push_binaries(repo, project_dir, commits[0].hexsha)

  # Delete the cloned project
  try:
    if os.path.exists("./extracted_binary"):
      shutil.rmtree("./extracted_binary")
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script...")
    sys.exit()

  bins2 = build_and_push_binaries(repo, project_dir, commits[1].hexsha)

  # Get git metadata from API
  api_url = f'https://api.github.com/repos/{owner}/{repo_name}'
  parameters = {'owner': f'{owner}', 'repo': f'{repo_name}'}
  if github_token:
    headers = {'Authorization': f'Bearer {github_token}', 'Accept': 'application/vnd.github+json'}
  else:
    headers = None

  try:
    response = requests.get(api_url.format(**parameters), headers=headers)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error getting git metadata...")
    sys.exit()

  # Push metadata to S3 bucket
  filename = f"{repo_name}_meta_{commits[0].hexsha[:7]}.json"
  if response.status_code == 200:
    metadata = response.json()
    try:
      s3.put_object(Body=json.dumps(metadata), Bucket="cs407gitmetadata", Key=filename)
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error pushing to S3 bucket...")
      sys.exit()

  # Delete the cloned project
  try:
    if os.path.exists(project_dir):
      shutil.rmtree(project_dir)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script...")
    sys.exit()

  return {"bin1": bins1, "bin2": bins2, "git_meta_file": filename}

def main():
  try:
    if len(sys.argv) != 5 and len(sys.argv) != 4:
      print("Usage: python githubProcessing.py <repo_url> <repo_name> <owner> <github_token>")
      send_kafka_msg(kafka_failure, f"Invalid usage...")
      sys.exit()

    repo_url = sys.argv[1]
    repo_name = sys.argv[2]
    owner = sys.argv[3]
    if(len(sys.argv) == 5):
      github_token = sys.argv[4]
    else:
      github_token = None

    files = clone_build_and_find_binary(repo_url, repo_name, owner, github_token)
    send_kafka_msg("finished_git_analysis", files)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script...")
    sys.exit()

if __name__ == "__main__":
  main()
