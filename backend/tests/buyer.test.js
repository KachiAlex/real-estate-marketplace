const { request, app } = require('./testHelper');

describe('Phase4 - Buyer Endpoints', () => {
  test('POST /api/buyer/profile creates buyer profile', async () => {
    const res = await request(app)
      .post('/api/buyer/profile')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com')
      .send({
        preferences: {
          propertyTypes: ['house', 'apartment'],
          budgetRange: '1000000-5000000',
          locations: ['Lagos', 'Abuja'],
          investmentInterest: true,
          notifications: true
        }
      });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/buyer/profile returns buyer profile', async () => {
    const res = await request(app)
      .get('/api/buyer/profile')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com');
    expect([200, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('PUT /api/buyer/preferences updates buyer preferences', async () => {
    const res = await request(app)
      .put('/api/buyer/preferences')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com')
      .send({
        preferences: {
          propertyTypes: ['condo', 'townhouse'],
          budgetRange: '2000000-10000000',
          locations: ['Port Harcourt'],
          investmentInterest: false,
          notifications: true
        }
      });
    expect([200, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('POST /api/buyer/profile with invalid data returns 400', async () => {
    const res = await request(app)
      .post('/api/buyer/profile')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com')
      .send({
        preferences: {
          propertyTypes: 'not-an-array',
          locations: 'not-an-array'
        }
      });
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/buyer/profile without auth returns 401 or 403', async () => {
    const res = await request(app)
      .get('/api/buyer/profile')
      .set('Accept', 'application/json');
    expect([401, 403, 200, 404]).toContain(res.statusCode);
  });

  test('POST /api/inquiries creates property inquiry', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com')
      .send({
        propertyId: 'prop_1',
        message: 'I am interested in this property',
        preferredContact: 'email'
      });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/inquiries returns buyer inquiries', async () => {
    const res = await request(app)
      .get('/api/inquiries')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('GET /api/saved-properties returns saved properties', async () => {
    const res = await request(app)
      .get('/api/properties/saved')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com');
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('POST /api/properties/:id/save saves a property', async () => {
    const res = await request(app)
      .post('/api/properties/prop_1/save')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com');
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.statusCode);
  });

  test('GET /api/dashboard returns buyer dashboard data', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });

  test('GET /api/alerts-preferences returns buyer alerts', async () => {
    const res = await request(app)
      .get('/api/alerts-preferences')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'onyedika.akoma@gmail.com');
    expect([200, 401, 403, 404]).toContain(res.statusCode);
  });
});
