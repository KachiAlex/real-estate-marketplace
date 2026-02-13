import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { authenticatedFetch } from '../utils/authToken';
import { getApiUrl } from '../utils/apiConfig';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export default function MinimalChat({ userId, peerId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState({}); // { [msgId]: { delivered: bool, read: bool, failed: bool } }
  const socketRef = useRef();

  // Fetch persisted messages on mount or when user/peer changes
  useEffect(() => {
    let isMounted = true;
    async function fetchMessages() {
      try {
        const res = await authenticatedFetch(getApiUrl(`/messages/${userId}/${peerId}`));
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        if (isMounted && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.warn('MinimalChat: failed to load messages', err);
        if (isMounted) setMessages([]);
      }
    }
    if (userId && peerId) fetchMessages();
    return () => { isMounted = false; };
  }, [userId, peerId]);

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
    try {
      const res = await authenticatedFetch(getApiUrl('/chat/send'), {
        method: 'POST',
        body: JSON.stringify({ to: peerId, text: optimistic.text }),
      });
      if (!res.ok) throw new Error(`Send failed: ${res.status}`);
      const saved = await res.json();

      // Replace optimistic message with saved message (server id/timestamp)
      setMessages((prev) => prev.map(m => (m.id === tempId ? saved.message || saved : m)));
      setStatus((prev) => ({ ...prev, [saved.message?.id || saved.id || tempId]: { delivered: true, read: false } }));
    } catch (err) {
      console.error('MinimalChat: failed to persist message', err);
      // mark as failed
      setStatus((prev) => ({ ...prev, [tempId]: { ...(prev[tempId] || {}), failed: true } }));
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, maxWidth: 400 }}>
      <div style={{ minHeight: 200, marginBottom: 8 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ margin: '4px 0', textAlign: msg.from === userId ? 'right' : 'left' }}>
            <span>{msg.text}</span>
            <span style={{ fontSize: 10, marginLeft: 8 }}>
              {status[msg.id]?.failed ? '⚠' : status[msg.id]?.read ? '✓✓' : status[msg.id]?.delivered ? '✓' : ''}
            </span>
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
        style={{ width: '80%' }}
      />
      <button onClick={sendMessage} style={{ width: '18%', marginLeft: 4 }}>Send</button>
    </div>
  );
}
