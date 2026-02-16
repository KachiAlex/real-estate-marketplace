import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';
import { authenticatedFetch } from '../../utils/authToken';
import toast from 'react-hot-toast';

const CreateTicketModal = ({ onClose, onSuccess }) => {
  const { user, accessToken, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: ''
  });

  // Close modal if user becomes unauthenticated
  useEffect(() => {
    if (!user || !accessToken) {
      console.log('CreateTicketModal: User became unauthenticated, closing modal');
      onClose();
    }
  }, [user, accessToken, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('CreateTicketModal: handleSubmit called');
    console.log('CreateTicketModal: current user:', user);
    console.log('CreateTicketModal: current accessToken:', !!accessToken);

    // Prevent double submission
    if (isSubmitting) {
      console.log('CreateTicketModal: Already submitting, ignoring');
      return;
    }

    // Check authentication
    if (!user || !accessToken) {
      console.log('CreateTicketModal: User authentication check failed');
      toast.error('Please log in to submit a support ticket');
      onClose();
      return;
    }

    // Validate form
    if (!validateForm()) {
      console.log('CreateTicketModal: Form validation failed');
      return;
    }

    console.log('CreateTicketModal: Starting submit, user:', user?.uid || 'no user');
    console.log('CreateTicketModal: accessToken present:', !!accessToken);

    setIsSubmitting(true);

    try {
      const payload = {
        subject: formData.subject.trim(),
        category: formData.category,
        priority: formData.priority,
        message: formData.message.trim()
      };

      console.log('CreateTicketModal: Sending payload:', payload);

      const resp = await authenticatedFetch(getApiUrl('/support/inquiry'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('CreateTicketModal: Response status:', resp.status);

      if (resp.ok) {
        const data = await resp.json();
        console.log('CreateTicketModal: Success response:', data);
        toast.success(data.message || 'Support ticket submitted successfully!');
        setFormData({ subject: '', category: '', priority: 'medium', message: '' });
        onClose();
        if (onSuccess) onSuccess();
      } else if (resp.status === 401) {
        console.log('CreateTicketModal: Got 401, authentication issue');
        toast.error('Your session has expired. Please log in again to submit a support ticket.');
        // Don't immediately logout - let user try to login again
        onClose();
      } else {
        const err = await resp.json().catch(() => ({}));
        console.log('CreateTicketModal: Error response:', err);
        toast.error(err.error || `Failed to submit ticket (${resp.status})`);
      }
    } catch (error) {
      console.log('CreateTicketModal: Exception:', error);
      toast.error('Failed to submit support ticket. Please try again later.');
    } finally {
      console.log('CreateTicketModal: Setting submitting to false');
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'account', label: 'Account Issues' },
    { value: 'payment', label: 'Payment Problems' },
    { value: 'property', label: 'Property Listing' },
    { value: 'investment', label: 'Investment Questions' },
    { value: 'mortgage', label: 'Mortgage Application' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'verification', label: 'Account Verification' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Create Support Ticket</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Brief description of your issue"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Category and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                disabled={isSubmitting}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                disabled={isSubmitting}
              >
                {priorities.map(pri => (
                  <option key={pri.value} value={pri.value}>{pri.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-vertical"
              placeholder="Please provide detailed information about your issue..."
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
