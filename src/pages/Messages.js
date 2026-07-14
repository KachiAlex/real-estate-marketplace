import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import MinimalChat from '../components/MinimalChat';
import { FaEnvelope, FaSearch, FaSync } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
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
      console.log('[Messages] Conversations loaded:', data.length > 0 ? data : 'empty');
      if (data.length > 0) {
        console.log('[Messages] First conversation ID format:', data[0].id);
      }
      setConversations(data);
      return data;
    } catch (err) {
      console.error('Failed to load conversations', err);
      setConversations([]);
      return [];
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
    fetchConversations().then((data) => {
      // Auto-select conversation if navigated from PropertyDetail
      const autoSelectConversation = location.state?.autoSelectConversation;
      const vendorId = location.state?.vendorId;
      const propertyId = location.state?.propertyId;
      
      console.log('[Messages] useEffect triggered with state:', {
        autoSelectConversation,
        vendorId,
        propertyId,
        dataLength: data.length
      });
      
      if (autoSelectConversation && data.length > 0) {
        // Try to find by the exact ID first (chatId format: propertyId-sortedId1-sortedId2)
        let targetConv = data.find(c => c.id === autoSelectConversation);
        
        // If not found on first try, it might be because the conversation wasn't included yet
        // Try alternative lookups
        if (!targetConv) {
          // Try to find by propertyId (should match the first part of chatId)
          targetConv = data.find(c => c.id.includes(propertyId));
          if (targetConv) {
            console.log('[Messages] Found by propertyId match:', targetConv.id);
          }
        }
        
        // If still not found, try by conversationId (the UUID format)
        if (!targetConv) {
          targetConv = data.find(c => c.conversationId === autoSelectConversation);
          if (targetConv) {
            console.log('[Messages] Found by conversationId match:', targetConv.id);
          }
        }
        
        if (targetConv) {
          setSelectedConversation(targetConv);
          console.log('[Messages] ✅ Auto-selected conversation:', targetConv.id);
        } else {
          // Conversation not found in initial list - might be fresh
          // Set a flag to refetch and try again after a short delay
          console.log('[Messages] Target conversation not found in initial list, will retry...');
          
          // Wait a moment, then refetch conversations (new ones might not have appeared yet)
          const retryTimer = setTimeout(async () => {
            console.log('[Messages] Retrying conversation fetch...');
            const retryData = await fetchConversations();
            
            // Try again with fresh data
            let retryConv = retryData?.find(c => c.id === autoSelectConversation);
            if (!retryConv) {
              retryConv = retryData?.find(c => c.id.includes(propertyId));
            }
            if (!retryConv) {
              retryConv = retryData?.find(c => c.conversationId === autoSelectConversation);
            }
            
            if (retryConv) {
              setSelectedConversation(retryConv);
              console.log('[Messages] ✅ Found after retry:', retryConv.id);
            } else if (retryData?.length > 0) {
              // Still not found, select the most recent
              console.log('[Messages] Still not found, selecting most recent');
              setSelectedConversation(retryData[0]);
            }
          }, 500);
          
          return () => clearTimeout(retryTimer);
        }
      }
    });

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
  }, [location.state]);

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
                chatId={selectedConversation.id}
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

