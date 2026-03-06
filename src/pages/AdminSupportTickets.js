import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheck, FaEnvelope, FaPhone, FaSyncAlt } from 'react-icons/fa';
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
      const resp = await apiClient.get('/support/admin/inquiries');
      const data = resp.data || {};
      if (!data?.success) throw new Error(data?.message || 'Failed to load tickets');
      setTickets(data.data || []);
    } catch (err) {
      console.error('Admin tickets load error:', err);
      // Always fall back to mock data so the UI stays usable even if the API fails
      setTickets([
        {
          id: 'ticket-1',
          category: 'Technical Support',
          status: 'open',
          priority: 'high',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          message: 'Unable to upload property images',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'ticket-2',
          category: 'Account',
          status: 'in-progress',
          priority: 'medium',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          message: 'Need to update payment information',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ]);
      setError(err?.response?.data?.error || err.message || 'Failed to load tickets');
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
      const resp = await apiClient.put(`/support/admin/inquiries/${id}`, updates);
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
  const filteredTickets = useMemo(() => (
    tickets.filter(t =>
      (selectedPriority === 'all' || t.priority === selectedPriority) &&
      (selectedCategory === 'all' || t.category === selectedCategory)
    )
  ), [tickets, selectedPriority, selectedCategory]);

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
            <div key={ticket.id} className="bg-white p-4 rounded shadow border border-gray-100">
              <div className="flex flex-wrap justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-gray-400">Ticket</p>
                  <h3 className="font-semibold text-gray-900">{ticket.subject || `${ticket.category} request`}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{ticket.referenceCode || ticket.id}</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ticket.priority === 'critical'
                      ? 'bg-red-500/10 text-red-600'
                      : ticket.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : ticket.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'}`}>
                      {ticket.priority ? ticket.priority.toUpperCase() : 'MEDIUM'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ticket.status === 'resolved'
                      ? 'bg-green-100 text-green-700'
                      : ticket.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : ticket.status === 'closed'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-100 text-blue-700'}`}>
                      {ticket.status || 'open'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">{ticket.userName || 'Unknown user'}</p>
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-gray-400" />
                      <a className="text-brand-blue hover:underline" href={`mailto:${ticket.userEmail || ticket.contactEmail}`}>
                        {ticket.userEmail || ticket.contactEmail || 'No email'}
                      </a>
                    </div>
                    {ticket.contactPhone && (
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        <a className="text-brand-blue hover:underline" href={`tel:${ticket.contactPhone}`}>
                          {ticket.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      disabled={updating}
                      onClick={() => updateTicket(ticket.id, {
                        status: ticket.status === 'resolved' ? 'closed' : 'resolved',
                        isRead: true,
                        resolutionNotes: ticket.resolutionNotes || 'Marked resolved from quick action.'
                      })}
                      className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${ticket.status === 'resolved'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-green-600 text-white hover:bg-green-700'} disabled:opacity-60`}
                    >
                      <FaCheck />
                      {ticket.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                    </button>
                    <button
                      disabled={updating}
                      onClick={() => updateTicket(ticket.id, { isRead: !ticket.isRead })}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {ticket.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <select
                      value={ticket.status || 'open'}
                      onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                      disabled={updating}
                      className="w-full border border-gray-200 rounded-md text-sm px-2 py-2 text-gray-700"
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-1">Message</p>
                <p className="whitespace-pre-wrap">{ticket.message}</p>
                {ticket.resolutionNotes && (
                  <div className="mt-3 text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">Resolution Notes</p>
                    <p>{ticket.resolutionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupportTickets;
