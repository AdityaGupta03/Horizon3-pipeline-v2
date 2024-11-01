import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-backend",
  brokers: ["192.168.4.63:9092"], // Kafka broker URL
});

const producer = kafka.producer();

async function sendKafkaEvent(eventType, metadata) {
  console.log("sendKafkaEvent()...");
  let status;

  try {
    // throw new Error();

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
    status = true;
  } catch (error) {
    console.error("Error posting Kafka event: ", error);
    status = false;
  } finally {
    await producer.disconnect();
  }

  return status;
}

export { sendKafkaEvent };
