import React from 'react';
import { FaTimes, FaMapMarkerAlt, FaEye, FaCheckCircle, FaInfoCircle, FaEdit, FaTrashAlt, FaShieldAlt, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import { formatCurrency } from '../../utils/currency';

const StatPill = ({ label, value }) => (
  <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs">
    <p className="text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-gray-900 font-semibold text-sm mt-1">{value}</p>
  </div>
);

const SectionCard = ({ title, children, icon: Icon = FaInfoCircle }) => (
  <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
    <div className="flex items-center gap-2 text-gray-900 font-semibold">
      <Icon className="text-brand-blue" />
      <h4>{title}</h4>
    </div>
    <div className="text-sm text-gray-700 space-y-4">{children}</div>
  </section>
);

const VendorPropertyDetailModal = ({
  property,
  isOpen,
  isLoading,
  onClose,
  onEdit,
  onDelete,
  onRequestVerification,
  onViewAsBuyer
}) => {
  if (!isOpen || !property) return null;

  const {
    title,
    description,
    price,
    status,
    type,
    location,
    images,
    videos,
    documentation,
    details,
    views,
    inquiries,
    verificationStatus,
    isVerified,
    createdAt,
    updatedAt
  } = property;

  const canRequestVerification = !isVerified && verificationStatus !== 'pending';
  const safeImages = Array.isArray(images) ? images : [];
  const safeVideos = Array.isArray(videos) ? videos : [];
  const safeDocs = Array.isArray(documentation) ? documentation : [];
  const locationText = location?.address || `${location?.city || ''} ${location?.state || ''}`.trim() || 'Location not specified';

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="relative bg-gray-50 max-w-6xl w-full max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="flex flex-col items-center gap-2 text-brand-blue">
              <FaSpinner className="animate-spin text-2xl" />
              <p className="text-sm font-medium">Loading latest details...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-gray-400 tracking-wide">Property overview</p>
            <h2 className="text-2xl font-bold text-gray-900">{title || 'Untitled Property'}</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <FaMapMarkerAlt className="text-brand-blue" />
              {locationText}
            </p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 transition"
            onClick={onClose}
          >
            <FaTimes size={18} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatPill label="Price" value={formatCurrency(price || 0)} />
            <StatPill label="Status" value={status || '—'} />
            <StatPill label="Type" value={type || '—'} />
            <StatPill label="Views" value={views ?? 0} />
            <StatPill label="Inquiries" value={inquiries ?? 0} />
            <StatPill label="Verification" value={isVerified ? 'Verified' : (verificationStatus || 'Not requested')} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onEdit?.(property)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <FaEdit /> Edit Listing
            </button>
            <button
              onClick={() => onDelete?.(property)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
            >
              <FaTrashAlt /> Delete
            </button>
            <button
              onClick={() => onViewAsBuyer?.(property)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <FaEye /> View as Buyer
            </button>
            {canRequestVerification ? (
              <button
                onClick={() => onRequestVerification?.(property)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                <FaShieldAlt /> Request Verification
              </button>
            ) : (
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isVerified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <FaCheckCircle />
                {isVerified ? 'Verified' : 'Verification Pending'}
              </span>
            )}
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SectionCard title="Property Story" icon={FaInfoCircle}>
                <p className="leading-relaxed whitespace-pre-line">{description || 'No description provided yet.'}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Created</p>
                    <p className="text-gray-900 font-medium">{createdAt ? new Date(createdAt).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Last Updated</p>
                    <p className="text-gray-900 font-medium">{updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Media" icon={FaEye}>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-2">Images</p>
                    {safeImages.length ? (
                      <div className="space-y-3">
                        <img
                          src={safeImages[0]}
                          alt="Primary"
                          className="w-full h-72 object-cover rounded-xl border"
                        />
                        {safeImages.length > 1 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {safeImages.slice(1).map((img, idx) => (
                              <img key={idx} src={img} alt={`Gallery ${idx}`} className="w-full h-28 object-cover rounded-lg border" />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No images uploaded yet.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-2">Videos</p>
                    {safeVideos.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {safeVideos.map((video, idx) => (
                          <video key={idx} controls className="w-full rounded-lg border">
                            <source src={video} />
                          </video>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No videos uploaded.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-2">Documents</p>
                    {safeDocs.length ? (
                      <div className="space-y-2">
                        {safeDocs.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url || doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-brand-blue hover:underline text-sm"
                          >
                            <FaExternalLinkAlt className="text-xs" /> {doc.name || `Document ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No supporting documents uploaded.</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard title="Location" icon={FaMapMarkerAlt}>
                <div className="space-y-2">
                  <p>{location?.address || '—'}</p>
                  <p>{location?.city}, {location?.state}</p>
                  {location?.zipCode && <p>Postal Code: {location.zipCode}</p>}
                  {location?.coordinates?.latitude && location?.coordinates?.longitude && (
                    <div className="text-xs text-gray-500">
                      Lat: {location.coordinates.latitude}, Lng: {location.coordinates.longitude}
                    </div>
                  )}
                  {location?.googleMapsUrl && (
                    <a
                      href={location.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-blue hover:underline text-sm"
                    >
                      Open in Google Maps <FaExternalLinkAlt className="text-xs" />
                    </a>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Property Details" icon={FaInfoCircle}>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  {details ? (
                    Object.entries(details).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-gray-600">
                        <dt className="capitalize text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</dt>
                        <dd className="font-medium text-gray-900">{value || '—'}</dd>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No additional details provided.</p>
                  )}
                </dl>
              </SectionCard>

              <SectionCard title="Verification Status" icon={FaShieldAlt}>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isVerified ? 'bg-green-100 text-green-800' : verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {isVerified ? 'Verified' : (verificationStatus || 'Not Requested')}
                    </span>
                  </div>
                  {verificationStatus === 'pending' && (
                    <p className="text-yellow-700 text-xs">
                      Admin team is reviewing this property. You will be notified once a decision is made.
                    </p>
                  )}
                  {canRequestVerification && (
                    <button
                      onClick={() => onRequestVerification?.(property)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                      <FaShieldAlt /> Request Verification
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPropertyDetailModal;
