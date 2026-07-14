const express = require('express');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { sign } = require('jsonwebtoken');

const mockUserStoreById = new Map();
const mockUserIdByEmail = new Map();

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const normalizeRoles = (roles, role) => {
  const arr = Array.isArray(roles) && roles.length ? roles : [role || 'user'];
  const normalized = Array.from(new Set(arr.map((r) => String(r).trim().toLowerCase()).filter(Boolean)));
  if (!normalized.includes('user')) normalized.push('user');
  return normalized;
};

const makeInstance = (id) => ({
  toJSON() {
    return clone(mockUserStoreById.get(id));
  },
  async update(updates) {
    const current = mockUserStoreById.get(id);
    if (!current) return this;
    const next = { ...current, ...updates };
    if (updates.activeRole) next.activeRole = updates.activeRole;
    if (!next.activeRole) next.activeRole = next.role || (Array.isArray(next.roles) && next.roles[0]) || 'user';
    if (!next.role) next.role = next.activeRole || (Array.isArray(next.roles) && next.roles[0]) || 'user';
    mockUserStoreById.set(id, next);
    return this;
  }
});

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId, roles: decoded.roles || ['user'] };
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }
}));

jest.mock('../config/sequelizeDb', () => ({
  User: {
    async findByPk(id) {
      if (!id || !mockUserStoreById.has(id)) return null;
      return makeInstance(id);
    }
  }
}));

jest.mock('../utils/roleUtils', () => ({
  normalizeRoles: (roles) => {
    const arr = Array.isArray(roles) && roles.length ? roles : ['user'];
    const normalized = Array.from(new Set(arr.map((r) => String(r).trim().toLowerCase()).filter(Boolean)));
    if (!normalized.includes('user')) normalized.unshift('user');
    return normalized;
  },
  chooseActiveRole: (roles, active) => active || (Array.isArray(roles) && roles[0]) || 'user'
}));

const usersRouter = require('../routes/users');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRouter);
  return app;
};

const makeToken = (userId, roles = ['user']) => {
  return sign({ userId, roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('POST /api/users/switch-role endpoint', () => {
  beforeEach(() => {
    mockUserStoreById.clear();
    mockUserIdByEmail.clear();
  });

  test('switches active role for existing user with role already in roles array', async () => {
    const app = makeApp();
    const userId = 'test-user-1';
    const user = {
      id: userId,
      email: 'test1@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user', 'buyer', 'vendor'],
      role: 'buyer',
      activeRole: 'buyer',
      password: 'hashed'
    };
    mockUserStoreById.set(userId, user);

    const token = makeToken(userId, user.roles);

    const res = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'vendor' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.activeRole).toBe('vendor');
    expect(res.body.user.roles).toEqual(expect.arrayContaining(['user', 'buyer', 'vendor']));
    expect(res.body.user.email).toBe('test1@example.com');

    // Verify database was updated
    const dbUser = mockUserStoreById.get(userId);
    expect(dbUser.activeRole).toBe('vendor');
    expect(dbUser.roles).toContain('vendor');
  });

  test('adds new role to user roles array when switching to a role not yet present', async () => {
    const app = makeApp();
    const userId = 'test-user-2';
    const user = {
      id: userId,
      email: 'test2@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user', 'buyer'],
      role: 'buyer',
      activeRole: 'buyer',
      password: 'hashed'
    };
    mockUserStoreById.set(userId, user);

    const token = makeToken(userId, user.roles);

    const res = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'vendor' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.activeRole).toBe('vendor');
    expect(res.body.user.roles).toContain('vendor');
    expect(res.body.user.roles).toContain('buyer');
    expect(res.body.user.roles).toContain('user');

    // Verify database state persists
    const dbUser = mockUserStoreById.get(userId);
    expect(dbUser.activeRole).toBe('vendor');
    expect(dbUser.roles).toContain('vendor');
  });

  test('returns 400 when role is missing from request body', async () => {
    const app = makeApp();
    const userId = 'test-user-3';
    mockUserStoreById.set(userId, {
      id: userId,
      email: 'test3@example.com',
      roles: ['user'],
      activeRole: 'user',
      password: 'hashed'
    });

    const token = makeToken(userId);

    const res = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/role is required/i);
  });

  test('returns 404 when user not found', async () => {
    const app = makeApp();
    const token = makeToken('nonexistent-user');

    const res = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'vendor' })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/user not found/i);
  });

  test('dual role persistence: switching roles multiple times preserves all roles', async () => {
    const app = makeApp();
    const userId = 'test-user-4';
    const user = {
      id: userId,
      email: 'test4@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
      role: 'user',
      activeRole: 'user',
      password: 'hashed'
    };
    mockUserStoreById.set(userId, user);

    const token = makeToken(userId);

    // First switch: user -> buyer
    const res1 = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'buyer' })
      .expect(200);

    expect(res1.body.user.activeRole).toBe('buyer');
    expect(res1.body.user.roles).toContain('buyer');

    // Second switch: buyer -> vendor
    const res2 = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'vendor' })
      .expect(200);

    expect(res2.body.user.activeRole).toBe('vendor');
    expect(res2.body.user.roles).toContain('vendor');
    expect(res2.body.user.roles).toContain('buyer'); // Previous role preserved
    expect(res2.body.user.roles).toContain('user');

    // Third switch: vendor -> buyer
    const res3 = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'buyer' })
      .expect(200);

    expect(res3.body.user.activeRole).toBe('buyer');
    expect(res3.body.user.roles).toContain('vendor'); // Still preserved
    expect(res3.body.user.roles).toContain('buyer');
  });
});

describe('switch-role endpoint auth', () => {
  test('returns 401 without authorization header', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/users/switch-role')
      .send({ role: 'vendor' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('returns 401 with invalid token', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/users/switch-role')
      .set('Authorization', 'Bearer invalid-token')
      .send({ role: 'vendor' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
