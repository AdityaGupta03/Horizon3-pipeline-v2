import os
import sys
import boto3
import json
from kafka import KafkaProducer
from subprocess import run, CalledProcessError

# Initialize AWS S3 client
s3 = boto3.client('s3')

# Initialize Kafka producer
producer = KafkaProducer(bootstrap_servers='your_kafka_broker:9092')
err_topic = "bindiff_failed"

def send_kafka_message(topic, message):
  producer.send(topic, message.encode('utf-8'))
  producer.flush()

def main(binary1_s3_path, binary2_s3_path):
  try:
    # Change to the /opt directory
    os.chdir('/opt')

    # Copy binaries from S3
    s3.download_file('your-bucket-name', binary1_s3_path, './binaries/binary1')
    s3.download_file('your-bucket-name', binary2_s3_path, './binaries/binary2')

    # Run Ghidra analysis
    run([
      './ghidra_11.0.3_PUBLIC/support/analyzeHeadless',
      '.', 'GhidraProject',
      '-import', '/opt/binaries',
      '-deleteProject',
      '-analysisTimeoutPerFile', '100',
      '-postScript', '/opt/scripts/export_binexport.py'
    ], check=True)

    # Run BinDiff
    run([
      'bindiff',
      '/opt/binary1.BinExport',
      '/opt/binary2.BinExport'
    ], check=True)

    # Copy BinDiff file to S3
    s3_bindiff_path = 'path/to/destination/binary1.BinDiff'
    s3.upload_file('/opt/binary1.BinDiff', 'your-bucket-name', s3_bindiff_path)

    # Send success message to Kafka
    topic = "bindiff_success"
    msg = json.dumps({
      "log": "BinDiff analysis completed successfully",
      "bindiff_path": s3_bindiff_path
    })
    send_kafka_message(topic, msg)

  except CalledProcessError as e:
    err_msg = json.dumps({
      "log": f"Command '{e.cmd}' returned non-zero exit status {e.returncode}"
    })
    send_kafka_message(err_topic, err_msg)
    sys.exit(1)
  except Exception as e:
    err_msg = json.dumps({
      "log": str(e)
    })
    send_kafka_message(err_topic, err_msg)
    sys.exit(1)

if __name__ == "__main__":
  if len(sys.argv) != 3:
    err_msg = json.dumps({
      "log": "Failed to run script - invalid usage..."
    })
    send_kafka_message(err_topic, err_msg)
    sys.exit(1)

  binary1_s3_path = sys.argv[1]
  binary2_s3_path = sys.argv[2]

  main(binary1_s3_path, binary2_s3_path)
