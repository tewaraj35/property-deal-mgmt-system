import request from 'supertest'
import { createApp } from '../app'

const app = createApp()

describe('Stats endpoints — auth guard', () => {
  it('GET /api/v1/stats returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/stats')
    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })

  it('GET /api/v1/stats/recent-activity returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/stats/recent-activity')
    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })
})

describe('Export endpoints — invalid entity type with valid token shape', () => {
  // Even with a bad token, we expect 401 — not 500 (server crash)
  it('export with unknown entity + bad token returns 401, not 500', async () => {
    const res = await request(app)
      .get('/api/v1/export/unknown-entity/pdf')
      .set('Authorization', 'Bearer invalid')
    expect(res.status).toBe(401)
  })

  it('csv export with unknown entity + bad token returns 401, not 500', async () => {
    const res = await request(app)
      .get('/api/v1/export/unknown-entity/csv')
      .set('Authorization', 'Bearer invalid')
    expect(res.status).toBe(401)
  })
})
