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
