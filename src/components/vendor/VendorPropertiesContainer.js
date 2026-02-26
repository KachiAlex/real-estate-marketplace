import React, { useEffect, useState, useCallback } from 'react';
import VendorProperties from './VendorProperties';
import { useAuth } from '../../contexts/AuthContext-new';
// import PropertyModal from './PropertyModal'; // For add/edit (optional)

// Replace with your actual API call logic
async function fetchVendorProperties({ page, search, filter, ownerId }) {
  // GET /api/properties?page=1&search=...&status=...&ownerId=...
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (search) params.append('search', search);
  if (filter) params.append('status', filter);
  if (ownerId) params.append('ownerId', ownerId);
  const res = await fetch(`/api/properties?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export default function VendorPropertiesContainer() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  // const [modalOpen, setModalOpen] = useState(false);
  // const [editingProperty, setEditingProperty] = useState(null);
  const { currentUser } = useAuth();
  // Use authenticated user's id as vendor id when available
  const vendorId = currentUser?.id || null;

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVendorProperties({ page, search, filter, ownerId: vendorId });
      setProperties(data.data || []); // backend returns {data: properties}
      setPageCount(data.pagination?.totalPages || 1);
    } catch (e) {
      setProperties([]);
      setPageCount(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter, vendorId]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return (
    <VendorProperties
      properties={properties}
      loading={loading}
      page={page}
      pageCount={pageCount}
      onAdd={() => {/* setModalOpen(true); setEditingProperty(null); */}}
      onEdit={prop => {/* setModalOpen(true); setEditingProperty(prop); */}}
      onDelete={prop => {/* handle delete logic */}}
      onView={prop => {/* navigate to detail or open modal */}}
      onSearch={setSearch}
      onFilter={setFilter}
      onPageChange={setPage}
    />
    // <PropertyModal open={modalOpen} property={editingProperty} ... />
  );
}
