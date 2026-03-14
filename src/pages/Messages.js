import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import MinimalChat from '../components/MinimalChat';
import { FaEnvelope, FaSearch, FaSync } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/chats/conversations');
      const payload = resp.data || {};
      const data = Array.isArray(payload?.data) ? payload.data : [];
      console.log('[Messages] Conversations loaded:', data);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchConversations();
      toast.success('Conversations refreshed', { duration: 1500 });
    } catch (err) {
      toast.error('Failed to refresh conversations');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Auto-refresh every 10 seconds to catch new conversations
    const interval = setInterval(fetchConversations, 10000);
    
    // Also refresh when window becomes visible (user switches tabs back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchConversations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filtered = conversations.filter(c => {
    const name = c.contact?.name || '';
    const title = c.property?.title || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 h-full">
      <div className="flex h-full bg-white rounded-lg shadow overflow-hidden">
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Messages</h2>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                title="Refresh conversations"
              >
                <FaSync className={`${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                className="w-full pl-10 pr-3 py-2 border rounded-md"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">Loading conversations…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FaEnvelope className="mx-auto mb-2 text-3xl text-gray-300" />
                No conversations
              </div>
            ) : (
              filtered.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedConversation?.id === conv.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="font-medium">{conv.contact?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-600 truncate">{conv.lastMessage?.text || conv.property?.title}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex">
          {selectedConversation ? (
            <div className="flex-1 p-4">
              <div className="border-b pb-3 mb-3">
                <h3 className="font-semibold">{selectedConversation.contact?.name}</h3>
                <div className="text-sm text-gray-600">{selectedConversation.contact?.role}</div>
              </div>

              <MinimalChat
                userId={user?.id || user?.uid || user?.email}
                peerId={selectedConversation.contact?.id || selectedConversation.contact?.userId}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

