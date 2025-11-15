/**
 * OpenAPI/Swagger specification generator
 *
 * Generates OpenAPI 3.0 specification for the Story Evaluation API
 *
 * T098: Create API documentation (OpenAPI spec updates, README)
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Story Evaluation API',
      version: '1.0.0',
      description:
        'API for submitting corporate storytelling content for AI-powered evaluation. ' +
        'Supports URL and file uploads, returns comprehensive evaluation reports.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.storyeval.example.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        EvaluationSubmission: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address for receiving the evaluation report',
              example: 'user@example.com',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL of the website to evaluate (optional if files are provided)',
              example: 'https://example.com',
            },
            user_provided_audience: {
              type: 'string',
              description: 'Optional target audience description',
              example: 'Enterprise CTOs and technical decision makers',
            },
          },
        },
        FileUpload: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary',
              },
              description: 'PDF, PPTX, or DOCX files to evaluate (max 50MB each)',
            },
          },
        },
        EvaluationResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique evaluation request ID',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
              description: 'Current status of the evaluation',
            },
            submitted_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the evaluation was submitted',
            },
            estimated_completion_time: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated time when the evaluation will be completed',
            },
            message: {
              type: 'string',
              description: 'Human-readable status message',
            },
          },
        },
        EvaluationStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
            },
            submitted_at: {
              type: 'string',
              format: 'date-time',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            url: {
              type: 'string',
              format: 'uri',
            },
            processing_started_at: {
              type: 'string',
              format: 'date-time',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
            },
            error_message: {
              type: 'string',
            },
            estimated_completion_time: {
              type: 'string',
              format: 'date-time',
            },
            result: {
              type: 'object',
              properties: {
                audiences: {
                  type: 'array',
                  items: { type: 'object' },
                },
                assessments: {
                  type: 'object',
                },
                report: {
                  type: 'object',
                  nullable: true,
                },
                validated_citations: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
          },
        },
        MetricsResponse: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalSubmissions: { type: 'number' },
                successRate: { type: 'number' },
                averageProcessingTimeMs: { type: 'number' },
                medianProcessingTimeMs: { type: 'number' },
                minProcessingTimeMs: { type: 'number' },
                maxProcessingTimeMs: { type: 'number' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
            metrics: {
              type: 'object',
              properties: {
                processingTimes: { type: 'number' },
                submissions: { type: 'number' },
                totalSubmissions: { type: 'number' },
                successfulSubmissions: { type: 'number' },
                failedSubmissions: { type: 'number' },
                successRate: { type: 'number' },
                averageProcessingTimeMs: { type: 'number' },
                medianProcessingTimeMs: { type: 'number' },
                minProcessingTimeMs: { type: 'number' },
                maxProcessingTimeMs: { type: 'number' },
              },
            },
            timeWindowMs: {
              type: 'number',
              nullable: true,
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error code',
              example: 'VALIDATION_ERROR',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
              example: 'Email is required',
            },
            details: {
              type: 'object',
              description: 'Additional error details (development only)',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    paths: {
      '/v1/evaluations': {
        post: {
          summary: 'Submit content for evaluation',
          description:
            'Submit a website URL and/or files (PDF, PPTX, DOCX) for AI-powered storytelling evaluation. ' +
            'Returns a submission ID and estimated completion time.',
          tags: ['Evaluations'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/EvaluationSubmission' },
                    { $ref: '#/components/schemas/FileUpload' },
                  ],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Evaluation submitted successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/EvaluationResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/v1/evaluations/{id}': {
        get: {
          summary: 'Get evaluation status and results',
          description:
            'Retrieve the current status and results of an evaluation request. ' +
            'Returns detailed results when processing is complete.',
          tags: ['Evaluations'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid',
              },
              description: 'Evaluation request ID',
            },
          ],
          responses: {
            '200': {
              description: 'Evaluation status retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/EvaluationStatus',
                  },
                },
              },
            },
            '404': {
              description: 'Evaluation not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/v1/metrics': {
        get: {
          summary: 'Get performance metrics',
          description:
            'Retrieve performance metrics including processing times, success rates, and submission statistics.',
          tags: ['Metrics'],
          parameters: [
            {
              name: 'window',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 0,
              },
              description: 'Time window in milliseconds (optional)',
              example: 3600000,
            },
          ],
          responses: {
            '200': {
              description: 'Metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/MetricsResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid parameter',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check if the API is running and healthy',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We're defining the spec directly, not from JSDoc comments
};

export function generateOpenAPISpec(): swaggerJsdoc.SwaggerDefinition {
  return swaggerJsdoc(options) as swaggerJsdoc.SwaggerDefinition;
}
