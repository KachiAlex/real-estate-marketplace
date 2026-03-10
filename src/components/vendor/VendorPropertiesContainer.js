import React, { useEffect, useState, useCallback, useMemo } from 'react';
import VendorProperties from './VendorProperties';
import VerificationRequestModal from '../VerificationRequestModal';
import VendorPropertyDetailModal from './VendorPropertyDetailModal';
import { useAuth } from '../../contexts/AuthContext-new';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
// import PropertyModal from './PropertyModal'; // For add/edit (optional)

// Replace with your actual API call logic
async function fetchVendorProperties({ page, search, filter, ownerId }) {
  // GET /api/properties?page=1&search=...&status=...&ownerId=...
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (search) params.append('search', search);
  if (filter) params.append('status', filter);
  if (ownerId) params.append('ownerId', ownerId);
  const response = await apiClient.get(`/properties?${params.toString()}`);
  return response.data;
}

export default function VendorPropertiesContainer() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedPropertyForVerification, setSelectedPropertyForVerification] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [verificationApplications, setVerificationApplications] = useState([]);
  // const [modalOpen, setModalOpen] = useState(false);
  // const [editingProperty, setEditingProperty] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  // Use authenticated user's id as vendor id when available
  const vendorId = currentUser?.id || null;

  const normalizePropertyForModal = useCallback((prop) => {
    if (!prop) return null;

    let location = prop.location;

    if (typeof location === 'string') {
      location = { address: location };
    }

    if (!location && (prop.address || prop.city || prop.state)) {
      location = {
        address: prop.address || '',
        city: prop.city || '',
        state: prop.state || ''
      };
    }

    return {
      ...prop,
      location
    };
  }, []);

  const fetchPropertyDetail = useCallback(async (propertyId) => {
    if (!propertyId) return;
    setDetailLoading(true);
    try {
      const response = await apiClient.get(`/properties/${propertyId}`);
      const data = response.data?.data || response.data?.property || response.data;
      if (data) {
        const application = verificationApplicationByPropertyId[propertyId];
        const merged = {
          ...data,
          latestVerificationApplicationStatus: application?.status || data.latestVerificationApplicationStatus || null,
          latestVerificationApplication: application?.raw || data.latestVerificationApplication || null
        };
        setSelectedPropertyDetail(normalizePropertyForModal(merged));
      }
    } catch (error) {
      console.error('Failed to fetch property detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, [normalizePropertyForModal, verificationApplicationByPropertyId]);

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

  const fetchVerificationApplications = useCallback(async () => {
    if (!vendorId) {
      setVerificationApplications([]);
      return;
    }

    try {
      const response = await apiClient.get('/verification/applications/mine');
      const data = response.data?.data || response.data || [];
      setVerificationApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load verification applications:', error);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVerificationApplications();
  }, [fetchVerificationApplications]);

  const derivedStats = useMemo(() => {
    if (!properties?.length) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        sold: 0,
        draft: 0,
        avgViews: 0,
        avgInquiries: 0
      };
    }

    const counts = {
      total: properties.length,
      active: 0,
      pending: 0,
      sold: 0,
      draft: 0
    };

    let viewSum = 0;
    let inquirySum = 0;

    properties.forEach((prop) => {
      const status = (prop.status || '').toLowerCase();
      if (counts[status] !== undefined) counts[status] += 1;
      viewSum += Number(prop.views) || 0;
      inquirySum += Number(prop.inquiries) || 0;
    });

    return {
      ...counts,
      avgViews: Math.round(viewSum / properties.length) || 0,
      avgInquiries: Math.round(inquirySum / properties.length) || 0
    };
  }, [properties]);

  const verificationApplicationByPropertyId = useMemo(() => {
    return verificationApplications.reduce((acc, application) => {
      const propertyId = application.propertyId;
      if (!propertyId) return acc;

      const existing = acc[propertyId];
      const applicationCreatedAt = application.createdAt ? new Date(application.createdAt).getTime() : 0;
      if (!existing || applicationCreatedAt > existing.createdAtValue) {
        acc[propertyId] = {
          status: application.status || null,
          createdAtValue: applicationCreatedAt,
          raw: application
        };
      }
      return acc;
    }, {});
  }, [verificationApplications]);

  const propertiesWithVerification = useMemo(() => {
    if (!properties?.length) return [];

    return properties.map((prop) => {
      const match = prop.id ? verificationApplicationByPropertyId[prop.id] : null;
      return {
        ...prop,
        latestVerificationApplicationStatus: match?.status || null,
        latestVerificationApplication: match?.raw || null
      };
    });
  }, [properties, verificationApplicationByPropertyId]);

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedPropertyDetail(null);
    setDetailLoading(false);
  }, []);

  const handleAddProperty = () => {
    handleCloseDetailModal();
    navigate('/add-property');
  };

  const handleEditProperty = (prop) => {
    if (!prop) return;
    handleCloseDetailModal();
    navigate(`/edit-property/${prop.id}`, { state: { property: prop } });
  };

  const handleViewProperty = (prop) => {
    if (!prop) return;
    setDetailModalOpen(true);
    setSelectedPropertyDetail(normalizePropertyForModal(prop));
    if (prop.id) {
      fetchPropertyDetail(prop.id);
    }
  };

  const handleViewAsBuyer = (prop) => {
    if (!prop?.id) return;
    handleCloseDetailModal();
    navigate(`/property/${prop.id}`);
  };

  const handleDeleteProperty = async (prop) => {
    if (!window.confirm(`Are you sure you want to delete "${prop.title}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await apiClient.delete(`/properties/${prop.id}`);
      // Reload properties after deletion
      await loadProperties();
      if (selectedPropertyDetail?.id === prop.id) {
        handleCloseDetailModal();
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = (prop) => {
    if (!prop) return;
    setSelectedPropertyForVerification(prop);
    setVerificationModalOpen(true);
    handleCloseDetailModal();
  };

  const handleVerificationSuccess = () => {
    // Reload properties to reflect verification status changes
    loadProperties();
    fetchVerificationApplications();
    if (selectedPropertyDetail?.id) {
      fetchPropertyDetail(selectedPropertyDetail.id);
    }
  };

  return (
    <>
      <VendorProperties
        properties={propertiesWithVerification}
        loading={loading}
        page={page}
        pageCount={pageCount}
        onAdd={handleAddProperty}
        onEdit={handleEditProperty}
        onDelete={handleDeleteProperty}
        onView={handleViewProperty}
        onSearch={setSearch}
        searchValue={search}
        onFilter={setFilter}
        filterValue={filter}
        onPageChange={setPage}
        stats={derivedStats}
        onRequestVerification={handleRequestVerification}
      />
      <VerificationRequestModal
        property={selectedPropertyForVerification}
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setSelectedPropertyForVerification(null);
        }}
        onSuccess={handleVerificationSuccess}
      />
      <VendorPropertyDetailModal
        property={selectedPropertyDetail}
        isOpen={detailModalOpen}
        isLoading={detailLoading}
        onClose={handleCloseDetailModal}
        onEdit={handleEditProperty}
        onDelete={handleDeleteProperty}
        onRequestVerification={handleRequestVerification}
        onViewAsBuyer={handleViewAsBuyer}
      />
    </>
  );
}
