import os
import subprocess
from kafka import KafkaConsumer
import json
import time
from dotenv import load_dotenv
import psycopg2

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

KAFKA_IP = os.getenv('LOCAL_KAFKA_IP')

POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASS = os.getenv('POSTGRES_PASS')
POSTGRES_PORT = os.getenv('POSTGRES_PORT')

EMAIL = os.getenv('EMAIL', "example@gmail.com")
EMAIL_PASS = os.getenv('EMAIL_PASS', "example_password")

get_sonar_info_query = """
SELECT sonar_qube_proj, sonar_token
FROM repos
WHERE hash = %s;
"""

get_tools_info_query = """
SELECT static_tool, llm_tool
FROM repos
JOIN repo_analysis ON repos.id = repo_analysis.repo_id
WHERE hash = %s;
"""

get_creator_email_query = """
SELECT email
FROM users
JOIN repos ON users.user_id = repos.creator_id
WHERE repos.hash = %s;
"""

insert_report_query_high_vuln = """
INSERT INTO reports (report_url, creator_id, repo_id, high_prob_flag)
VALUES (%s, %s, %s, 1);
"""

insert_report_query_normal = """
INSERT INTO reports (report_url, creator_id, repo_id, high_prob_flag)
VALUES (%s, %s, %s, 0);
"""

get_repo_id_from_hash = """
SELECT id, creator_id
FROM repos
WHERE hash = %s;
"""

try:
  pg_conn = psycopg2.connect(
    host="localhost",
    database=POSTGRES_DB,
    user=POSTGRES_USER,
    password=POSTGRES_PASS,
    port=POSTGRES_PORT
  )
  pg_cursor = pg_conn.cursor()
  print("PostgreSQL connection created successfully.")
except Exception as e:
  print("Failed to connect to postgres")
  exit()

print(f'{KAFKA_IP}:9092')

# Create a Kafka consumer
consumer = KafkaConsumer(
  'pipeline-analysis',  # Your Kafka topic name
  bootstrap_servers=[f'{KAFKA_IP}:9092'],
  auto_offset_reset='earliest',
  enable_auto_commit=True,
  group_id='pipeline-consumer',
  value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

hash_to_url_map = {}

def start_gitprocessing_docker(url, repo_name, repo_owner, repo_hash, repo_token=None):
  hash_to_url_map[repo_hash] = url

  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d",
    "git_analysis", url, repo_name, repo_owner, repo_hash
  ]

  if repo_token:
    command.append(repo_token)

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started github processing container...")

def start_codeql_docker(url, repo_name, repo_hash, repo_token=None):
  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d", "--platform", "linux/amd64", "codeql_static",
    url, repo_name, "cs407gitmetadata", repo_hash
  ]

  if repo_token:
    command.append(repo_token)

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started codeql docker container")

def start_sonar_docker(url, repo_name, repo_hash, project_name, repo_token=None):
  command = [
    "docker", "run", "--add-host=host.docker.internal:host-gateway", "--network=host",
    "--env-file", ".env", "--rm", "-d",
    "sonar_scanner", url, repo_name, "cs407gitmetadata", repo_hash
  ]

  if repo_token:
    command.append(repo_token)

  print("Started sonar_scanner docker container")

def start_bindiff_docker(bucket_name, binary1, binary2, repo_hash):
  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d",
    "bindiff", bucket_name, binary1, binary2, repo_hash
  ]

  try:
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"Error running Docker container: {e.stderr}")
    return

  print("Started bindiff container...")

def start_llm_analysis(static_results, repo_hash, llm_type, url, static_tool, github_token=None):
  command = [
    "docker", "run", "--env-file", ".env", "--rm", "-d",
    "llm_analysis", static_results, "cs407gitmetadata", repo_hash, static_tool, llm_type, url
  ]

  if github_token:
    command.append(github_token)

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

def start_llm_tool_from_static(metadata, static_type):
  repo_hash = metadata['repo_hash']
  repo_url = hash_to_url_map[repo_hash]

  if static_type == 'sonarqube':
    static_results = metadata['sonar_results']
  elif static_type == 'codeql':
    static_results = metadata['codeql_results']
  else:
    print(f"Unknown static analysis tool: {static_type}")
    handle_failure()
    return

  pg_cursor.execute(get_tools_info_query, (repo_hash,))
  tools_info = pg_cursor.fetchone()
  if not tools_info:
    print("No tools info found")
    handle_failure()
    return

  llm_tool = tools_info[1]

  start_llm_analysis(static_results, repo_hash, llm_tool, repo_url, static_type)

def report_generated(metadata):
  repo_hash = metadata['repo_hash']
  report_filename = metadata['report_file']
  vuln_prob_flag = metadata['vuln_prob_flag']

  try:
    pg_conn.rollback()

    pg_cursor.execute(get_repo_id_from_hash, (repo_hash,))
    result = pg_cursor.fetchone()
    if not result:
      print("No record found for hash")
      handle_failure()
      return
    repo_id = result[0]
    creator_id = result[1]

    if vuln_prob_flag == 1:
      pg_cursor.execute(insert_report_query_high_vuln, (report_filename, creator_id, repo_id))
    else:
      pg_cursor.execute(insert_report_query_normal, (report_filename, creator_id, repo_id))

    pg_cursor.execute(get_creator_email_query, (repo_hash,))
    result = pg_cursor.fetchone()
    if not result:
      print("No record found for hash")
      handle_failure()
      return
    print(result)
    creator_email = result[0]

    pg_conn.commit()
  except Exception as e:
    print(f"Error querying database: {e}")
    handle_failure()
    return

  # send_report_email(creator_email, report_bucket, report_filename)
  if vuln_prob_flag:
    subject = f"Analysis Report for {repo_name}! High Vulnerability Probability!"
  else:
    subject = f"Analysis Report for {repo_name}"

  body = f"Your analysis report for repository {repo_name} is ready. Please check your reports on our website!\n Report: {report_filename}"
  email_func(creator_email, body, subject)

def email_func(email, body, subject):
  smtp_server = "smtp.gmail.com"
  smtp_port = 587
  sender_email = EMAIL
  password = EMAIL_PASS

  msg = MIMEMultipart()
  msg['From'] = sender_email
  msg['To'] = email
  msg['Subject'] = subject
  msg.attach(MIMEText(body, 'plain'))

  with smtplib.SMTP(smtp_server, smtp_port) as server:
    server.starttls()
    server.login(sender_email, password)
    server.send_message(msg)



def handle_failure():
  pass

try:
  print("Starting message consumption...")
  while True:
    for message in consumer:
      try:
        current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        print(f"Current time: {current_time}")
        print(message.value)
        event_type = message.value['event_type']
        metadata = message.value['metadata']

        # Process messages based on event type
        match event_type:
          case 'github_analysis':
            if not metadata['repo_token']:
              start_gitprocessing_docker(metadata['url'], metadata['repo_name'], metadata['repo_owner'], metadata['repo_hash'])
            else:
              start_gitprocessing_docker(**metadata)
          case 'finished_git_analysis':
            start_bindiff_docker("cs407gitmetadata", metadata['bin1'][0], metadata['bin2'][0], metadata['repo_hash'])
          case 'finished_bindiff':
            repo_hash = metadata['repo_hash']
            repo_url = hash_to_url_map[repo_hash]
            repo_name = repo_url.split('/')[-1].replace('.git', '')
            print(repo_url)

            try:
              pg_cursor.execute(get_tools_info_query, (repo_hash,))
              tools_info = pg_cursor.fetchone()
              print(tools_info)
              if not tools_info:
                print("No tools info found")
                handle_failure()
                break
            except Exception as e:
              print(f"Error querying database: {e}")
              handle_failure()
              break

            static_tool = tools_info[0]

            if static_tool == "codeql":
              start_codeql_docker(repo_url, repo_name, repo_hash)
            elif static_tool == "sonarqube":
              try:
                pg_cursor.execute(get_sonar_info_query, (repo_hash,))
                sonar_info = pg_cursor.fetchone()
                if not sonar_info:
                  print("No sonar info found")
                  handle_failure()
                  break
              except Exception as e:
                print(f"Error querying database: {e}")
                handle_failure()
                break

              print(sonar_info)
              continue
              # start_sonar_docker(repo_url, repo_name, project_name, repo_hash)
            else:
              print(f"Unknown static analysis tool: {static_tool}")
              handle_failure()
          case 'finished_sonar_qube':
            start_llm_tool_from_static(metadata, 'sonarqube')
          case 'finished_codeql':
            start_llm_tool_from_static(metadata, 'codeql')
          case 'finished_llm_analysis':
            report_gen(metadata['llm_text_file'], 'cs407gitmetadata', 'reports407', metadata['repo_hash'])
          case 'finished_report_gen':
            report_generated(metadata)
          case _:
            print(f"Unknown event type: {event_type}")

        print("Processed message.")

      except Exception as e:
        print(f"Error processing message: {e}")

except KeyboardInterrupt:
  print("Stopping message consumption...")

finally:
  consumer.close()
