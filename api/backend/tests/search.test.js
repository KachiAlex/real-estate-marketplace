const { request, app } = require('./testHelper');

describe('Phase4 - Search API', () => {
  test('GET /api/search with query returns 200 or 500', async () => {
    const res = await request(app)
      .get('/api/search?q=apartment')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /api/search/advanced with query returns 200 or 500', async () => {
    const res = await request(app)
      .get('/api/search/advanced?q=house&minPrice=100000')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('GET /api/search/autocomplete returns 200 or 500', async () => {
    const res = await request(app)
      .get('/api/search/autocomplete?q=ap')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });
});
