import request from 'supertest';
import express from 'express';
import routes from '../../../src/api/routes';

const app = express();
app.use('/v1', routes);

describe('Health Check Endpoint', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
  });
});

