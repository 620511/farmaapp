const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('responde 200 com ok:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Rota inexistente', () => {
  it('responde 404 em rota não cadastrada', async () => {
    const res = await request(app).get('/api/rota-que-nao-existe');
    expect(res.status).toBe(404);
  });
});
