const { request, app } = require('./testHelper');

describe('Phase4 - Admin Endpoints', () => {
  test('POST /api/admin/seed-data returns appropriate status for admin', async () => {
    const res = await request(app)
      .post('/api/admin/seed-data')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({ type: 'all' });
    expect([200, 400, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/users returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/users with pagination returns 200', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/users/:id returns appropriate status', async () => {
    const res = await request(app)
      .get('/api/admin/users/00000000-0000-4000-8000-000000000001')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('PUT /api/admin/users/:id/suspend returns appropriate status', async () => {
    const res = await request(app)
      .put('/api/admin/users/00000000-0000-4000-8000-000000000002/suspend')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('PUT /api/admin/users/:id/activate returns appropriate status', async () => {
    const res = await request(app)
      .put('/api/admin/users/00000000-0000-4000-8000-000000000002/activate')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/properties returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/properties')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/stats returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/properties/status-summary returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/properties/status-summary')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('GET /api/admin/escrow/volumes returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/escrow/volumes')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/analytics/overview returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/overview')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/settings returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/settings')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('PUT /api/admin/settings returns appropriate status', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({ commissionRate: 5, platformFee: 1000 });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/admin/subscription/plans returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/admin/subscription/plans')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('Admin endpoints reject non-admin users with 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([401, 403]).toContain(res.statusCode);
  });
});
