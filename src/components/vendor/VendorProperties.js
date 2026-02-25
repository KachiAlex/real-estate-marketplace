import React from 'react';

export default function VendorProperties({ properties, loading, onAdd, onEdit, onDelete, onView, onBulkAction, onSearch, onFilter, page, pageCount, onPageChange }) {
  // Example properties prop: [{ id, title, status, price, views, inquiries, lastUpdated, thumbnailUrl }]
  return (
    <div className="space-y-6">
      {/* Top Bar: Add, Search, Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <button
          className="bg-brand-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={onAdd}
        >
          + Add Property
        </button>
        <div className="flex gap-2 flex-1 md:justify-end">
          <input
            type="text"
            placeholder="Search properties..."
            className="border rounded px-3 py-2 text-sm"
            onChange={e => onSearch?.(e.target.value)}
          />
          <select className="border rounded px-2 py-2 text-sm" onChange={e => onFilter?.(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table/Grid of Properties */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-center">Views</th>
              <th className="p-3 text-center">Inquiries</th>
              <th className="p-3 text-center">Last Updated</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : properties?.length ? (
              properties.map((prop) => (
                <tr key={prop.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 flex items-center gap-2">
                    {prop.thumbnailUrl && <img src={prop.thumbnailUrl} alt="thumb" className="w-10 h-10 rounded object-cover" />}
                    <span className="font-medium text-brand-blue cursor-pointer" onClick={() => onView?.(prop)}>{prop.title}</span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={prop.status} />
                  </td>
                  <td className="p-3 text-right">₦{prop.price?.toLocaleString()}</td>
                  <td className="p-3 text-center">{prop.views ?? 0}</td>
                  <td className="p-3 text-center">{prop.inquiries ?? 0}</td>
                  <td className="p-3 text-center">{prop.lastUpdated ? new Date(prop.lastUpdated).toLocaleDateString() : '-'}</td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 hover:underline mr-2" onClick={() => onEdit?.(prop)}>Edit</button>
                    <button className="text-gray-600 hover:underline mr-2" onClick={() => onView?.(prop)}>View</button>
                    <button className="text-red-600 hover:underline" onClick={() => onDelete?.(prop)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No properties found</td></tr>
            )}
          </tbody>
        </table>
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

function StatusBadge({ status }) {
  const color =
    status === 'active' ? 'green' :
    status === 'pending' ? 'yellow' :
    status === 'sold' ? 'gray' :
    status === 'draft' ? 'blue' : 'gray';
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs bg-${color}-100 text-${color}-800 font-semibold`}>
      {label || 'Unknown'}
    </span>
  );
}
