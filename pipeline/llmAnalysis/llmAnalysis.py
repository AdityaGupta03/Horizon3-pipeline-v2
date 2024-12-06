import requests
import google.generativeai as genai

import os
import time
import sys
import boto3
import json
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
GOOGLE_API = os.getenv('GOOGLE_API')

KAFKA_IP = os.getenv('KAFKA_IP')

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
kafka_failure = "llm_analysis_fail"
producer = create_kafka_producer([f'{KAFKA_IP}:9092'])

def send_kafka_msg(event_type, msg):
  metadata = {
    "event_type": event_type,
    "metadata": msg
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

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
  genai.configure(api_key=GOOGLE_API)
  model = genai.GenerativeModel('gemini-1.5-flash')
  response = model.generate_content(prompt)
  return response.text

def main():
  try:
    if len(sys.argv) != 4:
      print("Usage: python githubProcessing.py <sonar_file> <bucket_name> <hash>")
      send_kafka_msg(kafka_failure, f"Invalid usage...")
      sys.exit()

    sonar_file = sys.argv[1]
    bucket_name = sys.argv[2]
    repo_hash = sys.argv[3]

    repo_name = sonar_file.split('_')[0]

    try:
      json_obj = s3.get_object(Bucket=bucket_name, Key=sonar_file)
      json_content = json.loads(json_obj['Body'].read().decode('utf-8'))
      issues = json_content['issues']['issues']
      print(issues)
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error retrieving JSON from S3: {e}")
      sys.exit()

    prompt = compile_prompt(issues)
    response = ask_llm(prompt)

    timestamp = time.strftime("%Y%m%d-%H%M%S")
    results_filename = f"{repo_name}_{timestamp}_llm.txt"

    s3.put_object(
      Bucket=bucket_name,
      Key=results_filename,
      Body=response
    )

    message = {
      "llm_text_file": results_filename,
      "repo_hash": repo_hash
    }
    send_kafka_msg("finished_llm_analysis", message)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
