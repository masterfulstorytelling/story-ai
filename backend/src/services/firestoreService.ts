import { Firestore } from '@google-cloud/firestore';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let firestoreInstance: Firestore | null = null;

export function getFirestore(): Firestore {
  if (!firestoreInstance) {
    try {
      firestoreInstance = new Firestore({
        projectId: env.firestoreProjectId,
      });
      logger.info('Firestore client initialized', { projectId: env.firestoreProjectId });
    } catch (error) {
      logger.error('Failed to initialize Firestore client', error);
      throw error;
    }
  }
  return firestoreInstance;
}

// Collection names
export const COLLECTIONS = {
  EVALUATION_REQUESTS: 'evaluation_requests',
  SCRAPED_CONTENT: 'scraped_content',
  PARSED_CONTENT: 'parsed_content',
  AUDIENCES: 'audiences',
  EVALUATIONS: 'evaluations',
  REPORTS: 'reports',
} as const;

