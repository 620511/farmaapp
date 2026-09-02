const request = require('supertest');
const app = require('../src/app');

describe('Validação de registro (Zod)', () => {
  it('rejeita e-mail inválido com 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Teste',
      email: 'nao-e-um-email',
      password: '123456'
    });
    expect(res.status).toBe(400);
  });

  it('rejeita senha curta com 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Teste',
      email: 'teste@example.com',
      password: '123'
    });
    expect(res.status).toBe(400);
  });
});

describe('Validação de login (Zod)', () => {
  it('rejeita corpo vazio com 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
