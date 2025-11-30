// Mock socket.io-client first
// We'll create the mock socket inside the factory and access it via require
jest.mock('socket.io-client', () => {
  // Create mock socket object
  const socket = {
    on: jest.fn((event, callback) => {
      // Store callbacks for testing
      if (!socket._callbacks) {
        socket._callbacks = {};
      }
      socket._callbacks[event] = callback;
      return socket; // Chainable
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'mock-socket-id',
    _callbacks: {},
  };
  
  return jest.fn(() => socket);
});

// Import after mocking
import notificationService from '../notificationService';

describe('NotificationService', () => {
  let mockSocket;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Get the mock socket from the service after initialization
    const io = require('socket.io-client');
    // Create a fresh mock socket for this test
    mockSocket = {
      on: jest.fn((event, callback) => {
        if (!mockSocket._callbacks) {
          mockSocket._callbacks = {};
        }
        mockSocket._callbacks[event] = callback;
        return mockSocket;
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
      id: 'mock-socket-id',
      _callbacks: {},
    };
    // Make io return our mock socket
    io.mockReturnValue(mockSocket);
    
    // Reset service state
    if (notificationService.socket) {
      notificationService.disconnect();
    }
    notificationService.socket = null;
    notificationService.isConnected = false;
    notificationService.listeners.clear();
  });

  describe('initialize', () => {
    it('should not initialize without userId', () => {
      notificationService.initialize(null);
      expect(notificationService.socket).toBeNull();
    });

    it('should not initialize without token', () => {
      localStorage.removeItem('token');
      notificationService.initialize('user-123');
      expect(notificationService.socket).toBeNull();
    });

    it('should initialize with userId and token', () => {
      localStorage.setItem('token', 'test-token');
      
      notificationService.initialize('user-123');
      
      // Verify socket was set
      expect(notificationService.socket).toBe(mockSocket);
      // Socket should have event handlers registered
      expect(mockSocket.on).toHaveBeenCalled();
      // Verify connect handler was registered
      const connectCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect');
      expect(connectCall).toBeTruthy();
    });

    it('should join user room on connect', () => {
      localStorage.setItem('token', 'test-token');
      
      notificationService.initialize('user-123');
      
      // Find the connect handler from the on() calls
      const connectCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect');
      expect(connectCall).toBeTruthy();
      expect(connectCall[1]).toBeTruthy();
      
      // Call the connect handler to simulate connection
      connectCall[1]();
      
      // Verify that emit was called with join_user_room
      expect(mockSocket.emit).toHaveBeenCalledWith('join_user_room', 'user-123');
    });
  });

  describe('on', () => {
    it('should add event listener', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.on('test-event', callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(notificationService.listeners.has('test-event')).toBe(true);
    });

    it('should call listener when event is triggered', () => {
      const callback = jest.fn();
      notificationService.on('test-event', callback);
      
      // Use notifyListeners to trigger the event
      notificationService.notifyListeners('test-event', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should allow unsubscribing from event', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.on('test-event', callback);
      
      unsubscribe();
      
      // Verify listener was removed
      const listeners = notificationService.listeners.get('test-event');
      expect(listeners).not.toContain(callback);
    });
  });

  describe('off', () => {
    it('should remove event listener', () => {
      const callback = jest.fn();
      notificationService.on('test-event', callback);
      notificationService.off('test-event', callback);
      
      const listeners = notificationService.listeners.get('test-event');
      expect(listeners).not.toContain(callback);
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', () => {
      localStorage.setItem('token', 'test-token');
      
      notificationService.initialize('user-123');
      
      // Verify socket exists
      expect(notificationService.socket).toBe(mockSocket);
      
      // Disconnect
      notificationService.disconnect();
      
      // Socket should be disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      expect(notificationService.isConnected).toBe(false);
      
      notificationService.isConnected = true;
      expect(notificationService.isConnected).toBe(true);
    });
  });
});

