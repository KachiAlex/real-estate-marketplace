import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import apiClient from '../../services/apiClient';

const CreateTicketModal = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: '', category: '', priority: 'medium', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!form.subject || !form.category || !form.message) {
      toast.error('Please complete subject, category and message');
      return;
    }

    if (!currentUser || !currentUser.id) {
      toast.error('Please log in to submit a support ticket');
      // Do not redirect to login modal after submission attempt
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: form.subject,
        message: form.message,
        category: form.category,
        priority: form.priority
      };

      const resp = await apiClient.post('/support/inquiry', payload);

      if (resp?.data?.success) {
        toast.success(resp.data?.message || 'Support ticket submitted. We will respond by email.');
        setForm({ subject: '', category: '', priority: 'medium', message: '' });
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else if (resp?.status === 401 || resp?.data?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        const err = resp?.data || {};
        toast.error(err.error || `Failed to submit ticket`);
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      toast.error('Failed to submit support ticket. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose()} />
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Support Ticket</h3>
          <button onClick={() => onClose && onClose()} className="text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select a category</option>
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing & Payments</option>
                <option value="investment">Investment</option>
                <option value="mortgage">Mortgage</option>
                <option value="property">Property Related</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="flex items-center space-x-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
            <button type="button" onClick={() => onClose && onClose()} className="btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
