import io from 'socket.io-client';
import { getApiUrl } from '../utils/apiConfig';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Connect to Socket.IO server with authentication
 * @param {string} token - JWT authentication token
 * @returns {Socket} Socket.IO client instance
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) {
    console.log('[Socket] Already connected');
    return socket;
  }

  if (socket && socket.connecting) {
    console.log('[Socket] Connection in progress');
    return socket;
  }

  const socketUrl = getApiUrl().replace('/api', '');

  console.log('[Socket] Connecting to:', socketUrl);

  socket = io(socketUrl, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    transports: ['websocket', 'polling']
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] ✓ Connected:', socket.id);
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] ✗ Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
    reconnectAttempts++;
  });

  // Payment events
  socket.on('payment:completed', (data) => {
    console.log('[Socket] Payment completed:', data);
    window.dispatchEvent(new CustomEvent('paymentCompleted', { detail: data }));
  });

  socket.on('payment:failed', (data) => {
    console.log('[Socket] Payment failed:', data);
    window.dispatchEvent(new CustomEvent('paymentFailed', { detail: data }));
  });

  // Escrow events
  socket.on('escrow:funded', (data) => {
    console.log('[Socket] Escrow funded:', data);
    window.dispatchEvent(new CustomEvent('escrowFunded', { detail: data }));
  });

  socket.on('escrow:status_changed', (data) => {
    console.log('[Socket] Escrow status changed:', data);
    window.dispatchEvent(new CustomEvent('escrowStatusChanged', { detail: data }));
  });

  socket.on('escrow:disputed', (data) => {
    console.log('[Socket] Escrow disputed:', data);
    window.dispatchEvent(new CustomEvent('escrowDisputed', { detail: data }));
  });

  socket.on('escrow:cancelled', (data) => {
    console.log('[Socket] Escrow cancelled:', data);
    window.dispatchEvent(new CustomEvent('escrowCancelled', { detail: data }));
  });

  socket.on('escrow:completed', (data) => {
    console.log('[Socket] Escrow completed:', data);
    window.dispatchEvent(new CustomEvent('escrowCompleted', { detail: data }));
  });

  // Dispute events
  socket.on('dispute:filed', (data) => {
    console.log('[Socket] Dispute filed:', data);
    window.dispatchEvent(new CustomEvent('disputeFiled', { detail: data }));
  });

  socket.on('dispute:responded', (data) => {
    console.log('[Socket] Dispute response received:', data);
    window.dispatchEvent(new CustomEvent('disputeResponded', { detail: data }));
  });

  socket.on('dispute:resolved', (data) => {
    console.log('[Socket] Dispute resolved:', data);
    window.dispatchEvent(new CustomEvent('disputeResolved', { detail: data }));
  });

  // Notification events
  socket.on('notification:new', (data) => {
    console.log('[Socket] New notification:', data);
    window.dispatchEvent(new CustomEvent('notificationReceived', { detail: data }));
  });

  // Generic message event
  socket.on('message', (data) => {
    console.log('[Socket] Message:', data);
  });

  return socket;
};

/**
 * Disconnect from Socket.IO server
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket] Disconnecting');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get current Socket.IO instance
 * @returns {Socket|null} Socket.IO instance or null if not connected
 */
export const getSocket = () => socket;

/**
 * Check if socket is connected
 * @returns {boolean}
 */
export const isSocketConnected = () => socket && socket.connected;

/**
 * Join escrow room for real-time updates
 * @param {string} escrowId - Escrow transaction ID
 */
export const joinEscrowRoom = (escrowId) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot join escrow room');
    return;
  }

  console.log('[Socket] Joining escrow room:', escrowId);
  socket.emit('escrow:join', { escrowId });
};

/**
 * Leave escrow room
 * @param {string} escrowId - Escrow transaction ID
 */
export const leaveEscrowRoom = (escrowId) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot leave escrow room');
    return;
  }

  console.log('[Socket] Leaving escrow room:', escrowId);
  socket.emit('escrow:leave', { escrowId });
};

/**
 * Join payment room for real-time payment updates
 * @param {string} paymentId - Payment ID
 */
export const joinPaymentRoom = (paymentId) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot join payment room');
    return;
  }

  console.log('[Socket] Joining payment room:', paymentId);
  socket.emit('payment:join', { paymentId });
};

/**
 * Leave payment room
 * @param {string} paymentId - Payment ID
 */
export const leavePaymentRoom = (paymentId) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot leave payment room');
    return;
  }

  console.log('[Socket] Leaving payment room:', paymentId);
  socket.emit('payment:leave', { paymentId });
};

/**
 * Join chat room for messaging
 * @param {string} conversationId - Conversation ID
 */
export const joinChatRoom = (conversationId) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot join chat room');
    return;
  }

  console.log('[Socket] Joining chat room:', conversationId);
  socket.emit('chat:join', { conversationId });
};

/**
 * Leave chat room
 * @param {string} conversationId - Conversation ID
 */
export const leaveChatRoom = (conversationId) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot leave chat room');
    return;
  }

  console.log('[Socket] Leaving chat room:', conversationId);
  socket.emit('chat:leave', { conversationId });
};

/**
 * Emit custom event
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const emitEvent = (event, data) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot emit event');
    return;
  }

  socket.emit(event, data);
};

/**
 * Listen to custom event
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 */
export const onEvent = (event, callback) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot listen to event');
    return;
  }

  socket.on(event, callback);
};

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 */
export const offEvent = (event, callback) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected');
    return;
  }

  socket.off(event, callback);
};

/**
 * Listen once to event
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 */
export const onceEvent = (event, callback) => {
  if (!socket) {
    console.warn('[Socket] Socket not connected, cannot listen to event');
    return;
  }

  socket.once(event, callback);
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  joinEscrowRoom,
  leaveEscrowRoom,
  joinPaymentRoom,
  leavePaymentRoom,
  joinChatRoom,
  leaveChatRoom,
  emitEvent,
  onEvent,
  offEvent,
  onceEvent
};
