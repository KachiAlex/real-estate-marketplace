const escrowService = require('../services/escrowService.clean');
const db = require('../config/sequelizeDb');
const notificationService = require('../services/notificationService');

jest.mock('../config/sequelizeDb');
jest.mock('../services/notificationService');

describe('Dispute Service (End-to-End Flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FILE DISPUTE ====================
  describe('fileDispute()', () => {
    test('should create dispute with SLA deadlines when buyer files dispute', async () => {
      const now = new Date();
      const mockTx = {
        id: 'tx1',
        buyerId: 'buyer1',
        sellerId: 'seller1',
        status: 'active',
        update: jest.fn().mockResolvedValue({ status: 'disputed' })
      };

      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(null);
      db.DisputeResolution.create = jest.fn().mockResolvedValue({
        id: 'disp1',
        escrowId: 'tx1',
        status: 'open',
        reason: 'seller_non_compliance',
        description: 'Seller not delivering as promised',
        documents: [],
        firstResponseDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        resolutionDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        timeline: expect.any(Array),
        toJSON: () => ({
          id: 'disp1',
          escrowId: 'tx1',
          status: 'open',
          reason: 'seller_non_compliance',
          description: 'Seller not delivering as promised',
          documents: [],
          firstResponseDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          resolutionDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
          timeline: expect.any(Array)
        })
      });

      notificationService.createNotification = jest.fn().mockResolvedValue({});

      const dispute = await escrowService.fileDispute({
        transactionId: 'tx1',
        reason: 'seller_non_compliance',
        description: 'Seller not delivering as promised',
        evidence: [],
        user: { id: 'buyer1', role: 'buyer' }
      });

      expect(db.EscrowTransaction.findByPk).toHaveBeenCalledWith('tx1');
      expect(db.DisputeResolution.create).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalledWith({ status: 'disputed' });
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2); // seller + admin
      expect(dispute.status).toBe('open');
      expect(dispute.reason).toBe('seller_non_compliance');
    });

    test('should throw 404 if transaction not found', async () => {
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        escrowService.fileDispute({
          transactionId: 'invalid',
          reason: 'seller_non_compliance',
          description: 'Issue',
          user: { id: 'buyer1' }
        })
      ).rejects.toThrow('Escrow transaction not found');
    });

    test('should throw 403 if user is not participant', async () => {
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);

      await expect(
        escrowService.fileDispute({
          transactionId: 'tx1',
          reason: 'seller_non_compliance',
          description: 'Issue',
          user: { id: 'outsider' }
        })
      ).rejects.toThrow('You are not a participant in this escrow transaction');
    });

    test('should throw 400 if invalid reason provided', async () => {
      await expect(
        escrowService.fileDispute({
          transactionId: 'tx1',
          reason: 'invalid_reason',
          description: 'Issue',
          user: { id: 'buyer1' }
        })
      ).rejects.toThrow('Invalid dispute reason');
    });

    test('should throw 400 if description too short', async () => {
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);

      await expect(
        escrowService.fileDispute({
          transactionId: 'tx1',
          reason: 'seller_non_compliance',
          description: 'short',
          user: { id: 'buyer1' }
        })
      ).rejects.toThrow('Description must be at least 10 characters');
    });

    test('should throw 400 if active dispute already exists', async () => {
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue({ id: 'existing' });

      await expect(
        escrowService.fileDispute({
          transactionId: 'tx1',
          reason: 'seller_non_compliance',
          description: 'This is a valid complaint with details',
          user: { id: 'buyer1' }
        })
      ).rejects.toThrow('An active dispute already exists for this transaction');
    });
  });

  // ==================== SELLER RESPONSE ====================
  describe('submitSellerResponse()', () => {
    test('should update dispute to in_review when seller responds', async () => {
      const now = new Date();
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'open',
        firstResponseDeadline: new Date(now.getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
        sellerResponse: null,
        timeline: [],
        update: jest.fn().mockResolvedValue({
          id: 'disp1',
          status: 'in_review',
          sellerResponse: 'We delivered everything on time',
          sellerEvidence: ['doc1'],
          timeline: expect.any(Array)
        })
      };

      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      const updated = await escrowService.submitSellerResponse({
        transactionId: 'tx1',
        sellerResponse: 'We delivered everything on time',
        sellerEvidence: ['doc1'],
        user: { id: 'seller1' }
      });

      expect(db.EscrowTransaction.findByPk).toHaveBeenCalledWith('tx1');
      expect(db.DisputeResolution.findOne).toHaveBeenCalled();
      expect(mockDispute.update).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2); // buyer + admin
      expect(updated.status).toBe('in_review');
    });

    test('should throw 403 if non-seller tries to respond', async () => {
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      const mockDispute = { id: 'disp1', escrowId: 'tx1' };

      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);

      await expect(
        escrowService.submitSellerResponse({
          transactionId: 'tx1',
          sellerResponse: 'Response',
          user: { id: 'buyer1' }
        })
      ).rejects.toThrow('Only the seller can submit a response to this dispute');
    });

    test('should throw 400 if response deadline passed', async () => {
      const now = new Date();
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'open',
        firstResponseDeadline: new Date(now.getTime() - 60 * 1000), // 1 minute ago
      };

      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);

      await expect(
        escrowService.submitSellerResponse({
          transactionId: 'tx1',
          sellerResponse: 'This is a valid response that is long enough',
          user: { id: 'seller1' }
        })
      ).rejects.toThrow('Response deadline has passed');
    });

    test('should throw 400 if response too short', async () => {
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);

      await expect(
        escrowService.submitSellerResponse({
          transactionId: 'tx1',
          sellerResponse: 'short',
          user: { id: 'seller1' }
        })
      ).rejects.toThrow('Response must be between 10 and 1000 characters');
    });
  });

  // ==================== RESOLVE DISPUTE ====================
  describe('resolveDispute()', () => {
    test('should mark dispute resolved by admin with buyer_favor', async () => {
      const now = new Date();
      const mockTx = {
        id: 'tx1',
        buyerId: 'buyer1',
        sellerId: 'seller1',
        update: jest.fn().mockResolvedValue({ status: 'completed' })
      };
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'in_review',
        timeline: [],
        update: jest.fn().mockResolvedValue({
          id: 'disp1',
          status: 'resolved',
          resolution: 'buyer_favor',
          resolvedAt: now,
          resolvedBy: 'admin1',
          timeline: expect.any(Array)
        })
      };

      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      const resolved = await escrowService.resolveDispute({
        transactionId: 'tx1',
        resolution: 'buyer_favor',
        adminNotes: 'Seller failed to provide evidence. Buyer wins.',
        user: { id: 'admin1', role: 'admin' }
      });

      expect(db.DisputeResolution.findOne).toHaveBeenCalled();
      expect(mockDispute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          resolution: 'buyer_favor',
          adminNotes: 'Seller failed to provide evidence. Buyer wins.',
          resolvedBy: 'admin1'
        })
      );
      expect(mockTx.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2); // buyer + seller
      expect(resolved.status).toBe('resolved');
    });

    test('should update escrow to refunded on refund resolution', async () => {
      const mockTx = {
        id: 'tx1',
        buyerId: 'buyer1',
        sellerId: 'seller1',
        update: jest.fn()
      };
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'in_review',
        timeline: [],
        update: jest.fn().mockResolvedValue({
          status: 'resolved',
          resolution: 'full_refund'
        })
      };

      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      await escrowService.resolveDispute({
        transactionId: 'tx1',
        resolution: 'full_refund',
        adminNotes: 'Full refund approved due to seller non-compliance',
        user: { id: 'admin1', role: 'admin' }
      });

      expect(mockTx.update).toHaveBeenCalledWith({ status: 'refunded' });
    });

    test('should throw 403 if non-admin tries to resolve', async () => {
      await expect(
        escrowService.resolveDispute({
          transactionId: 'tx1',
          resolution: 'buyer_favor',
          adminNotes: 'Notes',
          user: { id: 'buyer1', role: 'buyer' }
        })
      ).rejects.toThrow('Only admins can resolve disputes');
    });

    test('should throw 400 if invalid resolution type', async () => {
      await expect(
        escrowService.resolveDispute({
          transactionId: 'tx1',
          resolution: 'invalid_type',
          adminNotes: 'Notes that are long enough',
          user: { id: 'admin1', role: 'admin' }
        })
      ).rejects.toThrow('Invalid resolution type');
    });

    test('should throw 400 if admin notes too short', async () => {
      await expect(
        escrowService.resolveDispute({
          transactionId: 'tx1',
          resolution: 'buyer_favor',
          adminNotes: 'short',
          user: { id: 'admin1', role: 'admin' }
        })
      ).rejects.toThrow('Admin notes must be at least 10 characters');
    });
  });

  // ==================== GET DISPUTE ====================
  describe('getDisputeById()', () => {
    test('admin should retrieve any dispute', async () => {
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'in_review',
        toJSON: () => ({ id: 'disp1', escrowId: 'tx1', status: 'in_review' })
      };

      db.DisputeResolution.findByPk = jest.fn().mockResolvedValue(mockDispute);

      const dispute = await escrowService.getDisputeById('disp1', {
        id: 'admin1',
        role: 'admin'
      });

      expect(db.DisputeResolution.findByPk).toHaveBeenCalledWith('disp1');
      expect(dispute).toEqual({ id: 'disp1', escrowId: 'tx1', status: 'in_review' });
    });

    test('non-admin participant should retrieve their dispute', async () => {
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        toJSON: () => ({ id: 'disp1', escrowId: 'tx1' })
      };
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };

      db.DisputeResolution.findByPk = jest.fn().mockResolvedValue(mockDispute);
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);

      const dispute = await escrowService.getDisputeById('disp1', {
        id: 'buyer1'
      });

      expect(dispute).toEqual({ id: 'disp1', escrowId: 'tx1' });
    });

    test('non-participant should get 403', async () => {
      const mockDispute = { id: 'disp1', escrowId: 'tx1' };
      const mockTx = { id: 'tx1', buyerId: 'buyer1', sellerId: 'seller1' };

      db.DisputeResolution.findByPk = jest.fn().mockResolvedValue(mockDispute);
      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);

      await expect(
        escrowService.getDisputeById('disp1', { id: 'outsider' })
      ).rejects.toThrow('Not authorized to view this dispute');
    });
  });

  // ==================== LIST DISPUTES ====================
  describe('listDisputes()', () => {
    test('admin should list all disputes', async () => {
      const disputes = [
        { id: 'disp1', escrowId: 'tx1', status: 'open', toJSON: () => ({ id: 'disp1', status: 'open' }) },
        { id: 'disp2', escrowId: 'tx2', status: 'resolved', toJSON: () => ({ id: 'disp2', status: 'resolved' }) }
      ];

      db.DisputeResolution.findAndCountAll = jest.fn().mockResolvedValue({
        rows: disputes,
        count: 2
      });

      const result = await escrowService.listDisputes({
        user: { id: 'admin1', role: 'admin' },
        page: 1,
        limit: 20
      });

      expect(result.rows).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    test('non-admin should only see their disputes', async () => {
      const txs = [{ id: 'tx1', toJSON: () => ({ id: 'tx1' }) }];
      const disputes = [
        { id: 'disp1', escrowId: 'tx1', status: 'open', toJSON: () => ({ id: 'disp1' }) }
      ];

      db.EscrowTransaction.findAll = jest.fn().mockResolvedValue(txs);
      db.DisputeResolution.findAndCountAll = jest.fn().mockResolvedValue({
        rows: disputes,
        count: 1
      });

      const result = await escrowService.listDisputes({
        user: { id: 'buyer1' },
        page: 1,
        limit: 20
      });

      expect(result.rows).toHaveLength(1);
      expect(db.DisputeResolution.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            escrowId: { [expect.any(Object)]: ['tx1'] }
          })
        })
      );
    });

    test('should filter by status', async () => {
      db.DisputeResolution.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0
      });

      await escrowService.listDisputes({
        user: { id: 'admin1', role: 'admin' },
        status: 'open',
        page: 1,
        limit: 20
      });

      expect(db.DisputeResolution.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' })
        })
      );
    });

    test('should handle pagination', async () => {
      db.DisputeResolution.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 100
      });

      await escrowService.listDisputes({
        user: { id: 'admin1', role: 'admin' },
        page: 3,
        limit: 20
      });

      expect(db.DisputeResolution.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 40, // (3-1)*20
          limit: 20
        })
      );
    });
  });

  // ==================== ESCALATE DISPUTE ====================
  describe('escalateDispute()', () => {
    test('should mark dispute escalated', async () => {
      const now = new Date();
      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'in_review',
        timeline: [],
        update: jest.fn().mockResolvedValue({
          id: 'disp1',
          status: 'escalated',
          escalatedAt: now,
          escalatedBy: 'admin1'
        })
      };

      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      const escalated = await escrowService.escalateDispute({
        transactionId: 'tx1',
        escalationReason: 'Complex case requiring senior review',
        user: { id: 'admin1', role: 'admin' }
      });

      expect(mockDispute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'escalated',
          escalatedBy: 'admin1'
        })
      );
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(escalated.status).toBe('escalated');
    });

    test('should throw 403 if non-admin escalates', async () => {
      await expect(
        escrowService.escalateDispute({
          transactionId: 'tx1',
          escalationReason: 'Reason needs to be long enough',
          user: { id: 'buyer1', role: 'buyer' }
        })
      ).rejects.toThrow('Only admins can escalate disputes');
    });
  });

  // ==================== TIMELINE TRACKING ====================
  describe('Timeline Tracking', () => {
    test('timeline should record all dispute events', async () => {
      let timeline = [];
      const now = new Date();

      const mockTx = {
        id: 'tx1',
        buyerId: 'buyer1',
        sellerId: 'seller1',
        update: jest.fn()
      };

      const mockDispute = {
        id: 'disp1',
        escrowId: 'tx1',
        status: 'open',
        timeline: [],
        firstResponseDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        sellerResponse: null,
        update: jest.fn(function(data) {
          if (data.timeline) {
            this.timeline = data.timeline;
          }
          if (data.status) {
            this.status = data.status;
          }
          if (data.sellerResponse) {
            this.sellerResponse = data.sellerResponse;
          }
          return Promise.resolve(this);
        })
      };

      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(mockDispute);
      db.DisputeResolution.create = jest.fn().mockResolvedValue(mockDispute);
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      // Create dispute
      await escrowService.fileDispute({
        transactionId: 'tx1',
        reason: 'seller_non_compliance',
        description: 'Valid description here for the dispute',
        user: { id: 'buyer1' }
      });

      expect(mockDispute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          timeline: expect.arrayContaining([
            expect.objectContaining({
              type: 'dispute_filed',
              initiatedBy: 'buyer1'
            })
          ])
        })
      );
    });
  });

  // ==================== SLA CALCULATIONS ====================
  describe('SLA Calculations', () => {
    test('should calculate 24-hour first response deadline', async () => {
      const now = new Date();
      const mockTx = {
        id: 'tx1',
        buyerId: 'buyer1',
        sellerId: 'seller1',
        update: jest.fn()
      };

      db.EscrowTransaction.findByPk = jest.fn().mockResolvedValue(mockTx);
      db.DisputeResolution.findOne = jest.fn().mockResolvedValue(null);
      db.DisputeResolution.create = jest.fn().mockResolvedValue({
        firstResponseDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        resolutionDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        toJSON: () => ({
          firstResponseDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          resolutionDeadline: new Date(now.getTime() + 72 * 60 * 60 * 1000)
        })
      });
      notificationService.createNotification = jest.fn().mockResolvedValue({});

      const dispute = await escrowService.fileDispute({
        transactionId: 'tx1',
        reason: 'seller_non_compliance',
        description: 'This is a valid dispute description',
        user: { id: 'buyer1' }
      });

      expect(db.DisputeResolution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstResponseDeadline: expect.any(Date),
          resolutionDeadline: expect.any(Date)
        })
      );
    });
  });
});
