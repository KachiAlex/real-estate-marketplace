
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function MinimalChat({ userId, peerId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState({}); // { [msgId]: { delivered: bool, read: bool } }
  const socketRef = useRef();


  // Fetch persisted messages on mount or when user/peer changes
  useEffect(() => {
    let isMounted = true;
    async function fetchMessages() {
      try {
        const res = await fetch(`${API_URL}/api/messages/${userId}/${peerId}`);
        const data = await res.json();
        if (isMounted && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        // ignore
      }
    }
    fetchMessages();
    return () => { isMounted = false; };
  }, [userId, peerId]);

  useEffect(() => {
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

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      id: `${userId}_${Date.now()}`,
      from: userId,
      to: peerId,
      text: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setStatus((prev) => ({ ...prev, [msg.id]: { delivered: false, read: false } }));
    socketRef.current.emit('chat_message', msg);
    setInput('');
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, maxWidth: 400 }}>
      <div style={{ minHeight: 200, marginBottom: 8 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ margin: '4px 0', textAlign: msg.from === userId ? 'right' : 'left' }}>
            <span>{msg.text}</span>
            <span style={{ fontSize: 10, marginLeft: 8 }}>
              {status[msg.id]?.read ? '✓✓' : status[msg.id]?.delivered ? '✓' : ''}
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
