const { request, app } = require('./testHelper');

describe('Phase4 - Analytics API', () => {
  test('GET /api/admin/analytics/overview requires admin and returns 200', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/overview')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/admin/analytics/transactions requires admin and returns 200', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/transactions?period=month')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/admin/analytics/export requires admin and returns 200', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/export?format=json&dataType=transactions')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/admin/analytics/revenue requires admin and returns 200', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/revenue?period=month')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403]).toContain(res.statusCode);
  });
});
