import React from 'react';
import { formatCurrency } from '../../utils/currency';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-purple-100 text-purple-800',
  draft: 'bg-gray-100 text-gray-600'
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

const VerificationBadge = ({ verificationStatus, isVerified, onRequestVerification }) => {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span>✓</span> Verified
      </span>
    );
  }
  
  if (verificationStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span>⏳</span> Pending Verification
      </span>
    );
  }

  if (verificationStatus === 'rejected') {
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

      {/* Table/Grid of Properties */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Verification</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-center">Views</th>
              <th className="p-3 text-center">Inquiries</th>
              <th className="p-3 text-center">Last Updated</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : properties?.length ? (
              properties.map((prop) => (
                <tr key={prop.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 flex items-center gap-3">
                    {prop.thumbnailUrl && <img src={prop.thumbnailUrl} alt="thumb" className="w-12 h-12 rounded object-cover" />}
                    <span className="font-medium text-brand-blue cursor-pointer" onClick={() => onView?.(prop)}>{prop.title}</span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={prop.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <VerificationBadge verificationStatus={prop.verificationStatus} isVerified={prop.isVerified} />
                      {!prop.isVerified && prop.verificationStatus !== 'pending' && (
                        <button 
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          onClick={() => onRequestVerification?.(prop)}
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right price-inline">{formatCurrency(prop.price || 0)}</td>
                  <td className="p-3 text-center">{prop.views ?? 0}</td>
                  <td className="p-3 text-center">{prop.inquiries ?? 0}</td>
                  <td className="p-3 text-center">{prop.lastUpdated ? new Date(prop.lastUpdated).toLocaleDateString() : '-'}</td>
                  <td className="p-3 text-center space-x-3">
                    <button className="text-blue-600 hover:underline" onClick={() => onEdit?.(prop)}>Edit</button>
                    <button className="text-gray-600 hover:underline" onClick={() => onView?.(prop)}>View</button>
                    <button className="text-red-600 hover:underline" onClick={() => onDelete?.(prop)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No properties found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-gray-400">Loading...</div>
        ) : properties?.length ? (
          properties.map((prop) => (
            <div key={prop.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {prop.thumbnailUrl && <img src={prop.thumbnailUrl} alt="thumb" className="w-16 h-16 rounded object-cover" />}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{prop.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={prop.status} />
                    <VerificationBadge verificationStatus={prop.verificationStatus} isVerified={prop.isVerified} />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <p className="text-gray-400 text-xs uppercase">Price</p>
                  <p className="font-medium text-gray-900 price-inline">{formatCurrency(prop.price || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Last Updated</p>
                  <p>{prop.lastUpdated ? new Date(prop.lastUpdated).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Views</p>
                  <p>{prop.views ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Inquiries</p>
                  <p>{prop.inquiries ?? 0}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {!prop.isVerified && prop.verificationStatus !== 'pending' && (
                  <button 
                    className="w-full text-sm px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    onClick={() => onRequestVerification?.(prop)}
                  >
                    Request Verification
                  </button>
                )}
                <div className="flex justify-end gap-3 text-sm">
                  <button className="text-blue-600" onClick={() => onEdit?.(prop)}>Edit</button>
                  <button className="text-gray-600" onClick={() => onView?.(prop)}>View</button>
                  <button className="text-red-600" onClick={() => onDelete?.(prop)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-gray-400">No properties found</div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-end gap-2 mt-4">
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
