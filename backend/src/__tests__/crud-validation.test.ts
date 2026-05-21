import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

// These tests do NOT touch the database — they verify auth guards and input
// validation that short-circuit before any DB call.

describe('CRUD endpoints — auth guard', () => {
  const protectedGets = [
    '/api/v1/buyers',
    '/api/v1/sellers',
    '/api/v1/renters',
    '/api/v1/loan-clients',
    '/api/v1/stats',
    '/api/v1/stats/recent-activity',
    '/api/v1/users',
  ]

  protectedGets.forEach((path) => {
    it(`GET ${path} returns 401 without token`, async () => {
      const res = await request(app).get(path)
      expect(res.status).toBe(401)
    })
  })

  const protectedPosts = [
    '/api/v1/buyers',
    '/api/v1/sellers',
    '/api/v1/renters',
    '/api/v1/loan-clients',
  ]

  protectedPosts.forEach((path) => {
    it(`POST ${path} returns 401 without token`, async () => {
      const res = await request(app).post(path).send({ name: 'Test' })
      expect(res.status).toBe(401)
    })
  })
})

describe('Export endpoints — validation', () => {
  it('GET /api/v1/export/buyers/pdf returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/export/buyers/pdf')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/export/buyers/csv returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/export/buyers/csv')
    expect(res.status).toBe(401)
  })
})

describe('File upload endpoints — auth guard', () => {
  it('POST /api/v1/files/upload returns 401 without token', async () => {
    const res = await request(app).post('/api/v1/files/upload')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/files/entity/buyer/some-id returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/files/entity/buyer/some-id')
    expect(res.status).toBe(401)
  })
})

describe('404 handler', () => {
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.status).toBe('error')
  })
})

describe('Request body parsing', () => {
  it('returns 400 when login body is missing both fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 when login body has email but no password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@test.com' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when login body has password but no email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'secret' })
    expect(res.status).toBe(400)
  })
})
