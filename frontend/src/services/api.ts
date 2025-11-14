/**
 * API client service
 *
 * Handles communication with the backend API for evaluation submissions.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface EvaluationSubmission {
  email: string;
  url?: string;
  files?: File[];
  targetAudience?: string;
}

export interface EvaluationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submitted_at: string;
  estimated_completion_time: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * Submit content for evaluation
 */
export async function submitEvaluation(
  submission: EvaluationSubmission
): Promise<EvaluationResponse> {
  const formData = new FormData();

  // Add required email
  formData.append('email', submission.email);

  // Add optional URL
  if (submission.url) {
    formData.append('url', submission.url);
  }

  // Add optional files
  if (submission.files && submission.files.length > 0) {
    for (const file of submission.files) {
      formData.append('files', file);
    }
  }

  // Add optional target audience
  if (submission.targetAudience) {
    formData.append('user_provided_audience', submission.targetAudience);
  }

  try {
    const response = await apiClient.post<EvaluationResponse>('/evaluations', formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response) {
        // Server responded with error status
        throw new Error(
          axiosError.response.data?.message || axiosError.response.statusText || 'Request failed'
        );
      } else if (axiosError.request) {
        // Request made but no response received
        throw new Error('Network error: No response from server');
      }
    }
    // Unknown error
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

/**
 * Get evaluation status by ID
 */
export async function getEvaluationStatus(id: string): Promise<EvaluationResponse> {
  try {
    const response = await apiClient.get<EvaluationResponse>(`/evaluations/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response) {
        throw new Error(
          axiosError.response.data?.message || axiosError.response.statusText || 'Request failed'
        );
      } else if (axiosError.request) {
        throw new Error('Network error: No response from server');
      }
    }
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}


