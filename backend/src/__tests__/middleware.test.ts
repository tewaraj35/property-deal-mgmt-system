import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

describe('Auth middleware — token formats', () => {
  it('rejects empty Authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/buyers')
      .set('Authorization', '')
    expect(res.status).toBe(401)
  })

  it('rejects Authorization header without Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/v1/buyers')
      .set('Authorization', 'some-token-without-bearer')
    expect(res.status).toBe(401)
  })

  it('rejects Bearer with empty token', async () => {
    const res = await request(app)
      .get('/api/v1/buyers')
      .set('Authorization', 'Bearer ')
    expect(res.status).toBe(401)
  })

  it('rejects clearly invalid JWT structure', async () => {
    const res = await request(app)
      .get('/api/v1/buyers')
      .set('Authorization', 'Bearer aaa.bbb.ccc')
    expect(res.status).toBe(401)
  })
})

describe('CORS headers', () => {
  it('includes CORS header on health check', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})

describe('Content-Type handling', () => {
  it('returns JSON error response for 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route-xyz')
    expect(res.headers['content-type']).toMatch(/json/)
    expect(res.body).toHaveProperty('status', 'error')
  })
})
