import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext-new';
import toast from 'react-hot-toast';

const BecomeVendorModal = ({ isOpen, onClose }) => {
  const { addRole } = useAuth();
  const [loading, setLoading] = useState(false);

  const startOnboarding = async () => {
    try {
      setLoading(true);
      // Add vendor role but do not switch active role automatically
      const updated = await addRole('vendor', false);
      toast.success('Vendor role requested — KYC pending');
      // Optionally redirect to vendor onboarding/profile page
      if (onClose) onClose();
      setLoading(false);
      return updated;
    } catch (e) {
      toast.error(e.message || 'Failed to request vendor role');
      setLoading(false);
      throw e;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Become a vendor">
      <div className="space-y-4">
        <p>Becoming a vendor lets you list properties, respond to buyers, and receive payments. We'll ask for KYC documents next.</p>
        <div className="flex gap-2">
          <button onClick={startOnboarding} disabled={loading} className="btn btn-primary">{loading ? 'Requesting…' : 'Request vendor role'}</button>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

export default BecomeVendorModal;
