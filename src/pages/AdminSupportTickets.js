import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaSyncAlt, FaEye, FaEyeSlash, FaFilter } from 'react-icons/fa';

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState(new Set());

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
      toast.success(data.message || 'Ticket updated successfully');

      // Update local state
      setTickets(prev => prev.map(ticket =>
        ticket.id === id ? { ...ticket, ...updates } : ticket
      ));
    } catch (err) {
      console.error('Update ticket error:', err);
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const toggleExpanded = (ticketId) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = selectedStatus === 'all' || ticket.status === selectedStatus;
    const categoryMatch = selectedCategory === 'all' || ticket.category === selectedCategory;
    return statusMatch && categoryMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'account', label: 'Account Issues' },
    { value: 'payment', label: 'Payment Problems' },
    { value: 'property', label: 'Property Listing' },
    { value: 'investment', label: 'Investment Questions' },
    { value: 'mortgage', label: 'Mortgage Application' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'verification', label: 'Account Verification' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin — Support Tickets</h1>
        <button
          className="btn flex items-center space-x-2"
          onClick={loadTickets}
          disabled={loading}
        >
          <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <FaFilter className="text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Support Tickets ({filteredTickets.length})</h2>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadTickets}
                className="mt-2 btn-secondary"
              >
                Try Again
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>User:</strong> {ticket.userName} ({ticket.userEmail})</p>
                        <p><strong>Category:</strong> {ticket.category}</p>
                        <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
                        {ticket.updatedAt !== ticket.createdAt && (
                          <p><strong>Updated:</strong> {new Date(ticket.updatedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleExpanded(ticket.id)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title={expandedTickets.has(ticket.id) ? 'Collapse' : 'Expand'}
                      >
                        {expandedTickets.has(ticket.id) ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {expandedTickets.has(ticket.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded p-3 mb-4">
                        <h4 className="font-medium mb-2">Message:</h4>
                        <p className="text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={ticket.status}
                            onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                            disabled={updating}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          >
                            <option value="new">New</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={ticket.isRead || false}
                              onChange={(e) => updateTicket(ticket.id, { isRead: e.target.checked })}
                              disabled={updating}
                              className="rounded"
                            />
                            <span>Mark as Read</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportTickets;