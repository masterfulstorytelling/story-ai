import { Storage } from '@google-cloud/storage';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let storageInstance: Storage | null = null;

export function getStorage(): Storage {
  if (!storageInstance) {
    try {
      storageInstance = new Storage({
        projectId: env.gcpProjectId,
      });
      logger.info('Cloud Storage client initialized', {
        projectId: env.gcpProjectId,
        bucket: env.cloudStorageBucket,
      });
    } catch (error) {
      logger.error('Failed to initialize Cloud Storage client', error);
      throw error;
    }
  }
  return storageInstance;
}

export function getBucket(bucketName: string = env.cloudStorageBucket) {
  return getStorage().bucket(bucketName);
}

// Bucket names
export const BUCKETS = {
  UPLOADS: 'storyai-uploads',
  REPORTS: 'storyai-reports',
  SCRAPED: 'storyai-scraped',
} as const;

