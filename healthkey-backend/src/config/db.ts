import mongoose from 'mongoose';
import { env } from './env.js';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 20000;

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectMongo(): Promise<void> {
  mongoose.set('strictQuery', true);

  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    family: 4
  };

  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await mongoose.connect(env.mongoUri, options);
      console.log(`MongoDB connected (${env.mongoUri})`);
      return;
    } catch (err) {
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${(err as Error).message}`
      );
      if (attempt >= MAX_ATTEMPTS) {
        console.error(
          'MongoDB is unreachable after several attempts. ' +
            'Check that the hk-mongo podman container is running (podman ps) and MONGO_URI in .env is correct.'
        );
        throw err;
      }
      await wait(delay);
      attempt += 1;
    }
  }
}