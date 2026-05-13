import { Storage } from "@google-cloud/storage";
import { z } from "zod";

const storageEnvSchema = z.object({
  GCS_BUCKET: z.string().min(1),
  GCS_CLIENT_EMAIL: z.string().min(1),
  GCS_PRIVATE_KEY: z.string().min(1),
  GCS_PROJECT_ID: z.string().min(1),
  GCS_PUBLIC_BASE_URL: z.string().url().optional(),
});

let cachedStorage: Storage | null = null;

function isStorageConfigured(): boolean {
  return !!(
    process.env.GCS_BUCKET &&
    process.env.GCS_CLIENT_EMAIL &&
    process.env.GCS_PRIVATE_KEY &&
    process.env.GCS_PROJECT_ID
  );
}

function getStorageConfig() {
  return storageEnvSchema.parse({
    GCS_BUCKET: process.env.GCS_BUCKET,
    GCS_CLIENT_EMAIL: process.env.GCS_CLIENT_EMAIL,
    GCS_PRIVATE_KEY: process.env.GCS_PRIVATE_KEY,
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
    GCS_PUBLIC_BASE_URL: process.env.GCS_PUBLIC_BASE_URL || undefined,
  });
}

function getStorageClient(): Storage {
  if (cachedStorage) {
    return cachedStorage;
  }

  const config = getStorageConfig();

  cachedStorage = new Storage({
    projectId: config.GCS_PROJECT_ID,
    credentials: {
      client_email: config.GCS_CLIENT_EMAIL,
      private_key: config.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
  });

  return cachedStorage;
}

function getBucket() {
  return getStorageClient().bucket(getStorageConfig().GCS_BUCKET);
}

export { storageEnvSchema, cachedStorage, getStorageConfig, getStorageClient, getBucket, isStorageConfigured };
