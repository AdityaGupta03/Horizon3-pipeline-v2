import os
import time
import sys
import boto3
import json
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from fpdf import FPDF, HTMLMixin
import markdown
import psycopg2

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Get AWS secrets
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# Get mailer secrets
EMAIL = os.getenv('EMAIL')
EMAIL_PASS = os.getenv('EMAIL_PASS')

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
kafka_failure = "report_failure"
producer = create_kafka_producer([f'{KAFKA_IP}:9092'])

def send_kafka_msg(event_type, msg):
  metadata = {
    "event_type": event_type,
    "metadata": msg
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

def create_pdf(answer, bindiff_image, filename):
  text_to_html = markdown.markdown(answer)
  pdf = FPDF()
  pdf.add_page()
  pdf.set_auto_page_break(auto=True, margin=15)
  pdf.set_font("Arial", size=12)
  pdf.write_html(text_to_html)

  if bindiff_image:
    title = markdown.markdown("### Call Graph Image")
    pdf.write_html(title)
    pdf.image(bindiff_image, x=10, y=pdf.get_y() + 10, w=190)
    pdf.ln(130)

  pdf.output(filename)

  return pdf

def main():
  try:
    if len(sys.argv) != 5:
      print("Usage: python genReport.py <llm_file> <llm_bucket_name> <report_bucket_name> <hash>")
      send_kafka_msg(kafka_failure, f"Invalid usage...")
      sys.exit()

    llm_file = sys.argv[1]
    llm_bucket_name = sys.argv[2]
    report_bucket_name = sys.argv[3]
    repo_hash = sys.argv[4]

    repo_name = llm_file.split('_')[0]

    try:
      llm_obj = s3.get_object(Bucket=llm_bucket_name, Key=llm_file)
      llm_text = llm_obj['Body'].read().decode('utf-8')
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error retrieving JSON from S3: {e}")
      sys.exit()

    timestamp = time.strftime("%Y%m%d-%H%M%S")
    report_filename = f"{repo_name}_{timestamp}_report.pdf"

    try:
      s3.download_file(
        llm_bucket_name,
        "graph1.png",
        "graph1.png"
      )
    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error retrieving PNG from S3: {e}")
      sys.exit()

    create_pdf(llm_text, "graph1.png", report_filename)

    s3.upload_file(
      report_filename,
      report_bucket_name,
      report_filename
    )

    vuln_prob_flag = 0
    for line in llm_text.split('\n'):
      if vuln_prob_flag:
        break
      if "Confidence Score" in line:
        words = line.split(' ')
        for word in words:
          if word[0].isdigit():
            score = float(word)
            if score > 0.8:
              vuln_prob_flag = 1
            break

    message = {
      "report_file": report_filename,
      "report_bucket": report_bucket_name,
      "vuln_prob_flag": vuln_prob_flag,
      "repo_hash": repo_hash
    }
    send_kafka_msg("finished_report_gen", message)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
