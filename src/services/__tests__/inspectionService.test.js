import {
  createInspectionRequest,
  listInspectionRequestsByVendor,
  listInspectionRequestsByBuyer,
  updateInspectionRequest,
  syncLocalInspectionRequests
} from '../inspectionService';

const STORAGE_KEY = 'inspection:viewingRequests';

describe('inspectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('createInspectionRequest', () => {
    it('should create inspection request and save to localStorage', async () => {
      const requestData = {
        propertyId: 'prop-123',
        buyerId: 'buyer-123',
        vendorId: 'vendor-123',
        preferredDate: '2024-12-25',
        message: 'Test message'
      };

      const result = await createInspectionRequest(requestData);

      expect(result).toHaveProperty('id');
      expect(result.propertyId).toBe('prop-123');
      expect(result.status).toBe('pending');
      expect(result.createdAt).toBeDefined();

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe(result.id);
    });

    it('should append to existing requests', async () => {
      const existing = [{
        id: 'existing-1',
        propertyId: 'prop-1',
        status: 'pending'
      }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

      const requestData = {
        propertyId: 'prop-2',
        buyerId: 'buyer-123'
      };

      await createInspectionRequest(requestData);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored.length).toBe(2);
    });
  });

  describe('listInspectionRequestsByVendor', () => {
    beforeEach(() => {
      const requests = [
        { id: '1', vendorId: 'vendor-1', vendorEmail: 'vendor1@test.com', createdAt: '2024-01-01' },
        { id: '2', vendorId: 'vendor-2', vendorEmail: 'vendor2@test.com', createdAt: '2024-01-02' },
        { id: '3', vendorId: 'vendor-1', vendorEmail: 'vendor1@test.com', createdAt: '2024-01-03' }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    });

    it('should filter requests by vendorId', async () => {
      const result = await listInspectionRequestsByVendor('vendor-1');
      
      expect(result.length).toBe(2);
      expect(result[0].vendorId).toBe('vendor-1');
      expect(result[0].id).toBe('3'); // Should be sorted newest first
    });

    it('should filter requests by vendorEmail', async () => {
      const result = await listInspectionRequestsByVendor(null, 'vendor2@test.com');
      
      expect(result.length).toBe(1);
      expect(result[0].vendorEmail).toBe('vendor2@test.com');
    });

    it('should return empty array if no matches', async () => {
      const result = await listInspectionRequestsByVendor('non-existent');
      expect(result).toEqual([]);
    });

    it('should sort by createdAt descending', async () => {
      const result = await listInspectionRequestsByVendor('vendor-1');
      
      expect(result[0].createdAt).toBe('2024-01-03');
      expect(result[1].createdAt).toBe('2024-01-01');
    });
  });

  describe('listInspectionRequestsByBuyer', () => {
    beforeEach(() => {
      const requests = [
        { id: '1', buyerId: 'buyer-1', createdAt: '2024-01-01' },
        { id: '2', buyerId: 'buyer-2', createdAt: '2024-01-02' },
        { id: '3', buyerId: 'buyer-1', createdAt: '2024-01-03' }
      ];
      localStorage.setItem('viewingRequests', JSON.stringify(requests));
    });

    it('should filter requests by buyerId', async () => {
      const result = await listInspectionRequestsByBuyer('buyer-1');
      
      expect(result.length).toBe(2);
      expect(result.every(r => r.buyerId === 'buyer-1')).toBe(true);
    });

    it('should return empty array if no matches', async () => {
      const result = await listInspectionRequestsByBuyer('non-existent');
      expect(result).toEqual([]);
    });
  });

  describe('updateInspectionRequest', () => {
    beforeEach(() => {
      const requests = [
        { id: 'req-1', status: 'pending' },
        { id: 'req-2', status: 'pending' }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    });

    it('should update request with provided updates', async () => {
      await updateInspectionRequest('req-1', { status: 'approved' });
      
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = stored.find(r => r.id === 'req-1');
      
      expect(updated.status).toBe('approved');
      expect(updated.updatedAt).toBeDefined();
    });

    it('should not update non-existent request', async () => {
      await updateInspectionRequest('non-existent', { status: 'approved' });
      
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored.length).toBe(2);
      expect(stored.every(r => r.status === 'pending')).toBe(true);
    });
  });

  describe('syncLocalInspectionRequests', () => {
    it('should be a function', () => {
      expect(typeof syncLocalInspectionRequests).toBe('function');
    });

    it('should handle sync without errors', async () => {
      // Mock user
      localStorage.setItem('currentUser', JSON.stringify({ id: 'user-123' }));
      
      await expect(syncLocalInspectionRequests()).resolves.not.toThrow();
    });
  });
});

