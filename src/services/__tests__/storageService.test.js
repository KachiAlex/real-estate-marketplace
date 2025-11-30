import storageService from '../storageService';

// Mock Firebase Storage
jest.mock('../../config/firebase', () => ({
  storage: {
    ref: jest.fn(),
  },
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  listAll: jest.fn(),
  getMetadata: jest.fn(),
}));

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('uploadFile', () => {
    it('should be a function', () => {
      expect(typeof storageService.uploadFile).toBe('function');
    });

    it('should handle file upload structure', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const path = 'test/path/test.jpg';
      
      // Test that the method exists and can be called
      expect(storageService.uploadFile).toBeDefined();
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should be a function', () => {
      expect(typeof storageService.uploadMultipleFiles).toBe('function');
    });
  });

  describe('uploadUserAvatar', () => {
    it('should be a function', () => {
      expect(typeof storageService.uploadUserAvatar).toBe('function');
    });
  });

  describe('uploadPropertyImages', () => {
    it('should be a function', () => {
      expect(typeof storageService.uploadPropertyImages).toBe('function');
    });
  });

  describe('validateFile', () => {
    it('should validate file types', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = storageService.validateFile(validFile, ['image/jpeg'], 5 * 1024 * 1024);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const result = storageService.validateFile(invalidFile, ['image/jpeg', 'image/png'], 5 * 1024 * 1024);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject files exceeding size limit', () => {
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const result = storageService.validateFile(largeFile, ['image/jpeg'], 5 * 1024 * 1024);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('should format file size correctly', () => {
      expect(storageService.formatFileSize(0)).toBe('0 Bytes');
      expect(storageService.formatFileSize(1024)).toContain('KB');
      expect(storageService.formatFileSize(1024 * 1024)).toContain('MB');
      expect(storageService.formatFileSize(1024 * 1024 * 1024)).toContain('GB');
    });

    it('should handle different byte sizes', () => {
      const sizes = [500, 1500, 2500000, 3500000000];
      sizes.forEach(size => {
        const formatted = storageService.formatFileSize(size);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });
});


