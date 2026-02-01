import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaSearch, FaPaperPlane, FaPhone, FaVideo, FaReply, FaArchive, FaTrash, FaStar, FaCircle, FaCheck, FaCheckDouble, FaImage, FaFile, FaSmile, FaUserShield, FaExclamationTriangle, FaClock, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';
import { io } from 'socket.io-client';

const AdminChatSupport = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Determine socket URL based on environment
    const getSocketUrl = () => {
      console.log('AdminChatSupport: Current hostname:', window.location.hostname);
      if (window.location.hostname === 'localhost') {
        console.log('AdminChatSupport: Using localhost:5000 for development');
        return 'http://localhost:5000';
      }
      // For production, use the same origin as API
      const apiUrl = getApiUrl('', { replaceProtocol: true });
      const socketUrl = apiUrl.split('/api')[0]; // Remove /api path if present
      console.log('AdminChatSupport: Using production URL:', { apiUrl, socketUrl });
      return socketUrl;
    };
    
    const socketUrl = getSocketUrl();
    console.log('AdminChatSupport: Initializing Socket.IO connection to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect', () => {
      console.log('AdminChatSupport: Socket connected successfully');
      setSocket(newSocket);
      
      // Join admin room
      const adminId = localStorage.getItem('userId') || 'admin';
      console.log('AdminChatSupport: Joining admin room with ID:', adminId);
      newSocket.emit('join-admin-room', { adminId });
    });

    newSocket.on('connect_error', (error) => {
      console.error('AdminChatSupport: Socket connection error:', error);
      console.warn('AdminChatSupport: Falling back to polling for real-time updates');
      // Continue trying - polling will handle it
    });

    newSocket.on('disconnect', () => {
      console.log('AdminChatSupport: Socket disconnected');
    });

    // Listen for new conversations
    newSocket.on('new-conversation', (data) => {
      console.log('AdminChatSupport: New conversation received:', data);
      setConversations(prev => [data.conversation, ...prev]);
      toast.success(`New ${data.conversation.category} from ${data.conversation.type.replace('_support', '')}`);
    });

    // Listen for new messages
    newSocket.on('new-message', (data) => {
      console.log('AdminChatSupport: New message received:', data);
      setConversations(prev => prev.map(conv => 
        conv.id === data.conversationId 
          ? {
              ...conv,
              lastMessage: {
                text: data.message.text,
                timestamp: data.message.timestamp,
                sender: data.sender,
                isRead: false,
                isAdmin: data.isAdmin
              },
              unreadCount: data.isAdmin ? 0 : (conv.unreadCount + 1)
            }
          : conv
      ));

      if (selectedConversation?.id === data.conversationId) {
        setSelectedConversation(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), data.message]
        }));
      }
    });

    return () => {
      console.log('AdminChatSupport: Cleaning up Socket.IO connection');
      newSocket.close();
    };
  }, [selectedConversation?.id]);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, [filterStatus, sortBy]);

  const fetchConversations = async () => {
    try {
      console.log('AdminChatSupport: Fetching conversations...');
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (sortBy === 'urgent') params.append('priority', 'urgent');

      const url = getApiUrl(`/admin/chat/conversations?${params.toString()}`);
      console.log('AdminChatSupport: Fetching from URL:', url);

      const response = await authenticatedFetch(url);

      console.log('AdminChatSupport: Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please login to access chat support');
          return;
        }
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      console.log('AdminChatSupport: Conversations fetched:', data);
      setConversations(data.data || []);
    } catch (error) {
      console.error('AdminChatSupport: Error fetching conversations:', error);
      toast.error('Failed to load conversations. Please refresh the page.');
      // Set empty array to prevent infinite loading
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    
    try {
      const response = await authenticatedFetch(getApiUrl('/admin/chat/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          message: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update local state immediately for better UX
      setSelectedConversation(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), data.data],
        lastMessage: {
          text: newMessage.trim(),
          timestamp: new Date().toISOString(),
          sender: 'admin',
          isRead: true,
          isAdmin: true
        }
      }));

      setNewMessage('');
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
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

  const fetchConversation = async (conversationId) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/admin/chat/conversations/${conversationId}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setSelectedConversation(data.data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/admin/chat/conversations/${conversationId}/read`), {
        method: 'POST'
      });

      if (response.ok) {
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const assignToAdmin = (conversationId, adminId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, assignedTo: adminId }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'payment_issue':
        return 'text-purple-600 bg-purple-100';
      case 'price_negotiation':
        return 'text-blue-600 bg-blue-100';
      case 'account_issue':
        return 'text-green-600 bg-green-100';
      case 'property_inquiry':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAndSortedConversations = conversations
    .filter(conv => {
      // Search filter
      const matchesSearch = conv.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conv.contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (conv.property && conv.property.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'unread') {
        matchesStatus = conv.unreadCount > 0;
      } else if (filterStatus === 'urgent') {
        matchesStatus = conv.priority === 'urgent';
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sorting logic
      if (sortBy === 'urgent') {
        // Urgent conversations first
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      }
      // Then by timestamp
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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaUserShield className="mr-2 text-brand-blue" />
                Chat Support
              </h1>
              <div className="flex items-center space-x-2">
                <span className="bg-brand-blue text-white text-xs rounded-full px-2 py-1">
                  {conversations.filter(c => c.unreadCount > 0).length} unread
                </span>
                <span className="bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                  {conversations.filter(c => c.priority === 'urgent').length} urgent
                </span>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="urgent">Urgent</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              >
                <option value="recent">Recent</option>
                <option value="urgent">Urgent First</option>
              </select>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredAndSortedConversations.length === 0 ? (
              <div className="p-6 text-center">
                <FaEnvelope className="text-gray-300 text-4xl mx-auto mb-2" />
                <p className="text-gray-500">No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAndSortedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      markAsRead(conversation.id);
                    }}
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
                        {conversation.priority === 'urgent' && (
                          <FaExclamationTriangle className="absolute -top-1 -right-1 text-red-500 text-xs" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate flex items-center">
                            {conversation.contact.name}
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getPriorityColor(conversation.priority)}`}>
                              {conversation.priority}
                            </span>
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
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(conversation.category)}`}>
                              {conversation.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {conversation.contact.role}
                            </span>
                          </div>
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
                        {selectedConversation.contact.role} • {selectedConversation.contact.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedConversation.priority)}`}>
                      {selectedConversation.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(selectedConversation.category)}`}>
                      {selectedConversation.category.replace('_', ' ')}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                      <FaPhone />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                      <FaVideo />
                    </button>
                  </div>
                </div>
              </div>

              {/* Property Info (if applicable) */}
              {selectedConversation.property && (
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
                      <p className="text-sm text-gray-600">Related Property</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isAdmin
                          ? 'bg-brand-blue text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {message.isAdmin && (
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {message.adminName || 'Admin Support'}
                        </p>
                      )}
                      <p className="text-sm">{message.text}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        message.isAdmin ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.isAdmin && (
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
                      placeholder="Type your response as admin..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                      rows="1"
                      disabled={sendingMessage}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="p-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaPaperPlane />
                    )}
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
                  Choose a conversation from the sidebar to start providing support
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatSupport;
