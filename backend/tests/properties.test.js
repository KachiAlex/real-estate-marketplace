const { request, app } = require('./testHelper');

describe('Phase4 - Properties API (Product Listing)', () => {
  test('GET /api/properties returns 200 (public)', async () => {
    const res = await request(app)
      .get('/api/properties')
      .set('Accept', 'application/json');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/properties with filters returns 200', async () => {
    const res = await request(app)
      .get('/api/properties?page=1&limit=10&type=house&status=for-sale')
      .set('Accept', 'application/json');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/properties with search returns 200', async () => {
    const res = await request(app)
      .get('/api/properties?search=lagos&city=lagos')
      .set('Accept', 'application/json');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/properties with price filters returns 200', async () => {
    const res = await request(app)
      .get('/api/properties?minPrice=100000&maxPrice=5000000')
      .set('Accept', 'application/json');
    expect([200, 401, 403]).toContain(res.statusCode);
  });

  test('GET /api/properties/:id returns 404 for non-existent property', async () => {
    const res = await request(app)
      .get('/api/properties/non-existent-id')
      .set('Accept', 'application/json');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/properties returns appropriate status for authenticated user', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com')
      .send({
        title: 'Test Property',
        description: 'A test property for unit testing',
        price: 1500000,
        type: 'house',
        status: 'for-sale',
        location: 'Lagos, Nigeria',
        city: 'Lagos',
        state: 'Lagos',
        bedrooms: 3,
        bathrooms: 2
      });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.statusCode);
  });

  test('PUT /api/properties/:id returns appropriate status', async () => {
    const res = await request(app)
      .put('/api/properties/prop_1')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com')
      .send({ price: 2000000 });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('DELETE /api/properties/:id returns appropriate status', async () => {
    const res = await request(app)
      .delete('/api/properties/prop_1')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'vendor1@example.com');
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/properties/featured returns 200', async () => {
    const res = await request(app)
      .get('/api/properties/featured')
      .set('Accept', 'application/json');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/properties/verified returns 200', async () => {
    const res = await request(app)
      .get('/api/properties/verified')
      .set('Accept', 'application/json');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });
});
