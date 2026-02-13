import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authToken';
import { getApiUrl } from '../utils/apiConfig';
import MinimalChat from '../components/MinimalChat';
import { FaEnvelope, FaSearch } from 'react-icons/fa';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await authenticatedFetch(getApiUrl('/chat/conversations'));
        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setConversations(data);
      } catch (err) {
        console.error('Failed to load conversations', err);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
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
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="mt-3 relative">
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

