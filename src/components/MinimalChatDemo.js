// MinimalChatDemo.js
// Usage: <MinimalChat userId="user1" peerId="user2" /> and <MinimalChat userId="user2" peerId="user1" /> in two browser windows
import React from 'react';
import MinimalChat from './MinimalChat';

export default function MinimalChatDemo() {
  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <div>
        <h3>User 1</h3>
        <MinimalChat userId="user1" peerId="user2" />
      </div>
      <div>
        <h3>User 2</h3>
        <MinimalChat userId="user2" peerId="user1" />
      </div>
    </div>
  );
}
