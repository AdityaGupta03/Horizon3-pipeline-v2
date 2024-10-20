import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-backend",
  brokers: ["localhost:9092"], // Kafka broker URL
});

const producer = kafka.producer();

async function sendKafkaEvent(eventType, metadata) {
  console.log("sendKafkaEvent()...");

  try {
    await producer.connect();
    console.log("Connected to Kafka");

    const eventData = {
      event_type: eventType,
      metadata: metadata,
    };

    await producer.send({
      topic: "pipeline-analysis",
      messages: [
        {
          value: JSON.stringify(eventData),
        },
      ],
    });

    console.log("Posted event: ", eventData);
  } catch (error) {
    console.error("Error posting Kafka event: ", error);
  } finally {
    await producer.disconnect();
  }
}

export { sendKafkaEvent };
