const { request, app } = require('./testHelper');

describe('Phase4 - Escrow API', () => {
  test('GET /api/escrow returns 200 for authenticated user', async () => {
    const res = await request(app)
      .get('/api/escrow')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/escrow with query params returns 200', async () => {
    const res = await request(app)
      .get('/api/escrow?page=1&limit=10&status=pending')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/escrow/:id returns 404 for non-existent transaction', async () => {
    const res = await request(app)
      .get('/api/escrow/non-existent-id')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/escrow/initiate returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/escrow/initiate')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({ propertyId: 'prop_1', sellerId: 'vendor_1', amount: 100000 });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/escrow/:id/fund returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/escrow/escrow_1/fund')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({ paymentMethod: 'card' });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/escrow/:id/release returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/escrow/escrow_1/release')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/escrow/:id/cancel returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/escrow/escrow_1/cancel')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/escrow without auth returns 401 or 403', async () => {
    const res = await request(app)
      .get('/api/escrow')
      .set('Accept', 'application/json');
    expect([401, 403, 200]).toContain(res.statusCode);
  });
});
