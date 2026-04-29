# Chat Enhanced API Documentation

**Phase 4.4: Advanced Chat System with Encryption, Reactions & Rich Media**

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Features](#features)
6. [Error Handling](#error-handling)
7. [React Integration Examples](#react-integration-examples)
8. [Real-time Features](#real-time-features)
9. [Security & Encryption](#security--encryption)
10. [Rate Limiting](#rate-limiting)

---

## Overview

The Chat Enhanced API provides a comprehensive messaging solution with end-to-end encryption, rich media support, message reactions, read receipts, typing indicators, and advanced search capabilities. All messages are encrypted using AES-256-CBC encryption for security.

**Key Features:**
- ✅ End-to-end message encryption (AES-256-CBC)
- ✅ Support for 8 reaction types (👍 ❤️ 😂 😮 😢 🔥 👏 💯)
- ✅ Rich media uploads (images, documents, videos)
- ✅ Link preview generation with metadata
- ✅ Message editing with edit history tracking
- ✅ Read receipts and delivery confirmation
- ✅ Typing indicators with auto-expiration
- ✅ Message search within conversations
- ✅ Support for threaded replies (reply-to)
- ✅ Group chat and 1:1 conversations
- ✅ Conversation metadata with unread counts
- ✅ Soft delete with audit trail

---

## Base URL & Authentication

**Base URL:**
```
https://api.propertyark.com/api/chat
```

**Authentication:**
All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Error Response (Unauthorized):**
```json
{
  "success": false,
  "message": "No auth token, access denied",
  "status": 401
}
```

---

## Data Models

### Conversation Object

```json
{
  "id": "conv_user1_user2_1704067200000",
  "participants": ["user_123", "user_456"],
  "name": "Property Discussion",
  "description": "Discussion about property bid",
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T15:30:00Z",
  "unreadCounts": {
    "user_123": 5,
    "user_456": 0
  },
  "lastMessage": {
    "id": "msg_001",
    "senderId": "user_123",
    "text": "What's the final offer?",
    "timestamp": "2024-01-01T15:30:00Z"
  }
}
```

### Message Object

```json
{
  "id": "msg_001",
  "conversationId": "conv_user1_user2_1704067200000",
  "senderId": "user_123",
  "text": "Encrypted message content",
  "originalText": "Decrypted message for display",
  "contentType": "text",
  "media": null,
  "richContent": null,
  "replyTo": null,
  "reactions": [
    {
      "emoji": "👍",
      "count": 2,
      "users": ["user_123", "user_456"]
    }
  ],
  "readBy": ["user_456"],
  "editHistory": [
    {
      "text": "Original text",
      "editedAt": "2024-01-01T15:30:00Z"
    }
  ],
  "createdAt": "2024-01-01T15:30:00Z",
  "updatedAt": "2024-01-01T15:35:00Z",
  "isDeleted": false
}
```

### Reaction Object

```json
{
  "emoji": "👍",
  "count": 3,
  "users": ["user_123", "user_456", "user_789"]
}
```

### Typing Indicator

```json
{
  "conversationId": "conv_user1_user2_1704067200000",
  "userId": "user_123",
  "timestamp": "2024-01-01T15:30:00Z",
  "expiresAt": "2024-01-01T15:30:03Z"
}
```

### Link Preview

```json
{
  "url": "https://example.com/property",
  "title": "Beautiful 3BR House in Downtown",
  "description": "A stunning property with modern amenities",
  "image": "https://cdn.example.com/property-thumb.jpg",
  "domain": "example.com"
}
```

---

## API Endpoints

### Conversations

#### 1. Create Conversation

```http
POST /api/chat/conversations
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "participants": ["user_456", "user_789"],
  "name": "Property Discussion",
  "description": "Discussing property bid terms"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "conv_user_123_user_456_user_789_1704067200000",
    "participants": ["user_123", "user_456", "user_789"],
    "name": "Property Discussion",
    "description": "Discussing property bid terms",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "unreadCounts": {}
  },
  "message": "Conversation created successfully"
}
```

**Status Codes:**
- `201 Created` - Conversation created
- `400 Bad Request` - Missing participants
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

---

#### 2. Get User Conversations

```http
GET /api/chat/conversations?limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_user_123_user_456_1704067200000",
      "participants": ["user_123", "user_456"],
      "name": null,
      "unreadCounts": {
        "user_123": 3,
        "user_456": 0
      },
      "lastMessage": {
        "id": "msg_001",
        "senderId": "user_456",
        "text": "Looking good!",
        "timestamp": "2024-01-01T15:30:00Z"
      },
      "updatedAt": "2024-01-01T15:30:00Z"
    }
  ]
}
```

**Query Parameters:**
- `limit` (number, default: 20, max: 100) - Results per page
- `offset` (number, default: 0) - Pagination offset

---

#### 3. Get Conversation Info

```http
GET /api/chat/conversations/:conversationId
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "conv_user_123_user_456_1704067200000",
    "participants": ["user_123", "user_456"],
    "name": null,
    "description": null,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T15:30:00Z",
    "unreadCounts": {
      "user_123": 3,
      "user_456": 0
    },
    "messageCount": 45
  }
}
```

---

### Messages

#### 4. Get Messages from Conversation

```http
GET /api/chat/conversations/:conversationId/messages?limit=50&offset=0&search=hello
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "conversationId": "conv_user_123_user_456_1704067200000",
      "senderId": "user_123",
      "text": "Hello, interested in the property?",
      "contentType": "text",
      "media": null,
      "reactions": [
        {
          "emoji": "👍",
          "count": 1,
          "users": ["user_456"]
        }
      ],
      "readBy": ["user_456"],
      "createdAt": "2024-01-01T15:30:00Z",
      "updatedAt": "2024-01-01T15:30:00Z"
    }
  ]
}
```

**Query Parameters:**
- `limit` (number, default: 50, max: 200) - Results per page
- `offset` (number, default: 0) - Pagination offset
- `search` (string) - Search messages by keyword

---

#### 5. Send Message

```http
POST /api/chat/conversations/:conversationId/messages
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "text": "What's the asking price?",
  "contentType": "text",
  "media": null,
  "richContent": null,
  "replyTo": "msg_000"
}
```

**Request Body:**
- `text` (string, required if no media/richContent) - Message text
- `contentType` (enum: "text", "image", "document", "video", default: "text")
- `media` (object, optional) - Media attachment
  - `url` (string) - File URL
  - `filename` (string) - File name
  - `size` (number) - File size in bytes
  - `mimeType` (string) - MIME type
- `richContent` (object, optional) - Rich formatting
- `replyTo` (string, optional) - Message ID to reply to

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "msg_002",
    "conversationId": "conv_user_123_user_456_1704067200000",
    "senderId": "user_123",
    "text": "Encrypted content...",
    "originalText": "What's the asking price?",
    "contentType": "text",
    "reactions": [],
    "readBy": [],
    "createdAt": "2024-01-01T15:35:00Z"
  },
  "message": "Message sent successfully"
}
```

**Status Codes:**
- `201 Created` - Message sent
- `400 Bad Request` - Missing message content
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Conversation not found
- `500 Internal Server Error` - Server error

---

#### 6. Edit Message

```http
PUT /api/chat/conversations/:conversationId/messages/:messageId
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "text": "What's the final asking price?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "msg_002",
    "conversationId": "conv_user_123_user_456_1704067200000",
    "senderId": "user_123",
    "text": "Encrypted updated content...",
    "originalText": "What's the final asking price?",
    "editHistory": [
      {
        "text": "What's the asking price?",
        "editedAt": "2024-01-01T15:35:00Z"
      }
    ],
    "updatedAt": "2024-01-01T15:36:00Z"
  },
  "message": "Message edited successfully"
}
```

**Status Codes:**
- `200 OK` - Message edited
- `400 Bad Request` - Missing text
- `403 Forbidden` - Only message sender can edit
- `404 Not Found` - Message not found
- `500 Internal Server Error` - Server error

---

#### 7. Delete Message

```http
DELETE /api/chat/conversations/:conversationId/messages/:messageId
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Message deleted
- `403 Forbidden` - Only message sender can delete
- `404 Not Found` - Message not found
- `500 Internal Server Error` - Server error

---

### Reactions

#### 8. Add Reaction

```http
POST /api/chat/conversations/:conversationId/messages/:messageId/reactions
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "emoji": "👍"
}
```

**Supported Emojis:**
- `👍` - Thumbs up
- `❤️` - Heart
- `😂` - Face with tears of joy
- `😮` - Face with open mouth (surprised)
- `😢` - Crying face
- `🔥` - Fire (hot/popular)
- `👏` - Clapping hands
- `💯` - Hundred points (perfect)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "reactions": [
      {
        "emoji": "👍",
        "count": 2,
        "users": ["user_123", "user_456"]
      }
    ]
  },
  "message": "Reaction added successfully"
}
```

**Status Codes:**
- `201 Created` - Reaction added
- `400 Bad Request` - Missing emoji
- `500 Internal Server Error` - Server error

---

#### 9. Remove Reaction

```http
DELETE /api/chat/conversations/:conversationId/messages/:messageId/reactions?emoji=👍
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `emoji` (string, required) - Emoji to remove

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "reactions": [
      {
        "emoji": "❤️",
        "count": 1,
        "users": ["user_456"]
      }
    ]
  },
  "message": "Reaction removed successfully"
}
```

---

### Read Receipts

#### 10. Mark Message as Read

```http
POST /api/chat/conversations/:conversationId/messages/:messageId/read
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "readBy": ["user_456", "user_123"],
    "readAt": "2024-01-01T15:37:00Z"
  },
  "message": "Message marked as read"
}
```

---

### Typing Indicators

#### 11. Send Typing Indicator

```http
POST /api/chat/conversations/:conversationId/typing
Authorization: Bearer <JWT_TOKEN>
```

**Note:** Typing indicator auto-expires after 3 seconds. Send periodically while user is typing.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_user_123_user_456_1704067200000",
    "userId": "user_123",
    "timestamp": "2024-01-01T15:37:00Z",
    "expiresAt": "2024-01-01T15:37:03Z"
  }
}
```

---

#### 12. Get Typing Indicators

```http
GET /api/chat/conversations/:conversationId/typing
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_456",
      "timestamp": "2024-01-01T15:37:00Z",
      "expiresAt": "2024-01-01T15:37:03Z"
    }
  ]
}
```

---

### Media & Rich Content

#### 13. Upload Media

```http
POST /api/chat/conversations/:conversationId/media
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "filename": "property-photo.jpg",
  "size": 2048576,
  "mimeType": "image/jpeg",
  "url": "https://s3.amazonaws.com/uploads/property-photo.jpg"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "media_001",
    "conversationId": "conv_user_123_user_456_1704067200000",
    "senderId": "user_123",
    "filename": "property-photo.jpg",
    "size": 2048576,
    "url": "https://s3.amazonaws.com/uploads/property-photo.jpg",
    "uploadedAt": "2024-01-01T15:37:00Z"
  },
  "message": "Media uploaded successfully"
}
```

---

#### 14. Share Link Preview

```http
POST /api/chat/conversations/:conversationId/share-link
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "url": "https://example.com/property/luxury-downtown-house"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "msg_003",
    "conversationId": "conv_user_123_user_456_1704067200000",
    "senderId": "user_123",
    "url": "https://example.com/property/luxury-downtown-house",
    "preview": {
      "title": "Luxury Downtown House - $2.5M",
      "description": "Beautiful 4-bedroom property with stunning views",
      "image": "https://example.com/property-thumb.jpg",
      "domain": "example.com"
    },
    "createdAt": "2024-01-01T15:37:00Z"
  },
  "message": "Link shared successfully"
}
```

---

### Search

#### 15. Search Messages

```http
GET /api/chat/conversations/:conversationId/search?q=price
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `q` (string, required) - Search query

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "conversationId": "conv_user_123_user_456_1704067200000",
      "senderId": "user_123",
      "text": "What's the asking price?",
      "originalText": "What's the asking price?",
      "contentType": "text",
      "createdAt": "2024-01-01T15:35:00Z"
    },
    {
      "id": "msg_002",
      "conversationId": "conv_user_123_user_456_1704067200000",
      "senderId": "user_456",
      "text": "Final price is $500,000",
      "originalText": "Final price is $500,000",
      "contentType": "text",
      "createdAt": "2024-01-01T15:36:00Z"
    }
  ]
}
```

---

## Features

### 1. End-to-End Encryption

All messages are encrypted using AES-256-CBC encryption:

```javascript
// Encryption process
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
let encrypted = cipher.update(message, 'utf8', 'hex');
encrypted += cipher.final('hex');
return iv + encrypted; // Store IV with encrypted data
```

**Security Benefits:**
- ✅ Messages encrypted at rest in database
- ✅ Only intended recipients can decrypt
- ✅ Random IV per message prevents pattern detection
- ✅ Encrypted text differs each time despite same content

---

### 2. Message Reactions

Support for 8 reaction types with real-time updates:

```javascript
const reactions = {
  '👍': 'Thumbs Up',
  '❤️': 'Heart',
  '😂': 'Laugh',
  '😮': 'Surprised',
  '😢': 'Sad',
  '🔥': 'Fire',
  '👏': 'Applause',
  '💯': 'Perfect'
};
```

---

### 3. Rich Media Support

Support for multiple content types:

```json
{
  "contentType": "image",
  "media": {
    "url": "https://example.com/photo.jpg",
    "filename": "property-photo.jpg",
    "size": 2048576,
    "mimeType": "image/jpeg"
  }
}
```

Supported types: text, image, document, video

---

### 4. Read Receipts & Typing Indicators

**Real-time awareness:**
- See who's typing (with 3-second auto-expiration)
- Track when each participant reads messages
- Unread count per user per conversation

---

### 5. Message Editing

Edit messages with full audit trail:

```json
{
  "originalText": "Updated text",
  "editHistory": [
    {
      "text": "Original text",
      "editedAt": "2024-01-01T15:35:00Z"
    }
  ]
}
```

---

### 6. Threaded Replies

Support for reply-to functionality:

```json
{
  "text": "Looks great!",
  "replyTo": "msg_001"
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common Error Codes

| Status | Code | Message | Solution |
|--------|------|---------|----------|
| 400 | Bad Request | Missing required fields | Check request body |
| 401 | Unauthorized | Invalid JWT token | Refresh token |
| 403 | Forbidden | Access denied | Check user permissions |
| 404 | Not Found | Resource not found | Verify IDs |
| 429 | Too Many Requests | Rate limit exceeded | Wait before retrying |
| 500 | Server Error | Internal server error | Contact support |

---

## React Integration Examples

### 1. Start a Conversation

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function CreateConversation() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const createConversation = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        '/api/chat/conversations',
        {
          participants,
          name: 'Property Discussion'
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Conversation created:', response.data.data);
    } catch (error) {
      console.error('Failed to create conversation:', error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* UI for selecting participants */}
      <button onClick={createConversation} disabled={loading}>
        {loading ? 'Creating...' : 'Create Conversation'}
      </button>
    </div>
  );
}

export default CreateConversation;
```

---

### 2. Chat Message List Component

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ChatMessages({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `/api/chat/conversations/${conversationId}/messages?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setMessages(response.data.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <div key={message.id} className="message">
          <div className="message-sender">{message.senderId}</div>
          <div className="message-text">{message.originalText}</div>
          <div className="message-time">
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
          {message.reactions.length > 0 && (
            <div className="message-reactions">
              {message.reactions.map((reaction) => (
                <span key={reaction.emoji} className="reaction">
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatMessages;
```

---

### 3. Send Message Component

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function SendMessage({ conversationId, onMessageSent }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `/api/chat/conversations/${conversationId}/messages`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setText('');
      onMessageSent(response.data.data);
    } catch (error) {
      console.error('Failed to send message:', error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-message">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage} disabled={loading || !text.trim()}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}

export default SendMessage;
```

---

### 4. Message Reactions Component

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function MessageReactions({ conversationId, messageId, reactions }) {
  const [adding, setAdding] = useState(false);

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '💯'];

  const addReaction = async (emoji) => {
    try {
      setAdding(true);
      await axios.post(
        `/api/chat/conversations/${conversationId}/messages/${messageId}/reactions`,
        { emoji },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="message-reactions">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          className="reaction-button"
          onClick={() => addReaction(reaction.emoji)}
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}
      
      <div className="reaction-picker">
        {reactionEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => addReaction(emoji)}
            disabled={adding}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MessageReactions;
```

---

### 5. Typing Indicator Component

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TypingIndicators({ conversationId }) {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const interval = setInterval(fetchTypingIndicators, 1000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const fetchTypingIndicators = async () => {
    try {
      const response = await axios.get(
        `/api/chat/conversations/${conversationId}/typing`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setTypingUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch typing indicators:', error);
    }
  };

  return (
    <div className="typing-indicators">
      {typingUsers.length > 0 && (
        <div className="typing-notification">
          {typingUsers.length === 1
            ? `${typingUsers[0].userId} is typing...`
            : `${typingUsers.length} people are typing...`}
          <span className="typing-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default TypingIndicators;
```

---

### 6. Send Typing Indicator

```javascript
import React, { useRef } from 'react';
import axios from 'axios';

function MessageInput({ conversationId }) {
  const typingTimeoutRef = useRef(null);

  const handleInput = async (e) => {
    const text = e.target.value;

    // Send typing indicator
    try {
      await axios.post(
        `/api/chat/conversations/${conversationId}/typing`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  return (
    <input
      type="text"
      placeholder="Type your message..."
      onChange={handleInput}
    />
  );
}

export default MessageInput;
```

---

### 7. Search Messages Component

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function SearchMessages({ conversationId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/chat/conversations/${conversationId}/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setResults(response.data.data);
    } catch (error) {
      console.error('Failed to search messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-messages">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search messages..."
      />
      <button onClick={search} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div className="search-results">
        {results.map((message) => (
          <div key={message.id} className="search-result">
            <div className="sender">{message.senderId}</div>
            <div className="text">{message.originalText}</div>
            <div className="timestamp">
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchMessages;
```

---

## Real-time Features

### WebSocket Integration (Socket.io)

For real-time features, integrate Socket.io with the Chat Enhanced service:

```javascript
// Client side
import io from 'socket.io-client';

const socket = io('https://api.propertyark.com', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message received:', message);
  // Update UI with new message
});

// Listen for typing indicators
socket.on('user_typing', (data) => {
  console.log(`${data.userId} is typing...`);
  // Update UI
});

// Listen for reactions
socket.on('reaction_added', (reaction) => {
  console.log('Reaction added:', reaction);
  // Update UI
});
```

---

## Security & Encryption

### Message Encryption Process

1. **Plaintext Message:**
   ```
   "What's the asking price?"
   ```

2. **Encryption:**
   - Generate random 16-byte IV
   - Use AES-256-CBC with secret key
   - Produce encrypted hex string

3. **Storage:**
   ```json
   {
     "text": "8f3a8c2b...encrypted...9d4e2f1a",
     "originalText": "What's the asking price?"
   }
   ```

4. **Response to User:**
   - Return decrypted `originalText` for display
   - Store encrypted `text` for security

### Key Management

- ✅ Secret key stored in environment variables
- ✅ Random IV generated per message
- ✅ IV prepended to encrypted data
- ✅ Only backend can decrypt messages
- ✅ Database stores only encrypted text

---

## Rate Limiting

**Rate Limit Tiers:**
- Messages: 10 per second per user
- Reactions: 5 per second per user
- Conversations: 2 per second per user
- Search: 3 per second per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1704067260
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## Troubleshooting

### Issue: Messages not encrypting properly

**Solution:** Ensure `chatEnhancedService.js` is properly imported and crypto module is available.

```javascript
const crypto = require('crypto');
```

---

### Issue: Typing indicators not disappearing

**Solution:** Typing indicators auto-expire after 3 seconds. If stale indicators persist, client should filter by `timestamp` and exclude entries older than 3 seconds.

```javascript
const activeTyping = typingIndicators.filter((indicator) => {
  const age = Date.now() - new Date(indicator.timestamp).getTime();
  return age < 3000; // Exclude older than 3 seconds
});
```

---

### Issue: Read receipts not updating

**Solution:** Call the `/read` endpoint for each message to mark as read. This updates the `readBy` array.

```javascript
await axios.post(
  `/api/chat/conversations/${conversationId}/messages/${messageId}/read`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## API Summary Table

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/conversations` | POST | Create conversation | ✅ |
| `/conversations` | GET | List user conversations | ✅ |
| `/conversations/:id` | GET | Get conversation info | ✅ |
| `/conversations/:id/messages` | GET | Get messages | ✅ |
| `/conversations/:id/messages` | POST | Send message | ✅ |
| `/conversations/:id/messages/:id` | PUT | Edit message | ✅ |
| `/conversations/:id/messages/:id` | DELETE | Delete message | ✅ |
| `/conversations/:id/messages/:id/reactions` | POST | Add reaction | ✅ |
| `/conversations/:id/messages/:id/reactions` | DELETE | Remove reaction | ✅ |
| `/conversations/:id/messages/:id/read` | POST | Mark as read | ✅ |
| `/conversations/:id/typing` | POST | Send typing indicator | ✅ |
| `/conversations/:id/typing` | GET | Get typing indicators | ✅ |
| `/conversations/:id/media` | POST | Upload media | ✅ |
| `/conversations/:id/share-link` | POST | Share link preview | ✅ |
| `/conversations/:id/search` | GET | Search messages | ✅ |

---

## Support & Contact

For API support or issues:
- 📧 Email: api-support@propertyark.com
- 📱 Slack: #chat-api-support
- 📖 Documentation: https://docs.propertyark.com/chat

---

**Last Updated:** January 1, 2024
**Version:** 1.0.0
**Status:** Production Ready
