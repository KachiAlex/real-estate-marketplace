import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaSyncAlt } from 'react-icons/fa';

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
      const resp = await authenticatedFetch(getApiUrl('/admin/support/inquiries'));
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Failed to load (${resp.status})`);
      }
      const data = await resp.json();
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
      const resp = await authenticatedFetch(getApiUrl(`/admin/support/inquiries/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Update failed (${resp.status})`);
      }
      const data = await resp.json();
      toast.success(data.message || 'Ticket updated');
      // update local copy
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
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';
import toast from 'react-hot-toast';

const AdminSupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(getApiUrl('/support/admin/inquiries'));
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.error('AdminSupportTickets load error', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const updateTicket = async (id, updates) => {
    try {
      const res = await authenticatedFetch(getApiUrl(`/support/admin/inquiries/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const json = await res.json();
      toast.success(json.message || 'Ticket updated');
      load();
      setSelected(null);
    } catch (err) {
      console.error('Update ticket error', err);
      toast.error(err.message || 'Failed to update ticket');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Admin Support Tickets</h2>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Support Tickets (Admin)</h2>
        <div>
          <button className="btn" onClick={load}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <p>Loading tickets...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {tickets.map(t => (
              <div key={t.id} className={`p-3 border rounded-lg cursor-pointer ${selected?.id === t.id ? 'bg-gray-50' : ''}`} onClick={() => setSelected(t)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{t.category}</div>
                    <div className="text-sm text-gray-600">{t.userEmail}</div>
                  </div>
                  <div className="text-sm text-gray-500">{t.status}</div>
                </div>
                <p className="text-sm text-gray-800 mt-2 truncate">{t.message}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selected.category} — {selected.status}</h3>
                    <div className="text-sm text-gray-600">{selected.userEmail} • {new Date(selected.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 border rounded" onClick={() => updateTicket(selected.id, { isRead: true })}>Mark Read</button>
                    <button className="px-3 py-1 border rounded" onClick={() => updateTicket(selected.id, { isRead: false })}>Mark Unread</button>
                    <select value={selected.status} onChange={(e) => updateTicket(selected.id, { status: e.target.value })} className="px-2 py-1 border rounded">
                      <option value="new">new</option>
                      <option value="pending">pending</option>
                      <option value="resolved">resolved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-gray-800">{selected.message}</div>
              </div>
            ) : (
              <div className="border p-6 rounded-lg text-gray-600">Select a ticket to view details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportTickets;
