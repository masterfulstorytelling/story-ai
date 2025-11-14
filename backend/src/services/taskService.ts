import { CloudTasksClient } from '@google-cloud/tasks';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let tasksClient: CloudTasksClient | null = null;

export function getTasksClient(): CloudTasksClient {
  if (!tasksClient) {
    try {
      tasksClient = new CloudTasksClient();
      logger.info('Cloud Tasks client initialized', {
        projectId: env.gcpProjectId,
        location: env.cloudTasksLocation,
        queue: env.cloudTasksQueue,
      });
    } catch (error) {
      logger.error('Failed to initialize Cloud Tasks client', error);
      throw error;
    }
  }
  return tasksClient;
}

export interface TaskPayload {
  submissionId: string;
  [key: string]: unknown;
}

export async function createTask(payload: TaskPayload): Promise<string> {
  const client = getTasksClient();
  const project = env.gcpProjectId;
  const queue = env.cloudTasksQueue;
  const location = env.cloudTasksLocation;
  const parent = client.queuePath(project, location, queue);

  // Cloud Task should call the backend handler, which then orchestrates
  // the full processing pipeline (AI processing + report delivery)
  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: `${env.backendUrl}/v1/tasks/process`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
    },
  };

  try {
    const [response] = await client.createTask({ parent, task });
    logger.info('Cloud Task created', {
      taskName: response.name,
      submissionId: payload.submissionId,
    });
    return response.name || '';
  } catch (error) {
    logger.error('Failed to create Cloud Task', error, { submissionId: payload.submissionId });
    throw error;
  }
}
