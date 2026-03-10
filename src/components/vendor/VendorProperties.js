import React from 'react';
import { formatCurrency } from '../../utils/currency';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-purple-100 text-purple-800',
  draft: 'bg-gray-100 text-gray-600'
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560185008-5d865753c2d0?auto=format&fit=crop&w=800&q=80';

const getPropertyImage = (property = {}) => {
  if (property.thumbnailUrl) return property.thumbnailUrl;
  if (property.coverImage) return property.coverImage;
  if (property.image) return property.image;

  const firstImage = property.images?.[0] || property.gallery?.[0];
  if (typeof firstImage === 'string') return firstImage;
  if (firstImage?.url) return firstImage.url;
  if (firstImage?.src) return firstImage.src;

  return FALLBACK_IMAGE;
};

const StatusBadge = ({ status }) => {
  if (!status) {
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Unknown</span>;
  }
  const normalized = status.toLowerCase();
  const style = STATUS_COLORS[normalized] || 'bg-blue-100 text-blue-800';
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const VerificationBadge = ({ property }) => {
  if (!property) return null;

  const normalizedVerificationStatus = property.verificationStatus?.toLowerCase?.();
  const normalizedApplicationStatus = property.latestVerificationApplicationStatus?.toLowerCase?.();
  const normalizedIsVerified = property.isVerified || normalizedVerificationStatus === 'verified' || normalizedApplicationStatus === 'approved';

  if (normalizedIsVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span>✓</span> Verified
      </span>
    );
  }

  if (normalizedApplicationStatus === 'pending' || normalizedVerificationStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span>⏳</span> Application Sent
      </span>
    );
  }

  if (normalizedApplicationStatus === 'rejected' || normalizedVerificationStatus === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <span>✗</span> Verification Rejected
      </span>
    );
  }

  return null;
};

const STAT_CARDS = [
  { key: 'total', label: 'Total Listings' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'sold', label: 'Sold' },
  { key: 'draft', label: 'Drafts' },
  { key: 'avgViews', label: 'Avg. Views' },
  { key: 'avgInquiries', label: 'Avg. Inquiries' }
];

export default function VendorProperties({
  properties,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onSearch,
  onFilter,
  page,
  pageCount,
  onPageChange,
  stats,
  searchValue,
  filterValue,
  onRequestVerification
}) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">{card.label}</p>
            <p className="text-lg font-semibold text-gray-900">{stats?.[card.key] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Top Bar: Add, Search, Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <button
            className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={onAdd}
          >
            + Add Property
          </button>
          <p className="text-gray-500 text-sm hidden md:block">Create or import a new listing</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            value={searchValue}
            placeholder="Search properties..."
            className="border rounded-lg px-3 py-2 text-sm w-full md:w-56 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            onChange={e => onSearch?.(e.target.value)}
          />
          <select
            className="border rounded-lg px-2 py-2 text-sm w-full md:w-40 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            onChange={e => onFilter?.(e.target.value)}
            value={filterValue}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Card Grid */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : properties?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((prop) => {
              const imageUrl = getPropertyImage(prop);
              const locationLabel =
                prop.location?.address ||
                prop.location?.city ||
                prop.city ||
                prop.state ||
                'Location not specified';
              const lastUpdatedLabel = prop.lastUpdated ? new Date(prop.lastUpdated).toLocaleDateString() : '—';
              const normalizedApplicationStatus = prop.latestVerificationApplicationStatus?.toLowerCase?.();
              const normalizedVerificationStatus = prop.verificationStatus?.toLowerCase?.();
              const canRequestVerification = !prop.isVerified && normalizedVerificationStatus !== 'pending' && normalizedApplicationStatus !== 'pending';

              return (
                <div key={prop.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={prop.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        if (e.target.dataset.fallback === 'true') return;
                        e.target.dataset.fallback = 'true';
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <StatusBadge status={prop.status} />
                    </div>
                    <div className="absolute top-4 right-4">
                      <VerificationBadge property={prop} />
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button className="text-left" onClick={() => onView?.(prop)}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-brand-blue transition-colors">
                            {prop.title}
                          </h3>
                        </button>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{locationLabel}</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900 price-inline whitespace-nowrap">
                        {formatCurrency(prop.price || 0)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-400">Views</p>
                        <p className="font-semibold text-gray-900">{prop.views ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-400">Inquiries</p>
                        <p className="font-semibold text-gray-900">{prop.inquiries ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-400">Updated</p>
                        <p className="font-semibold text-gray-900">{lastUpdatedLabel}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {canRequestVerification && (
                        <button
                          className="w-full text-sm px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          onClick={() => onRequestVerification?.(prop)}
                        >
                          Request Verification
                        </button>
                      )}
                      <div className="flex flex-wrap justify-end gap-2 text-sm mt-auto">
                        <button
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={() => onEdit?.(prop)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={() => onView?.(prop)}
                        >
                          View
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => onDelete?.(prop)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-4">You haven’t added any properties yet.</p>
            <button
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={onAdd}
            >
              + Add your first property
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-end gap-2 mt-2">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => onPageChange?.(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
