jest.mock('../models/sequelize', () => ({
  Investment: {
    findAndCountAll: jest.fn()
  },
  UserInvestment: {
    findAll: jest.fn()
  },
  User: {}
}));

jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn()
}));

const investmentService = require('../services/investmentService');
const models = require('../models/sequelize');

describe('investmentService (unit)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('listInvestments returns data and pagination-like response', async () => {
    const mockRows = [{ id: 'inv1', title: 'Opportunity 1' }];
    models.Investment.findAndCountAll.mockResolvedValue({ rows: mockRows, count: 1 });

    const res = await investmentService.listInvestments({ page: 1, limit: 10 });

    expect(models.Investment.findAndCountAll).toHaveBeenCalled();
    expect(res).toHaveProperty('data');
    expect(res.data).toEqual(mockRows);
  });

  test('getUserInvestments computes summary', async () => {
    const userInvestments = [{ id: 'ui1', amount: 100 }, { id: 'ui2', amount: 200 }];
    models.UserInvestment.findAll.mockResolvedValue(userInvestments);

    const summary = await investmentService.getUserInvestmentSummary('user-1');

    expect(models.UserInvestment.findAll).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(summary.totalInvested).toBe(300);
  });
});
