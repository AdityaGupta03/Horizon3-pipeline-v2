import os
import sys
import boto3
import json
from kafka import KafkaProducer
from subprocess import run, CalledProcessError

AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# Initialize AWS S3 client
s3 = boto3.client(
  's3',
  region_name='us-east-1',
  aws_access_key_id=AWS_ACCESS_KEY,
  aws_secret_access_key=AWS_SECRET_KEY
)

# Initialize Kafka producer
err_event_type = "bindiff_failure"
producer = KafkaProducer(
  bootstrap_servers=['192.168.4.63:9092'],
  value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def send_kafka_message(event_type, message):
  metadata = {
    "event_type": event_type,
    "metadata": message
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

def main():
  try:
    if len(sys.argv) != 4:
      err_msg = json.dumps({
        "log": "Failed to run script - invalid usage..."
      })
      send_kafka_message(err_event_type, err_msg)
      sys.exit(1)

    source_bucket = sys.argv[1]
    binary1_s3_path = sys.argv[2]
    binary2_s3_path = sys.argv[3]

    # Change to the /opt directory
    os.chdir('/opt')

    # Copy binaries from S3
    s3.download_file(source_bucket, binary1_s3_path, './binaries/binary1')
    s3.download_file(source_bucket, binary2_s3_path, './binaries/binary2')

    # Run Ghidra analysis
    run([
      './ghidra_11.0.3_PUBLIC/support/analyzeHeadless',
      '.', 'GhidraProject',
      '-import', '/opt/binaries',
      '-deleteProject',
      '-analysisTimeoutPerFile', '1000',
      '-postScript', '/opt/scripts/export_binexport.py'
    ], check=True)

    print("Starting bindiff...")

    # Run BinDiff
    run([
      'bindiff',
      '/opt/binary1.BinExport',
      '/opt/binary2.BinExport'
    ], check=True)

    # Copy BinDiff file to S3
    s3_bindiff_path = 'results.BinDiff'
    bucket_name = 'cs407gitmetadata'
    s3.upload_file('/opt/binary1_vs_binary2.BinDiff', bucket_name, s3_bindiff_path)

    print("Sending success kafka message...")

    # Send success message to Kafka
    message = {
      "bucket": bucket_name,
      "file": s3_bindiff_path
    }
    send_kafka_message("finished_bindiff", message)

    print("Sent")

  except CalledProcessError as e:
    send_kafka_message(err_event_type, f"Command '{e.cmd}' returned non-zero exit status {e.returncode}")
    sys.exit()
  except Exception as e:
    send_kafka_message(err_event_type, "Failed to run bindiff...")
    sys.exit()

if __name__ == "__main__":
  main()
