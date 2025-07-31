import amqp from 'amqplib';
import dotenv from 'dotenv';
import { sendEmail } from './sendEmail.js';



const QUEUE = 'email_priority_queue';
const MAX_EMAILS_PER_MINUTE = 10;
const DELAY_MS = 60000 / MAX_EMAILS_PER_MINUTE;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startEmailWorker() {
  dotenv.config({ path: './.env' });
  if (!process.env.RABBITMQ_URL) {
    throw new Error('Missing RABBITMQ_URL in environment variables.');
  }

  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: { 'x-max-priority': 10 },
    });
    channel.prefetch(1);

    console.log('📨 Email Worker started. Processing max 10 emails per minute with priority...');

    async function processNextMessage() {
      const msg = await channel.get(QUEUE, { noAck: false });

      if (msg) {
        try {
          const { to, subject, html, text } = JSON.parse(msg.content.toString());

          await sendEmail({
            email: to,
            subject,
            html,
          });

          console.log(`✅ Email sent to ${to}`);
          channel.ack(msg);
        } catch (err) {
          console.error(`❌ Email sending failed:`, err.message);
          channel.nack(msg, false, false); // discard the message
        }

        await sleep(DELAY_MS);
      }

      setImmediate(processNextMessage);
    }

    processNextMessage();

    process.on('SIGINT', async () => {
      console.log('\n👋 Gracefully shutting down...');
      await channel.close();
      await conn.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Worker initialization error:', error);
  }
}

startEmailWorker();
