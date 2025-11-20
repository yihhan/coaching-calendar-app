const request = require('supertest');
const app = require('../index');

describe('API Endpoints', () => {
  test('GET /api/sessions/available returns sessions', async () => {
    const response = await request(app)
      .get('/api/sessions/available')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/auth/login requires email and password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/auth/register requires all fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('GET /api/profile requires authentication', async () => {
    const response = await request(app)
      .get('/api/profile')
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/sessions requires authentication', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .send({
        title: 'Test Session',
        description: 'Test Description',
        start_time: '2025-01-01T10:00',
        end_time: '2025-01-01T11:00',
        max_students: 5,
        price: 50
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
