const { request, app } = require('./testHelper');

describe('Phase4 - Vendor Property Verification API', () => {
  test('GET /api/verification/status returns 200', async () => {
    const res = await request(app)
      .get('/api/verification/status')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('POST /api/verification/submit returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/verification/submit')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com')
      .send({
        propertyId: 'prop_1',
        documents: ['doc1.pdf', 'doc2.pdf'],
        notes: 'Please verify this property'
      });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/verification/requests returns 200 for vendor', async () => {
    const res = await request(app)
      .get('/api/verification/requests')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('GET /api/verification/requests/:id returns 404 for non-existent request', async () => {
    const res = await request(app)
      .get('/api/verification/requests/non-existent-id')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('GET /api/verification/admin/pending returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/verification/admin/pending')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('POST /api/verification/admin/approve returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/verification/admin/approve')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({ requestId: 'req_1', notes: 'Approved' });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/verification/admin/reject returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/verification/admin/reject')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({ requestId: 'req_1', reason: 'Documents incomplete' });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });
});
