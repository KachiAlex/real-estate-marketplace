import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaSyncAlt } from 'react-icons/fa';
import apiClient from '../services/apiClient';

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.get('/admin/support/inquiries');
      const data = resp.data || {};
      if (!data?.success) throw new Error(data?.message || 'Failed to load tickets');
      setTickets(data.data || []);
    } catch (err) {
      console.error('Admin tickets load error:', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateTicket = async (id, updates) => {
    setUpdating(true);
    try {
      const resp = await apiClient.put(`/admin/support/inquiries/${id}`, updates);
      const data = resp.data || {};
      if (!data?.success) throw new Error(data?.message || 'Update failed');
      toast.success(data.message || 'Ticket updated');
      setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...data.data } : t)));
    } catch (err) {
      console.error('Update ticket error:', err);
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6">Loading tickets...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  // Get unique priorities and categories for filtering
  const priorities = Array.from(new Set(tickets.map(t => t.priority || 'medium')));
  const categories = Array.from(new Set(tickets.map(t => t.category || 'other')));

  // Filter tickets by selected priority and category
  const filteredTickets = tickets.filter(t =>
    (selectedPriority === 'all' || t.priority === selectedPriority) &&
    (selectedCategory === 'all' || t.category === selectedCategory)
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Support Tickets</h1>
        <button className="btn" onClick={loadTickets}><FaSyncAlt className="inline mr-2"/> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} className="border px-2 py-1 rounded">
            <option value="all">All</option>
            {priorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border px-2 py-1 rounded">
            <option value="all">All</option>
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-white p-6 rounded shadow">No tickets found for selected filters.</div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{ticket.category} — {ticket.status}</h3>
                  <p className="text-sm text-gray-600">{ticket.userName || ticket.userEmail} • {new Date(ticket.createdAt).toLocaleString()}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${ticket.priority === 'high' ? 'bg-red-200 text-red-800' : ticket.priority === 'critical' ? 'bg-red-600 text-white' : ticket.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>{ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : 'Medium'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={updating}
                    title={ticket.isRead ? 'Mark unread' : 'Mark read'}
                    onClick={() => updateTicket(ticket.id, { isRead: !ticket.isRead })}
                    className={`px-3 py-1 rounded ${ticket.isRead ? 'bg-gray-100' : 'bg-green-100'} text-sm`}
                  >
                    {ticket.isRead ? 'Read' : 'New'}
                  </button>
                  <select
                    value={ticket.status || 'new'}
                    onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                    disabled={updating}
                    className="border px-2 py-1 rounded"
                  >
                    <option value="new">new</option>
                    <option value="open">open</option>
                    <option value="pending">pending</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </div>

              <pre className="mt-3 whitespace-pre-wrap text-sm">{ticket.message}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupportTickets;
