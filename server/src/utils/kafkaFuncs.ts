import { Kafka, Partitioners } from "kafkajs";
import { GitAnalysisMeta } from "../types/kafkameta.type.js";

import dotenv from "dotenv";

dotenv.config();

const { KAFKA_IP } = process.env;

const kafka = new Kafka({
  clientId: "my-backend",
  brokers: [`${KAFKA_IP}:9092`], // Kafka broker URL
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

async function sendKafkaEvent(eventType: string, metadata: GitAnalysisMeta) {
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
