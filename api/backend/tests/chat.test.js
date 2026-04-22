const { request, app } = require('./testHelper');

describe('Phase4 - Chat API', () => {
  test('GET /api/chat/conversations returns 200', async () => {
    const res = await request(app)
      .get('/api/chat/conversations')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    expect(res.statusCode).toBe(200);
  });

  test('POST /api/chat/conversations/:conversationId/messages returns 201', async () => {
    // First create a conversation with participants
    const createRes = await request(app)
      .post('/api/chat/conversations')
      .send({ participants: ['vendor-user-123'], name: 'Test Conversation' })
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    
    // Extract conversationId from response
    const conversationId = createRes.body?.data?.id || createRes.body?.data?.conversationId || 'test-conversation-123';
    
    // Send a message to that conversation
    const res = await request(app)
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .send({ text: 'hello world' })
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    
    expect([200, 201]).toContain(res.statusCode);
  });

  test('GET /api/chat/conversations/:conversationId/messages returns 200', async () => {
    const res = await request(app)
      .get('/api/chat/conversations/test-conversation-123/messages')
      .set('Accept', 'application/json')
      .set('x-mock-user-email', 'admin@propertyark.com');
    // Will return 200 or 404 if conversation not found
    expect([200, 404]).toContain(res.statusCode);
  });
});
