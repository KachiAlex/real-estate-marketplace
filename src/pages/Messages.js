import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaEnvelope, FaSearch, FaPaperPlane, FaPhone, FaVideo, FaEllipsisV, FaReply, FaForward, FaArchive, FaTrash, FaStar, FaCircle, FaCheck, FaCheckDouble, FaImage, FaFile, FaSmile } from 'react-icons/fa';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Mock conversations data
  useEffect(() => {
    const mockConversations = [
      {
        id: 1,
        contact: {
          id: 1,
          name: "Sarah Johnson",
          role: "Property Agent",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
          phone: "+234 801 234 5678",
          email: "sarah@naijaluxury.com",
          isOnline: true
        },
        property: {
          id: 1,
          title: "Luxury 4-Bedroom Villa in Victoria Island",
          image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=100&h=100&fit=crop"
        },
        lastMessage: {
          text: "I've scheduled the viewing for Saturday 2 PM. Please confirm if that works for you.",
          timestamp: "2024-01-15T14:30:00Z",
          sender: "agent",
          isRead: true
        },
        unreadCount: 0,
        isStarred: true,
        isArchived: false,
        messages: [
          {
            id: 1,
            text: "Hi! I'm interested in the 4-bedroom villa in Victoria Island. Could you provide more details?",
            timestamp: "2024-01-15T10:30:00Z",
            sender: "user",
            isRead: true
          },
          {
            id: 2,
            text: "Hello! Thank you for your interest. The villa is a beautiful 4-bedroom property with a private pool, gym, and 24/7 security. It's located in a prime area of Victoria Island. Would you like to schedule a viewing?",
            timestamp: "2024-01-15T10:45:00Z",
            sender: "agent",
            isRead: true
          },
          {
            id: 3,
            text: "Yes, I'd love to see it. What are your available times this weekend?",
            timestamp: "2024-01-15T11:00:00Z",
            sender: "user",
            isRead: true
          },
          {
            id: 4,
            text: "I've scheduled the viewing for Saturday 2 PM. Please confirm if that works for you.",
            timestamp: "2024-01-15T14:30:00Z",
            sender: "agent",
            isRead: true
          }
        ]
      },
      {
        id: 2,
        contact: {
          id: 2,
          name: "Michael Adebayo",
          role: "Property Agent",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
          phone: "+234 802 345 6789",
          email: "michael@naijaluxury.com",
          isOnline: false
        },
        property: {
          id: 2,
          title: "Modern 3-Bedroom Apartment in Ikoyi",
          image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop"
        },
        lastMessage: {
          text: "The maintenance fee is ₦150,000 monthly and includes all amenities I mentioned.",
          timestamp: "2024-01-12T16:10:00Z",
          sender: "agent",
          isRead: true
        },
        unreadCount: 0,
        isStarred: false,
        isArchived: false,
        messages: [
          {
            id: 1,
            text: "What are the maintenance fees for the Ikoyi apartment?",
            timestamp: "2024-01-12T09:15:00Z",
            sender: "user",
            isRead: true
          },
          {
            id: 2,
            text: "The monthly maintenance fee is ₦150,000 and includes: 24/7 security, generator backup, swimming pool, gym, children's playground, and regular maintenance of common areas.",
            timestamp: "2024-01-12T11:45:00Z",
            sender: "agent",
            isRead: true
          },
          {
            id: 3,
            text: "Thank you for the information. I'm also interested in the parking situation - how many parking spaces are allocated per unit?",
            timestamp: "2024-01-12T15:30:00Z",
            sender: "user",
            isRead: true
          },
          {
            id: 4,
            text: "Each unit comes with 2 covered parking spaces. There's also additional visitor parking available.",
            timestamp: "2024-01-12T16:10:00Z",
            sender: "agent",
            isRead: true
          }
        ]
      },
      {
        id: 3,
        contact: {
          id: 3,
          name: "Grace Okafor",
          role: "Property Agent",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
          phone: "+234 803 456 7890",
          email: "grace@naijaluxury.com",
          isOnline: true
        },
        property: {
          id: 3,
          title: "Elegant 2-Bedroom Penthouse in Lekki",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop"
        },
        lastMessage: {
          text: "I have a similar penthouse that just became available. Would you like me to send you the details?",
          timestamp: "2024-01-08T17:20:00Z",
          sender: "agent",
          isRead: true
        },
        unreadCount: 0,
        isStarred: false,
        isArchived: false,
        messages: [
          {
            id: 1,
            text: "Is the Lekki penthouse still available? I'm looking to make an offer.",
            timestamp: "2024-01-08T16:45:00Z",
            sender: "user",
            isRead: true
          },
          {
            id: 2,
            text: "I'm sorry, but this property was sold yesterday. However, I have a similar penthouse in the same building that just became available. Would you like me to send you the details?",
            timestamp: "2024-01-08T17:20:00Z",
            sender: "agent",
            isRead: true
          }
        ]
      },
      {
        id: 4,
        contact: {
          id: 4,
          name: "David Okonkwo",
          role: "Property Agent",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          phone: "+234 804 567 8901",
          email: "david@naijaluxury.com",
          isOnline: false
        },
        property: {
          id: 4,
          title: "Spacious 5-Bedroom Duplex in Abuja",
          image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=100&fit=crop"
        },
        lastMessage: {
          text: "I'll get back to you with the rental yield data for the Asokoro area.",
          timestamp: "2024-01-05T14:00:00Z",
          sender: "agent",
          isRead: false
        },
        unreadCount: 1,
        isStarred: false,
        isArchived: false,
        messages: [
          {
            id: 1,
            text: "I'm interested in this property for investment purposes. What's the rental yield potential in this area?",
            timestamp: "2024-01-05T13:20:00Z",
            sender: "user",
            isRead: true
          },
          {
            id: 2,
            text: "I'll get back to you with the rental yield data for the Asokoro area.",
            timestamp: "2024-01-05T14:00:00Z",
            sender: "agent",
            isRead: false
          }
        ]
      }
    ];

    setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      timestamp: new Date().toISOString(),
      sender: "user",
      isRead: true
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? {
            ...conv,
            messages: [...conv.messages, message],
            lastMessage: {
              text: newMessage,
              timestamp: new Date().toISOString(),
              sender: "user",
              isRead: true
            }
          }
        : conv
    ));

    setNewMessage('');
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleStar = (conversationId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, isStarred: !conv.isStarred }
        : conv
    ));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedConversations = filteredConversations.sort((a, b) => {
    // Unread messages first, then by timestamp
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
    return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="flex h-full bg-white rounded-lg shadow overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Messages</h1>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {sortedConversations.length === 0 ? (
              <div className="p-6 text-center">
                <FaEnvelope className="text-gray-300 text-4xl mx-auto mb-2" />
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-brand-blue' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.contact.avatar}
                          alt={conversation.contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {conversation.contact.isOnline && (
                          <FaCircle className="absolute bottom-0 right-0 text-green-500 text-xs" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.contact.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(conversation.id);
                              }}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              <FaStar className={conversation.isStarred ? "text-yellow-500" : ""} />
                            </button>
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conversation.lastMessage.text}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.property.title}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-brand-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={selectedConversation.contact.avatar}
                        alt={selectedConversation.contact.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {selectedConversation.contact.isOnline && (
                        <FaCircle className="absolute bottom-0 right-0 text-green-500 text-xs" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.contact.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.contact.role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                      <FaPhone />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                      <FaVideo />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedConversation.property.image}
                    alt={selectedConversation.property.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedConversation.property.title}
                    </h4>
                    <p className="text-sm text-gray-600">Property Discussion</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-brand-blue text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.sender === 'user' && (
                          <FaCheckDouble className="text-xs" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                    <FaImage />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                    <FaFile />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                    <FaSmile />
                  </button>
                  
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                      rows="1"
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FaEnvelope className="text-gray-300 text-6xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                <p className="text-gray-600">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
