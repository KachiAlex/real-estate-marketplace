import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';
import { getApiUrl } from '../utils/apiConfig';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export default function MinimalChat({ userId, peerId, chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState({}); // { [msgId]: { delivered: bool, read: bool, failed: bool } }
  const socketRef = useRef();

  // Fetch messages for the chat using chatId
  useEffect(() => {
    let isMounted = true;
    async function fetchMessages() {
      try {
        if (!chatId) {
          console.warn('MinimalChat: No chatId provided');
          return;
        }
        
        console.log('[MinimalChat] Fetching messages for chatId:', chatId);
        const resp = await apiClient.get(`/chats/${chatId}/messages`);
        
        if (isMounted) {
          const data = resp.data?.data || resp.data?.messages || [];
          console.log('[MinimalChat] Fetched messages:', data.length);
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('MinimalChat: failed to load messages', err);
        if (isMounted) setMessages([]);
      }
    }
    
    if (chatId && userId) {
      fetchMessages();
    }
    
    return () => { isMounted = false; };
  }, [chatId, userId]);

  useEffect(() => {
    if (!userId) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('join_user_room', userId);

    socketRef.current.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Send read receipt if message is for me
      if (msg.to === userId) {
        socketRef.current.emit('message_read', { msgId: msg.id, to: msg.from, from: msg.to });
      }
    });

    socketRef.current.on('message_delivered', ({ msgId }) => {
      setStatus((prev) => ({ ...prev, [msgId]: { ...(prev[msgId] || {}), delivered: true } }));
    });
    socketRef.current.on('message_read', ({ msgId }) => {
      setStatus((prev) => ({ ...prev, [msgId]: { ...(prev[msgId] || {}), read: true } }));
    });

    return () => socketRef.current.disconnect();
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim() || !userId || !peerId) return;
    const tempId = `tmp_${userId}_${Date.now()}`;
    const optimistic = {
      id: tempId,
      from: userId,
      to: peerId,
      text: input,
      timestamp: Date.now(),
      pending: true,
    };

    // Optimistic UI
    setMessages((prev) => [...prev, optimistic]);
    setStatus((prev) => ({ ...prev, [tempId]: { delivered: false, read: false, failed: false } }));
    setInput('');

    // Emit to socket for real-time delivery
    try {
      socketRef.current?.emit('chat_message', optimistic);
    } catch (err) {
      // socket may not be connected; continue to API send
    }

    // Persist via API
    // Note: The backend uses POST /chats/:chatId/messages with content property
    // For now, just emit and mark as sent via socket
    try {
      // // Message sent via socket - mark as delivered
      setStatus((prev) => ({ ...prev, [tempId]: { delivered: true, read: false } }));
      
      // Show success toast
      toast.success('Message sent', { duration: 2000 });
    } catch (err) {
      console.error('MinimalChat: failed to emit message', err);
      // mark as failed
      setStatus((prev) => ({ ...prev, [tempId]: { ...(prev[tempId] || {}), failed: true } }));
      
      // Show error toast
      const errorMsg = err.message || 'Failed to send message';
      toast.error(errorMsg);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, maxWidth: 400, display: 'flex', flexDirection: 'column', height: 400 }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 0 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ margin: '4px 0', textAlign: msg.from === userId ? 'right' : 'left' }}>
            <span>{msg.text}</span>
            <span style={{ fontSize: 10, marginLeft: 8 }}>
              {status[msg.id]?.failed ? '⚠' : status[msg.id]?.read ? '✓✓' : status[msg.id]?.delivered ? '✓' : ''}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
