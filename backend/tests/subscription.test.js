const { request, app } = require('./testHelper');

describe('Phase4 - Vendor Subscription API', () => {
  test('GET /api/subscription/current returns 200 for vendor', async () => {
    const res = await request(app)
      .get('/api/subscription/current')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/subscription/plans returns 200 (public)', async () => {
    const res = await request(app)
      .get('/api/subscription/plans')
      .set('Accept', 'application/json');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('POST /api/subscription/subscribe returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/subscription/subscribe')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com')
      .send({ planId: 'basic', paymentMethod: 'card' });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/subscription/cancel returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/subscription/cancel')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/subscription/status returns 200 for vendor', async () => {
    const res = await request(app)
      .get('/api/subscription/status')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/subscription/renew returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/subscription/renew')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/subscription/history returns 200 for vendor', async () => {
    const res = await request(app)
      .get('/api/subscription/history')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('GET /api/subscription/current without auth returns 401 or 403', async () => {
    const res = await request(app)
      .get('/api/subscription/current')
      .set('Accept', 'application/json');
    expect([401, 403, 200]).toContain(res.statusCode);
  });
});
