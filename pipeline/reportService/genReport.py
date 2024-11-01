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

# Get Postgres secrets
POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_USER = os.getenv('POSTGRES_USER')
POSTGRES_PASS = os.getenv('POSTGRES_PASS')
POSTGRES_PORT = os.getenv('POSTGRES_PORT')

# Get mailer secrets
EMAIL = os.getenv('EMAIL')
EMAIL_PASS = os.getenv('EMAIL_PASS')

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
producer = create_kafka_producer(['192.168.4.63:9092'])

def send_kafka_msg(event_type, msg):
  metadata = {
    "event_type": event_type,
    "metadata": msg
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

def create_pdf(answer, filename):
  text_to_html = markdown.markdown(answer)
  pdf = FPDF()
  pdf.add_page()
  pdf.set_auto_page_break(auto=True, margin=15)
  pdf.set_font("Arial", size=12)
  pdf.write_html(text_to_html)
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

    report = create_pdf(llm_text, report_filename)

    s3.upload_file(
      report_filename,
      report_bucket_name,
      report_filename
    )

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

      print("Repo hash: ", repo_hash)
      pg_cursor.execute("SELECT id, creator_id FROM repos WHERE hash = %s", (repo_hash,))
      result = pg_cursor.fetchone()

      if result:
        repo_id = result[0]
        creator_id = result[1]
      else:
        send_kafka_msg(kafka_failure, f"No record found for hash: {repo_hash}")
        sys.exit()

      report_url = report_filename
      pg_cursor.execute("INSERT INTO reports (report_url, creator_id, repo_id) VALUES (%s, %s, %s)", (report_url, creator_id, repo_id))
      pg_conn.commit()

      pg_cursor.execute("SELECT email FROM users WHERE user_id = %s", (creator_id,))
      result = pg_cursor.fetchone()

      if result:
        email = result[0]

        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "h3.pipeline.poc@gmail.com"
        password = "wfug jwja jrvq uhoj"

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email
        msg['Subject'] = f"Analysis Report for {repo_name}"

        body = f"Your analysis report for repository {repo_name} is ready. Please check your reports on our website!\n Report: {report_filename}"
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
          server.starttls()
          server.login(sender_email, password)
          server.send_message(msg)
      else:
        send_kafka_msg(kafka_failure, f"No user found: {creator_id}")
        sys.exit()

    except Exception as e:
      send_kafka_msg(kafka_failure, f"Error running postgresql code: {e}")
      sys.exit()

    message = {
      "report_file": report_filename,
      "report_bucket": report_bucket_name
    }
    send_kafka_msg("finished_report_gen", message)
  except Exception as e:
    send_kafka_msg(kafka_failure, f"Error running python script: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
