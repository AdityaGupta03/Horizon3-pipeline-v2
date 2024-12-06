import os
import subprocess
from kafka import KafkaConsumer
import json
import time

KAFKA_IP = os.getenv('KAFKA_IP')

# Create a Kafka consumer
consumer = KafkaConsumer(
  'pipeline-analysis',  # Your Kafka topic name
  bootstrap_servers=[f'{KAFKA_IP}:9092'],
  auto_offset_reset='earliest',
  enable_auto_commit=True,
  group_id='pipeline-consumer',
  value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

def start_gitprocessing_docker(url, repo_name, repo_owner, repo_hash, repo_token=None):
  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d",
    "git_analysis", url, repo_name, repo_owner
  ]

  if repo_token:
    command.append(repo_token)

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started github processing container...")

  # command = [
  #   "docker", "run", "--add-host=host.docker.internal:host-gateway", "--network=host",
  #   "--env-file", ".env", "--rm", "-d",
  #   "sonar_scanner", url, repo_name, "cs407gitmetadata", repo_hash
  # ]

  command = [
    "docker", "run", "--env-file", ".env", "--rm", "--platform linux/amd64", "codeql_static",
    url, repo_name, "cs407gitmetadata", repo_hash
  ]

  if repo_token:
    command.append(repo_token)

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  # print("Started sonar_scanner docker container")
  print("Started codeql docker container")

def start_bindiff_docker(bucket_name, binary1, binary2):
  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d",
    "bindiff", bucket_name, binary1, binary2
  ]

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started bindiff container...")

def start_llm_analysis(sonar_results, repo_hash):
  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d",
    "llm_analysis", sonar_results, "cs407gitmetadata", repo_hash
  ]

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started LLM analysis container...")

def report_gen(llm_file, llm_bucket, report_bucket, repo_hash):
  command = [
    "docker", "run",
    "--add-host=host.docker.internal:host-gateway",
    "--network=host",
    "--env-file", ".env",
    "--rm", "-d",
    "report_gen",
    llm_file,
    llm_bucket,
    report_bucket,
    repo_hash
  ]

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started report generation container...")

def handle_failure():
  pass

try:
  print("Starting message consumption...")
  while True:
    for message in consumer:
      try:
        print(f"Received message: {message.value}")
        event_type = message.value['event_type']
        metadata = message.value['metadata']

        # Process messages based on event type
        match event_type:
          case 'github_analysis':
            if metadata['repo_token']:
              start_gitprocessing_docker(metadata['url'], metadata['repo_name'], metadata['repo_owner'], metadata['repo_hash'])
            else:
              start_gitprocessing_docker(**metadata)
          case 'finished_git_analysis':
            start_bindiff_docker("cs407gitmetadata", metadata['bin1'][0], metadata['bin2'][0])
          case 'finished_sonar_qube':
            start_llm_analysis(metadata['sonar_results'], metadata['repo_hash'])
          case 'finished_codeql':
            start_llm_analysis(metadata['codeql_results'], metadata['repo_hash'])
          case 'finished_llm_analysis':
            report_gen(metadata['llm_text_file'], 'cs407gitmetadata', 'reports407', metadata['repo_hash'])
          case _:
            print(f"Unknown event type: {event_type}")

        print("Processed message.")

      except Exception as e:
        print(f"Error processing message: {e}")

except KeyboardInterrupt:
  print("Stopping message consumption...")

finally:
  consumer.close()
