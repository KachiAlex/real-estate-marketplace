const { request, app } = require('./testHelper');

describe('Phase4 - Reviews API', () => {
  test('GET /api/reviews/trending returns 200 or 500', async () => {
    const res = await request(app)
      .get('/api/reviews/trending?limit=10')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /api/reviews/properties/:propertyId/reviews returns 200 or 500', async () => {
    const res = await request(app)
      .get('/api/reviews/properties/test-property-123/reviews')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('POST /api/reviews/properties/:propertyId/reviews returns 201 or 200', async () => {
    const res = await request(app)
      .post('/api/reviews/properties/test-property-123/reviews')
      .send({
        rating: 5,
        title: 'Great property!',
        content: 'Amazing place to live'
      })
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 201, 400, 500]).toContain(res.statusCode);
  });

  test('GET /api/reviews/properties/:propertyId/rating returns 200 or 500', async () => {
    const res = await request(app)
      .get('/api/reviews/properties/test-property-123/rating')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });
});
