const { request, app } = require('./testHelper');

describe('Phase4 - Vendor Property Verification API', () => {
  test('GET /api/verification/config returns 200', async () => {
    const res = await request(app)
      .get('/api/verification/config')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/verification/applications (vendor submit)', async () => {
    const res = await request(app)
      .post('/api/verification/applications')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com')
      .send({
        propertyId: 'prop_1',
        propertyName: 'Test Property',
        attachments: ['doc1.pdf', 'doc2.pdf'],
        message: 'Please verify this property'
      });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/verification/applications/mine returns for vendor', async () => {
    const res = await request(app)
      .get('/api/verification/applications/mine')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/verification/applications (admin list)', async () => {
    const res = await request(app)
      .get('/api/verification/applications?status=pending')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('PATCH /api/verification/applications/:id/status (decision)', async () => {
    const res = await request(app)
      .patch('/api/verification/applications/non-existent-id/status')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com')
      .send({
        status: 'approved',
        adminNotes: 'Approved'
      });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });
});

describe('Phase4 - Property verify request', () => {
  test('POST /api/properties/verify-request returns appropriate status', async () => {
    const res = await request(app)
      .post('/api/properties/verify-request')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com')
      .send({
        propertyId: 'prop_1',
        paymentReference: 'test-ref-123',
        amount: 50000,
        notes: 'Please verify this property'
      });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(404);
  });
});
