/**
 * Unit tests for OpenAPI/Swagger documentation
 *
 * TDD: These tests verify that OpenAPI spec is generated correctly
 * and includes all API endpoints with proper schemas.
 *
 * T098: Create API documentation (OpenAPI spec updates, README)
 */

import { generateOpenAPISpec } from '../../../src/api/openapi';

describe('OpenAPI Specification', () => {
  it('should generate valid OpenAPI 3.0 spec', () => {
    const spec = generateOpenAPISpec();

    expect(spec).toHaveProperty('openapi');
    expect(spec.openapi).toBe('3.0.0');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('paths');
  });

  it('should include API information', () => {
    const spec = generateOpenAPISpec();

    expect(spec.info).toMatchObject({
      title: 'Story Evaluation API',
      version: '1.0.0',
      description: expect.any(String),
    });
  });

  it('should include POST /v1/evaluations endpoint', () => {
    const spec = generateOpenAPISpec();

    expect(spec.paths).toHaveProperty('/v1/evaluations');
    expect(spec.paths['/v1/evaluations']).toHaveProperty('post');
    expect(spec.paths['/v1/evaluations'].post).toMatchObject({
      summary: expect.any(String),
      requestBody: expect.any(Object),
      responses: expect.any(Object),
    });
  });

  it('should include GET /v1/evaluations/:id endpoint', () => {
    const spec = generateOpenAPISpec();

    expect(spec.paths).toHaveProperty('/v1/evaluations/{id}');
    expect(spec.paths['/v1/evaluations/{id}']).toHaveProperty('get');
    expect(spec.paths['/v1/evaluations/{id}'].get).toMatchObject({
      summary: expect.any(String),
      parameters: expect.any(Array),
      responses: expect.any(Object),
    });
  });

  it('should include GET /v1/metrics endpoint', () => {
    const spec = generateOpenAPISpec();

    expect(spec.paths).toHaveProperty('/v1/metrics');
    expect(spec.paths['/v1/metrics']).toHaveProperty('get');
    expect(spec.paths['/v1/metrics'].get).toMatchObject({
      summary: expect.any(String),
      parameters: expect.any(Array),
      responses: expect.any(Object),
    });
  });

  it('should include GET /health endpoint', () => {
    const spec = generateOpenAPISpec();

    expect(spec.paths).toHaveProperty('/health');
    expect(spec.paths['/health']).toHaveProperty('get');
  });

  it('should define request/response schemas', () => {
    const spec = generateOpenAPISpec();

    expect(spec).toHaveProperty('components');
    expect(spec.components).toHaveProperty('schemas');
    expect(spec.components.schemas).toHaveProperty('EvaluationSubmission');
    expect(spec.components.schemas).toHaveProperty('EvaluationResponse');
    expect(spec.components.schemas).toHaveProperty('ErrorResponse');
  });

  it('should include error response schemas', () => {
    const spec = generateOpenAPISpec();

    const errorSchema = spec.components.schemas.ErrorResponse;
    expect(errorSchema).toMatchObject({
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
      },
    });
  });
});
