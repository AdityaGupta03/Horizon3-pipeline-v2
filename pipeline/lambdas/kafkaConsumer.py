from kafka import KafkaConsumer
import json
import time

# Create a Kafka consumer
consumer = KafkaConsumer(
  'pipeline-analysis',  # Your Kafka topic name
  bootstrap_servers=['localhost:9092'],
  auto_offset_reset='earliest',
  enable_auto_commit=True,
  group_id='pipeline-consumer',
  value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

print('Waiting for messages...')

for message in consumer:
  print(f"Received message: {message.value}")
  time.sleep(5)  # Simulate time-consuming processing
  print("Processed message.")
