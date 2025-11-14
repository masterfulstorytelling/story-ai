import * as dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  gcpProjectId: string;
  firestoreProjectId: string;
  cloudStorageBucket: string;
  sendgridApiKey: string;
  cloudTasksQueue: string;
  cloudTasksLocation: string;
  aiProcessingUrl: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

export function loadEnvConfig(): EnvConfig {
  return {
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    gcpProjectId: getEnvVar('GCP_PROJECT_ID'),
    firestoreProjectId: getEnvVar('FIRESTORE_PROJECT_ID'),
    cloudStorageBucket: getEnvVar('CLOUD_STORAGE_BUCKET'),
    sendgridApiKey: getEnvVar('SENDGRID_API_KEY'),
    cloudTasksQueue: getEnvVar('CLOUD_TASKS_QUEUE'),
    cloudTasksLocation: getEnvVar('CLOUD_TASKS_LOCATION'),
    aiProcessingUrl: getEnvVar('AI_PROCESSING_URL', 'http://localhost:8000'),
  };
}

export const env = loadEnvConfig();
