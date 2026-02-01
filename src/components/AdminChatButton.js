import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaHeadset, FaExclamationTriangle, FaCreditCard, FaHome, FaUser, FaQuestion, FaHistory, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import chatService from '../services/chatService';
import { authenticatedFetch } from '../utils/authToken';

const AdminChatButton = ({ propertyId = null, category = 'general_inquiry' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [userConversations, setUserConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const issueTypes = [
    { value: 'payment_issue', label: 'Payment Problem', icon: FaCreditCard, color: 'text-red-600' },
    { value: 'account_issue', label: 'Account Help', icon: FaUser, color: 'text-blue-600' },
    { value: 'property_inquiry', label: 'Property Question', icon: FaQuestion, color: 'text-green-600' },
    { value: 'report_issue', label: 'Report a Problem', icon: FaExclamationTriangle, color: 'text-orange-600' },
    { value: 'general_inquiry', label: 'General Support', icon: FaComments, color: 'text-purple-600' }
  ];

  // Load conversation history when opening chat
  useEffect(() => {
    if (isOpen && !loadingHistory) {
      fetchUserConversations();
    }
  }, [isOpen]);

  const fetchUserConversations = async () => {
    try {
      setLoadingHistory(true);
      const response = await authenticatedFetch(getApiUrl('/api/chat/conversations'));
      if (response.ok) {
        const data = await response.json();
        setUserConversations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    if (!user) {
      toast.error('Please login to contact support');
      return;
    }

    setSending(true);
    
    try {
      console.log('AdminChatButton: Sending message...', {
        userId: user.uid,
        message: message.trim(),
        category: selectedIssue || category,
        propertyId,
        userRole: user.role
      });

      const response = await fetch(getApiUrl('/api/chat/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user.uid,
          message: message.trim(),
          category: selectedIssue || category,
          propertyId
        })
      });

      console.log('AdminChatButton: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AdminChatButton: Error response:', errorData);
        throw new Error(errorData.error || `Failed to send message (${response.status})`);
      }

      const result = await response.json();
      console.log('AdminChatButton: Success response:', result);
      
      toast.success('Your message has been sent to our support team. We\'ll respond shortly!');
      setMessage('');
      setSelectedIssue('');
      setIsOpen(false);
      
    } catch (error) {
      console.error('AdminChatButton: Error sending message to admin:', error);
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (!user) {
    return null; // Don't show chat button for non-logged-in users
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Widget */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-brand-blue text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {showHistory ? <FaHistory className="text-xl" /> : <FaComments className="text-xl" />}
              <div>
                <h3 className="font-semibold">{showHistory ? 'Chat History' : 'Admin Support'}</h3>
                <p className="text-xs opacity-90">{showHistory ? 'View past conversations' : 'We typically respond within minutes'}</p>
              </div>
            </div>
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              >
                <FaArrowLeft />
              </button>
            )}
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
                title="View conversation history"
              >
                <FaHistory />
              </button>
            )}
            <button
              onClick={toggleChat}
              className="text-white hover:bg-white/20 rounded p-1 transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Conversation History View */}
          {showHistory && (
            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue"></div>
                </div>
              ) : userConversations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No past conversations</p>
              ) : (
                <div className="space-y-2">
                  {userConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        toast.info(`Conversation reopened. You can continue chatting with support about this ${conv.category.replace(/_/g, ' ')}.`);
                        setShowHistory(false);
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{conv.category.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-600 truncate">{conv.lastMessage?.text}</p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-semibold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conv.lastMessage?.timestamp).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Issue Selection */}
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">What can we help you with?</p>
            <div className="space-y-2">
              {issueTypes.map((issue) => {
                const Icon = issue.icon;
                return (
                  <button
                    key={issue.value}
                    onClick={() => setSelectedIssue(issue.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center space-x-3 ${
                      selectedIssue === issue.value
                        ? 'border-brand-blue bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`${issue.color} text-lg`} />
                    <span className="text-sm font-medium">{issue.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Form */}
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="mb-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                rows="4"
                disabled={sending}
              />
            </div>
            
            {propertyId && (
              <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                This message will be linked to the current property
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full bg-brand-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Support hours: 24/7 • Response time: Usually within minutes
            </p>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="bg-brand-blue text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all hover:scale-110 group relative"
      >
        <FaComments className="text-xl" />
        
        {/* Pulse animation for new messages */}
        <div className="absolute inset-0 rounded-full bg-brand-blue animate-ping opacity-25"></div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
            Chat with Admin Support
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default AdminChatButton;
