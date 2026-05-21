import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /api/v1', () => {
  it('returns API info', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Nesh Property Management API');
  });
});

describe('Auth middleware', () => {
  it('returns 401 when no token on protected route', async () => {
    const res = await request(app).get('/api/v1/buyers');
    expect(res.status).toBe(401);
  });

  it('returns 401 when malformed token on protected route', async () => {
    const res = await request(app)
      .get('/api/v1/buyers')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'secret' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});
