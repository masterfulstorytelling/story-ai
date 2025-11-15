import * as dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  gcpProjectId: string;
  firestoreProjectId: string;
  cloudStorageBucket: string;
  sendgridApiKey: string;
  sendgridFromEmail?: string;
  cloudTasksQueue: string;
  cloudTasksLocation: string;
  aiProcessingUrl: string;
  backendUrl: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key];
}

export function loadEnvConfig(): EnvConfig {
  return {
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    gcpProjectId: getEnvVar('GCP_PROJECT_ID'),
    firestoreProjectId: getEnvVar('FIRESTORE_PROJECT_ID'),
    cloudStorageBucket: getEnvVar('CLOUD_STORAGE_BUCKET'),
    sendgridApiKey: getEnvVar('SENDGRID_API_KEY'),
    sendgridFromEmail: getOptionalEnvVar('SENDGRID_FROM_EMAIL'),
    cloudTasksQueue: getEnvVar('CLOUD_TASKS_QUEUE'),
    cloudTasksLocation: getEnvVar('CLOUD_TASKS_LOCATION'),
    aiProcessingUrl: getEnvVar('AI_PROCESSING_URL', 'http://localhost:8000'),
    backendUrl: getEnvVar('BACKEND_URL', 'http://localhost:3000'),
  };
}

// Lazy initialization: only load config when accessed, not at module load time
// This allows tests to set environment variables before accessing env
let _env: EnvConfig | null = null;

export const env: EnvConfig = new Proxy({} as EnvConfig, {
  get(_target, prop: keyof EnvConfig) {
    if (!_env) {
      _env = loadEnvConfig();
    }
    return _env[prop];
  },
});
