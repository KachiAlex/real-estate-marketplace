const express = require('express');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const mockUserStoreById = new Map();
const mockUserIdByEmail = new Map();

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const normalizeRolesForStore = (roles, role) => {
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
    if (updates.roles || updates.role) {
      next.roles = normalizeRolesForStore(next.roles, next.role);
    }
    if (!next.activeRole) next.activeRole = next.role || next.roles[0] || 'user';
    if (!next.role) next.role = next.activeRole || next.roles[0] || 'user';
    mockUserStoreById.set(id, next);
    return this;
  }
});

jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../middleware/auth', () => ({
  protect: (req, _res, next) => {
    req.user = {
      id: req.headers['x-user-id'] || null,
      roles: ['user']
    };
    next();
  }
}));

jest.mock('../config/sequelizeDb', () => ({
  User: {
    async findByPk(id) {
      if (!id || !mockUserStoreById.has(id)) return null;
      return makeInstance(id);
    },
    sequelize: {
      async transaction(cb) {
        return cb({});
      }
    }
  }
}));

jest.mock('../services/userService', () => ({
  async findByEmail(email) {
    const id = mockUserIdByEmail.get(String(email || '').toLowerCase());
    if (!id) return null;
    return clone(mockUserStoreById.get(id));
  },
  async findById(id) {
    if (!id || !mockUserStoreById.has(id)) return null;
    return clone(mockUserStoreById.get(id));
  },
  async createUser(userData) {
    const email = String(userData.email || '').toLowerCase();
    if (mockUserIdByEmail.has(email)) throw new Error('User already exists with this email');

    const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const roles = normalizeRolesForStore(userData.roles, userData.role);
    const activeRole = String(userData.activeRole || userData.role || roles[0] || 'user').toLowerCase();
    const role = String(userData.role || activeRole || roles[0] || 'user').toLowerCase();

    const record = {
      id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email,
      phone: userData.phone || null,
      password: userData.password,
      role,
      roles,
      activeRole,
      avatar: userData.avatar || null,
      isVerified: !!userData.isVerified,
      isActive: userData.isActive !== false
    };

    mockUserStoreById.set(id, record);
    mockUserIdByEmail.set(email, id);
    return clone(record);
  },
  async updateUser(id, updates) {
    const current = mockUserStoreById.get(id);
    if (!current) return null;
    const next = { ...current, ...updates };
    if (updates.roles || updates.role) {
      next.roles = normalizeRolesForStore(next.roles, next.role);
    }
    if (!next.activeRole) next.activeRole = next.role || next.roles[0] || 'user';
    if (!next.role) next.role = next.activeRole || next.roles[0] || 'user';
    mockUserStoreById.set(id, next);
    return clone(next);
  },
  async comparePassword(candidate, stored) {
    return candidate === stored;
  },
  async hashPassword(p) {
    return p;
  }
}));

const authRouter = require('../routes/auth');
const usersRouter = require('../routes/users');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  return app;
};

describe('Dual Role Persistence E2E', () => {
  beforeEach(() => {
    mockUserStoreById.clear();
    mockUserIdByEmail.clear();
  });

  test('buyer upgraded to vendor stays dual-role after relogin', async () => {
    const app = makeApp();
    const email = 'dual.upgrade@example.com';
    const password = 'StrongPass!2345';

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Dual',
        lastName: 'Upgrade',
        email,
        password,
        roles: ['user']
      })
      .expect(201);

    expect(registerRes.body.success).toBe(true);
    expect(Array.isArray(registerRes.body.user.roles)).toBe(true);
    expect(registerRes.body.user.roles).toContain('user');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const userId = loginRes.body.user.id;
    expect(userId).toBeTruthy();
    expect(loginRes.body.user.roles).toContain('user');

    const roleAddRes = await request(app)
      .post(`/api/users/${userId}/roles`)
      .set('x-user-id', userId)
      .send({ action: 'add', role: 'vendor', setActive: false })
      .expect(200);

    expect(roleAddRes.body.user.roles).toEqual(expect.arrayContaining(['user', 'vendor']));

    const reloginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(reloginRes.body.user.roles).toEqual(expect.arrayContaining(['user', 'vendor']));
    expect(reloginRes.body.user.activeRole).toBeTruthy();
  });

  test('registering with buyer+vendor flags grants persistent dual roles', async () => {
    const app = makeApp();
    const email = 'dual.flags@example.com';
    const password = 'StrongPass!6789';

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Dual',
        lastName: 'Flags',
        email,
        password,
        buyer: true,
        vendor: true
      })
      .expect(201);

    expect(registerRes.body.user.roles).toEqual(expect.arrayContaining(['user', 'vendor']));

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginRes.body.user.roles).toEqual(expect.arrayContaining(['user', 'vendor']));

    const reloginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(reloginRes.body.user.roles).toEqual(expect.arrayContaining(['user', 'vendor']));
  });
});

