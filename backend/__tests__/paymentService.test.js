const paymentService = require('../services/paymentService');
const db = require('../config/sequelizeDb');

describe('paymentService (unit)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('listUserPayments returns rows and total', async () => {
    const rows = [{ id: 'p1', amount: 100 }];
    db.Payment.findAndCountAll = jest.fn().mockResolvedValue({ rows, count: 1 });

    const res = await paymentService.listUserPayments({ userId: 'u1', page: 1, limit: 10 });

    expect(db.Payment.findAndCountAll).toHaveBeenCalled();
    expect(res).toEqual({ data: rows, total: 1 });
  });

  test('initializePayment creates a pending payment', async () => {
    const created = { id: 'p2', userId: 'u1', amount: 200, status: 'pending' };
    db.Payment.create = jest.fn().mockResolvedValue(created);

    const payment = await paymentService.initializePayment({ user: { id: 'u1' }, amount: 200, paymentMethod: 'stripe', paymentType: 'escrow', relatedEntity: {}, description: 'desc', currency: 'NGN' });

    expect(db.Payment.create).toHaveBeenCalled();
    expect(payment).toMatchObject({ status: 'pending', amount: 200 });
  });

  test('verifyPayment marks payment completed for correct user', async () => {
    const mockPayment = { id: 'p3', userId: 'u1', status: 'pending', save: jest.fn().mockResolvedValue(true) };
    db.Payment.findByPk = jest.fn().mockResolvedValue(mockPayment);

    const res = await paymentService.verifyPayment({ paymentId: 'p3', userId: 'u1', providerReference: 'prov' });

    expect(db.Payment.findByPk).toHaveBeenCalledWith('p3');
    expect(mockPayment.save).toHaveBeenCalled();
    expect(res.status).toBe('completed');
  });

  test('verifyPayment throws 404 if not found', async () => {
    db.Payment.findByPk = jest.fn().mockResolvedValue(null);
    await expect(paymentService.verifyPayment({ paymentId: 'x', userId: 'u1' })).rejects.toThrow('Payment not found');
  });
});
