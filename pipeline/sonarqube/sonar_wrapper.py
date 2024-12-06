import os
import subprocess
import shutil
import requests
import boto3
import sys
import time
import git
from git import Repo
from urllib.parse import urlparse
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
import psycopg2
import json
from sonarqube import SonarQubeClient

# Get AWS secrets
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# Get DB connection secrets
POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASS = os.getenv('POSTGRES_PASS')
POSTGRES_PORT = os.getenv('POSTGRES_PORT')

# Get SonarQube server info
SONAR_HOST_URL = os.getenv('SONAR_HOST_URL')
SONAR_QUBE_TOKEN = os.getenv('SONAR_QUBE_TOKEN')

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
kafka_failure = "sonar_qube_failure"
producer = create_kafka_producer([f'{KAFKA_IP}:9092'])

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

def main():
  try:
    if len(sys.argv) != 6 and len(sys.argv) != 5:
      print("Usage: python githubProcessing.py <repo_url> <repo_name> <bucket_name> <github_token>")
      send_kafka_msg(kafka_failure, f"Invalid usage...")
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
      if os.path.exists("/usr/src"):
        shutil.rmtree("/usr/src")
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error running python script...")
      sys.exit()

    cloned_repo = "/usr/src/"
    clone_repository(repo_url, cloned_repo, github_token)

    # Setup PostgreSQL connection
    try:
      pg_conn = psycopg2.connect(
        host=POSTGRES_HOST,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASS,
        port=POSTGRES_PORT
      )
      pg_cursor = pg_conn.cursor()
      print("PostgreSQL connection created successfully.")

      pg_cursor.execute("SELECT sonar_qube_proj FROM repos WHERE github_url = %s", (repo_url,))
      result = pg_cursor.fetchone()
      sonar_token_qube = SONAR_QUBE_TOKEN

      if result and result[0] is None:
        print("Creating project")

        # response = requests.post(
        #   "http://192.168.4.63:9000/api/user_tokens/generate",
        #   auth=('admin', 'admin'),
        #   params={
        #     'name': repo_name
        #   }
        # )

        # if not response.ok:
        #   send_kafka_msg(kafka_failure, f"Error creating SonarQube token: {response}")
        #   sys.exit()

        # token_data = response.json()
        # sonar_token_qube = token_data.get('token')

        response = requests.post(
          "http://192.168.4.63:9000/api/projects/create",
          auth=('admin', 'admin'),
          params={
            'name': repo_name,
            'project': repo_name
          }
        )

        if not response.ok:
          send_kafka_msg(kafka_failure, f"Error creating SonarQube project: {response}")
          sys.exit()

        # pg_cursor.execute("UPDATE repos SET sonar_token = %s WHERE github_url = %s", (sonar_token_qube, repo_url))
        # pg_conn.commit()

        pg_cursor.execute("UPDATE repos SET sonar_qube_proj = %s WHERE github_url = %s", (repo_name, repo_url))
        pg_conn.commit()

        time.sleep(20)
      # elif result and result[0]:
      #   print("Getting sonar token")
      #   pg_cursor.execute("SELECT sonar_token FROM repos WHERE github_url = %s", (repo_url,))
      #   sonar_token = pg_cursor.fetchone()

      #   if sonar_token and sonar_token[0]:
      #     sonar_token_qube = sonar_token[0]
      #   else:
      #     print("No sonar token found")
      #     send_kafka_msg(kafka_failure, f"Error running static analysis")
      #     sys.exit()

      #   print("Found sonar token...")
      elif not result:
        print("No repository found in database")
        send_kafka_msg(kafka_failure, f"Error running static analysis")
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error running postgresql code: {e}")
      sys.exit()

    print("Changing directory")

    os.chdir(cloned_repo)
    print(os.path.abspath(os.curdir))

    try:
      command = (
        f"sonar-scanner "
        f"-Dsonar.host.url={SONAR_HOST_URL} "
        f"-Dsonar.projectKey={repo_name} "
        f"-Dsonar.login={SONAR_QUBE_TOKEN}"
      )
      print(f"Running command:\n{command}")
      subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except subprocess.CalledProcessError as e:
      send_kafka_msg(kafka_failure, f"Error running sonar scanner: {e}")
      sys.exit()

    print("Ran...")

    sonar = SonarQubeClient(sonarqube_url=SONAR_HOST_URL, token=SONAR_QUBE_TOKEN)

    measures = sonar.measures.get_component_with_specified_measures(
        component=repo_name,
        metricKeys="bugs,vulnerabilities,code_smells,security_hotspots,duplicated_lines_density,coverage"
    )

    issues = sonar.issues.search_issues(componentKeys=repo_name)

    results = {
      "measures": measures,
      "issues": issues,
      "timestamp": time.time()
    }

    # Save results with timestamp in filename
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    results_filename = f"{repo_name}_{timestamp}_sonar.json"
    with open(results_filename, "w") as f:
      json.dump(results, f)

    s3.upload_file(
      results_filename,
      bucket_name,
      results_filename
    )

    message = {
      "sonar_results": results_filename,
      "repo_hash": repo_hash
    }
    send_kafka_msg("finished_sonar_qube", message)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script...: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
