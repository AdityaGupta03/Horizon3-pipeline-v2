import os
import sys
import boto3
import json
from kafka import KafkaProducer
from subprocess import run, CalledProcessError
import graphviz
import BinExport2_pb2   # Import the generated protobuf classes

AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

KAFKA_IP = os.getenv('KAFKA_IP')

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
  bootstrap_servers=[f'{KAFKA_IP}:9092'],
  value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def send_kafka_message(event_type, message):
  metadata = {
    "event_type": event_type,
    "metadata": message
  }
  producer.send(topic="pipeline-analysis", value=metadata)
  producer.flush()

def parse_binexport_file(file_path):
  try:
    binexport = BinExport2_pb2.BinExport2()
    with open(file_path, "rb") as f:
      binexport.ParseFromString(f.read())
    return binexport
  except Exception as e:
    print(f"Error parsing the .BinExport file: {e}")

def get_vertex_name(v):
  return str(hex(v.address)) + ': ' + v.mangled_name

def render_graph(file, name):
  dot = graphviz.Digraph(format='png')
  for v in file.call_graph.vertex:
    s = get_vertex_name(v)
    dot.node(str(hex(v.address)), s)
  for e in file.call_graph.edge:
    dot.edge(str(hex(file.call_graph.vertex[e.source_vertex_index].address)), str(hex(file.call_graph.vertex[e.target_vertex_index].address)))
  dot.render(name)

  s3_png_path = name + ".png"
  bucket_name = 'cs407gitmetadata'
  s3.upload_file(f"{name}.png", bucket_name, s3_png_path)

def main():
  try:
    if len(sys.argv) != 5:
      err_msg = json.dumps({
        "log": "Failed to run script - invalid usage..."
      })
      send_kafka_message(err_event_type, err_msg)
      sys.exit(1)

    source_bucket = sys.argv[1]
    binary1_s3_path = sys.argv[2]
    binary2_s3_path = sys.argv[3]
    repo_hash = sys.argv[4]

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

    file1 = parse_binexport_file('/opt/binary1.BinExport')
    file2 = parse_binexport_file('/opt/binary2.BinExport')

    render_graph(file1, "graph1")
    render_graph(file2, "graph2")

    # Send success message to Kafka
    print("Sending success kafka message...")
    message = {
      "bucket": bucket_name,
      "file": s3_bindiff_path,
      "repo_hash": repo_hash
    }
    send_kafka_message("finished_bindiff", message)
    print("Sent")

  except CalledProcessError as e:
    send_kafka_message(err_event_type, f"Command '{e.cmd}' returned non-zero exit status {e.returncode}")
    sys.exit()
  except Exception as e:
    send_kafka_message(err_event_type, f"Failed to run bindiff: {e}")
    sys.exit()

if __name__ == "__main__":
  main()
