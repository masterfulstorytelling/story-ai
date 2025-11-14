import { loadEnvConfig } from '../../../src/config/env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load all required environment variables', () => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.FIRESTORE_PROJECT_ID = 'test-firestore';
    process.env.CLOUD_STORAGE_BUCKET = 'test-bucket';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.CLOUD_TASKS_QUEUE = 'test-queue';
    process.env.CLOUD_TASKS_LOCATION = 'us-east1';
    process.env.AI_PROCESSING_URL = 'http://localhost:8000';

    const config = loadEnvConfig();

    expect(config.gcpProjectId).toBe('test-project');
    expect(config.firestoreProjectId).toBe('test-firestore');
    expect(config.cloudStorageBucket).toBe('test-bucket');
    expect(config.sendgridApiKey).toBe('test-sendgrid-key');
    expect(config.cloudTasksQueue).toBe('test-queue');
    expect(config.cloudTasksLocation).toBe('us-east1');
    expect(config.aiProcessingUrl).toBe('http://localhost:8000');
  });

  it('should use default PORT when not provided', () => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.FIRESTORE_PROJECT_ID = 'test-firestore';
    process.env.CLOUD_STORAGE_BUCKET = 'test-bucket';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.CLOUD_TASKS_QUEUE = 'test-queue';
    process.env.CLOUD_TASKS_LOCATION = 'us-east1';
    delete process.env.PORT;

    const config = loadEnvConfig();

    expect(config.port).toBe(3000);
  });

  it('should use default NODE_ENV when not provided', () => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.FIRESTORE_PROJECT_ID = 'test-firestore';
    process.env.CLOUD_STORAGE_BUCKET = 'test-bucket';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.CLOUD_TASKS_QUEUE = 'test-queue';
    process.env.CLOUD_TASKS_LOCATION = 'us-east1';
    delete process.env.NODE_ENV;

    const config = loadEnvConfig();

    expect(config.nodeEnv).toBe('development');
  });

  it('should use default AI_PROCESSING_URL when not provided', () => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.FIRESTORE_PROJECT_ID = 'test-firestore';
    process.env.CLOUD_STORAGE_BUCKET = 'test-bucket';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.CLOUD_TASKS_QUEUE = 'test-queue';
    process.env.CLOUD_TASKS_LOCATION = 'us-east1';
    delete process.env.AI_PROCESSING_URL;

    const config = loadEnvConfig();

    expect(config.aiProcessingUrl).toBe('http://localhost:8000');
  });

  it('should throw error when required variable is missing', () => {
    delete process.env.GCP_PROJECT_ID;
    process.env.FIRESTORE_PROJECT_ID = 'test-firestore';
    process.env.CLOUD_STORAGE_BUCKET = 'test-bucket';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.CLOUD_TASKS_QUEUE = 'test-queue';
    process.env.CLOUD_TASKS_LOCATION = 'us-east1';

    expect(() => loadEnvConfig()).toThrow('Missing required environment variable: GCP_PROJECT_ID');
  });

  it('should parse PORT as integer', () => {
    process.env.PORT = '8080';
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.FIRESTORE_PROJECT_ID = 'test-firestore';
    process.env.CLOUD_STORAGE_BUCKET = 'test-bucket';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.CLOUD_TASKS_QUEUE = 'test-queue';
    process.env.CLOUD_TASKS_LOCATION = 'us-east1';

    const config = loadEnvConfig();

    expect(config.port).toBe(8080);
    expect(typeof config.port).toBe('number');
  });
});

