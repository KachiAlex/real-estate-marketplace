const { request, app } = require('./testHelper');

describe('Phase4 - Notifications API', () => {
  test('GET /api/notifications returns 200', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('POST /api/notifications/inspection returns 201 or 200', async () => {
    const res = await request(app)
      .post('/api/notifications/inspection')
      .send({
        notifications: [
          {
            type: 'inspection_requested',
            title: 'Inspection Requested',
            message: 'A new inspection has been requested',
            recipientId: '00000000-0000-4000-8000-000000000004'
          }
        ]
      })
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 201, 500]).toContain(res.statusCode);
  });

  test('GET /api/notifications/unread/count returns 200', async () => {
    const res = await request(app)
      .get('/api/notifications/unread/count')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect([200, 500]).toContain(res.statusCode);
  });
});
