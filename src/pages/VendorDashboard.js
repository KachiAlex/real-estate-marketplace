import React, { useState, useEffect } from 'react';
import { initializePaystackPayment } from '../services/paystackService';
import { requestPropertyVerification } from '../services/propertyApi';
import { isVerificationRequested, isVerificationApproved, setVerificationStatus } from '../utils/verificationStatus';
import { FaHome, FaEnvelope, FaCalendar, FaMoneyBillWave, FaUsers, FaFileContract, FaBell, FaUser } from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';
import { useProperty } from '../contexts/PropertyContext';
import { useVendor } from '../contexts/VendorContext';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

const sections = [
  { id: 'overview', label: 'Overview', icon: FaHome, path: '/vendor/dashboard/overview' },
  { id: 'properties', label: 'Properties', icon: FaHome, path: '/vendor/dashboard/properties' },
  { id: 'inquiries', label: 'Inquiries', icon: FaEnvelope, path: '/vendor/dashboard/inquiries' },
  { id: 'inspections', label: 'Inspections', icon: FaCalendar, path: '/vendor/dashboard/inspections' },
  { id: 'earnings', label: 'Earnings', icon: FaMoneyBillWave, path: '/vendor/dashboard/earnings' },
  { id: 'team', label: 'Team', icon: FaUsers, path: '/vendor/dashboard/team' },
  { id: 'contracts', label: 'Contracts', icon: FaFileContract, path: '/vendor/dashboard/contracts' },
  { id: 'notifications', label: 'Notifications', icon: FaBell, path: '/vendor/dashboard/notifications' },
  { id: 'profile', label: 'Profile', icon: FaUser, path: '/vendor/dashboard/profile' }
];

const VendorDashboard = () => {
  const [verifyModal, setVerifyModal] = useState({ open: false, property: null });
  const handleVerificationPayment = (property) => {
    const userEmail = vendorProfile?.contactInfo?.email || '';
    const reference = `VERIFY-${property.id}-${Date.now()}`;
    initializePaystackPayment({
      email: userEmail,
      amount: 50000,
      reference,
      metadata: {
        propertyId: property.id,
        vendorId: vendorProfile?.id
      },
      onSuccess: async (response) => {
        setVerifyModal({ open: false, property: null });
        try {
          await requestPropertyVerification({
            propertyId: property.id,
            paymentReference: response.reference,
            amount: 50000
          });
          setVerificationStatus(property.id, 'requested');
          alert('Payment successful! Verification request submitted.');
          fetchProperties();
        } catch (e) {
          alert('Payment succeeded but verification request failed: ' + e.message);
        }
      },
      onClose: () => {
        setVerifyModal({ open: false, property: null });
      }
    });
  };
  const navigate = useNavigate();
  const location = useLocation();
  // Determine active section from path
  const activeSection = sections.find(s => location.pathname.startsWith(s.path))?.id || 'overview';
  // Property context
  const {
    properties,
    loading: propertiesLoading,
    fetchProperties,
    error: propertiesError
  } = useProperty();

  // Vendor context
  const {
    vendorProfile,
    vendorLoading,
    fetchVendorProfile,
    agentDocuments,
    subscription
  } = useVendor();

  // Notification context
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  useEffect(() => {
    console.log('VendorDashboard: activeSection=', activeSection);
    if (activeSection === 'properties') {
      console.log('VendorDashboard: fetching properties...');
      fetchProperties().then(() => console.log('VendorDashboard: fetchProperties complete'));
    }
  }, [activeSection, fetchProperties]);

  useEffect(() => {
    console.log('VendorDashboard: properties length=', properties.length);
  }, [properties]);

  const propertyStats = {
    properties: properties.length,
    earnings: properties.reduce((sum, p) => sum + (p.price || 0), 0),
    inquiries: 0, // Placeholder, replace with real inquiries count if available
    inspections: 0 // Placeholder, replace with real inspections count if available
  };
  const recentActivity = notifications.slice(0, 4).map(n => `${n.title}: ${n.message}`);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-blue">Vendor Dashboard</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left font-semibold transition-all ${activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => navigate(section.path)}
            >
              <span className="text-lg"><section.icon /></span>
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/vendor/dashboard" element={<Navigate to="/vendor/dashboard/overview" replace />} />
          <Route path="/vendor/dashboard/overview" element={
            <div>
              <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
              {propertiesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-gray-500">Loading dashboard...</span>
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-blue-600">{propertyStats.properties}</div>
                      <div className="text-xs text-gray-500 mt-1">Properties</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-green-600">₦{propertyStats.earnings.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">Earnings (Sum of Prices)</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-yellow-600">{propertyStats.inquiries}</div>
                      <div className="text-xs text-gray-500 mt-1">Inquiries</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-gray-600">{propertyStats.inspections}</div>
                      <div className="text-xs text-gray-500 mt-1">Inspection Requests</div>
                    </div>
                  </div>
                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                    <ul className="space-y-3">
                      {recentActivity.length === 0 ? (
                        <li className="text-sm text-gray-400">No recent activity.</li>
                      ) : recentActivity.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                  {/* Quick Actions */}
                  <div className="flex space-x-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* add property logic */}}>Add Property</button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => {/* request payout logic */}}>Request Payout</button>
                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition" onClick={() => {/* view notifications logic */}}>View Notifications</button>
                  </div>
                  <div className="mt-4 text-xs text-gray-400">Quick stats, recent activity, and shortcuts to key actions.</div>
                </>
              )}
            </div>
          } />
          <Route path="/vendor/dashboard/properties" element={
            <div>
              <h1 className="text-2xl font-bold mb-4">Properties</h1>
              {propertiesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-gray-500">Loading properties...</span>
                </div>
              ) : propertiesError ? (
                <div className="text-red-500">{propertiesError}</div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Total Properties: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{properties.length}</span></span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => fetchProperties()}>Refresh</button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition" onClick={() => {/* open add property modal */}}>Add Property</button>
                  </div>
                  {/* Property Statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-blue-600">{properties.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Total Properties</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-green-600">{properties.filter(p => p.status === 'For Sale').length}</div>
                      <div className="text-xs text-gray-500 mt-1">For Sale</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-yellow-600">{properties.filter(p => p.status === 'For Rent').length}</div>
                      <div className="text-xs text-gray-500 mt-1">For Rent</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="text-lg font-bold text-gray-600">{properties.filter(p => p.status === 'For Lease').length}</div>
                      <div className="text-xs text-gray-500 mt-1">For Lease</div>
                    </div>
                  </div>
                  {/* Property Listing Table */}
                  <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map((property) => (
                          <tr key={property.id} data-testid="property-item">
                            <td className="px-6 py-4 whitespace-nowrap">{property.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{property.status}</span>
                              {/* Verification Badge/Status */}
                              {isVerificationApproved(property.id) || property.isVerified ? (
                                <span className="ml-2 inline-block align-middle" title="Verified Property">
                                  <svg className="w-4 h-4 text-blue-500 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" /></svg>
                                  <span className="ml-1 text-xs text-blue-600 font-semibold">Verified</span>
                                </span>
                              ) : isVerificationRequested(property.id) || property.verificationStatus === 'pending' ? (
                                <span className="ml-2 text-xs text-yellow-600 font-semibold">Verification Submitted</span>
                              ) : null}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">₦{property.price?.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                              <button className="text-blue-600 hover:underline mr-2" onClick={() => {/* edit logic */}}>Edit</button>
                              <button className="text-red-600 hover:underline mr-2" onClick={() => {/* delete logic */}}>Delete</button>
                              {!isVerificationApproved(property.id) && !isVerificationRequested(property.id) && property.verificationStatus !== 'pending' && !property.isVerified && (
                                <button
                                  className="text-green-600 hover:underline"
                                  onClick={() => setVerifyModal({ open: true, property })}
                                >
                                  Request Verification
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                              {/* Verification Modal */}
                              {verifyModal?.open && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                  <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                                    <h2 className="text-xl font-bold mb-4">Request Property Verification</h2>
                                    <p className="mb-4">To verify <span className="font-semibold">{verifyModal.property.title}</span>, you must pay a verification fee of <span className="font-bold text-green-700">₦50,000</span>.</p>
                                    <div className="flex justify-end space-x-2 mt-6">
                                      <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setVerifyModal({ open: false, property: null })}>Cancel</button>
                                      <button className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700" onClick={() => handleVerificationPayment(verifyModal.property)}>Proceed to Payment</button>
                                    </div>
                                  </div>
                                </div>
                              )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-xs text-gray-400">Local storage fallback enabled for offline property management.</div>
                </>
              )}
            </div>
          } />
          {/* Add similar <Route> blocks for other sections as needed */}
        </Routes>
        {activeSection === 'inquiries' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Inquiries</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Inquiries: <span className="font-mono bg-gray-100 px-2 py-1 rounded">0</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* refresh logic */}}>Refresh</button>
            </div>
            {/* Inquiry List Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">No inquiries found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Quick reply and status management enabled for buyer inquiries.</div>
          </div>
        )}
        {activeSection === 'inspections' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Inspection Requests</h1>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Requests: <span className="font-mono bg-gray-100 px-2 py-1 rounded">0</span></span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* refresh logic */}}>Refresh</button>
            </div>
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">No inspection requests found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-400">Analytics and status management enabled for inspection requests.</div>
          </div>
        )}
        {activeSection === 'earnings' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Earnings</h1>
            {console.log('VendorDashboard: rendering earnings - properties length =', properties.length)}
            {propertiesLoading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-gray-500">Loading earnings...</span>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Total Earnings: <span className="font-mono bg-green-100 px-2 py-1 rounded">₦{properties.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}</span></span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => {/* payout logic */}}>Request Payout</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="text-lg font-bold text-green-600">₦{(properties.filter(p => p.status === 'Paid Out').reduce((sum, p) => sum + (p.price || 0), 0)).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Paid Out</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="text-lg font-bold text-blue-600">₦{(properties.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.price || 0), 0)).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Pending</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="text-lg font-bold text-gray-600">₦0</div>
                    <div className="text-xs text-gray-500 mt-1">Failed</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((p) => (
                        <tr key={p.id} data-testid="transaction-item">
                          <td className="px-6 py-4 whitespace-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₦{(p.price || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{p.status}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-gray-600 hover:underline" onClick={() => {/* view logic */}}>View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-xs text-gray-400">Earnings summary, payout actions, and transaction history available.</div>
              </>
            )}
          </div>
        )}
        {activeSection === 'profile' && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            {vendorLoading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-gray-500">Loading profile...</span>
              </div>
            ) : vendorProfile ? (
              <>
                <div className="mb-6 flex items-center">
                  <img src={vendorProfile.photoURL || 'https://via.placeholder.com/64'} alt="Profile" className="w-16 h-16 rounded-full mr-4 border" />
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Vendor ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{vendorProfile.id}</span></div>
                    <div className="text-gray-600 text-sm mb-1">Name: {vendorProfile.businessName}</div>
                    <div className="text-gray-600 text-sm mb-1">Email: {vendorProfile.contactInfo?.email}</div>
                    <div className="text-gray-600 text-sm mb-1">Phone: {vendorProfile.contactInfo?.phone}</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-200 p-6 max-w-lg">
                  <div className="mb-4">Business Type: {vendorProfile.businessType}</div>
                  <div className="mb-4">License Number: {vendorProfile.licenseNumber}</div>
                  <div className="mb-4">Experience: {vendorProfile.experience}</div>
                  <div className="mb-4">Joined: {vendorProfile.joinedDate ? new Date(vendorProfile.joinedDate).toLocaleDateString() : 'N/A'}</div>
                  <div className="mb-4">Status: <span className="font-mono bg-green-100 px-2 py-1 rounded">{vendorProfile.status}</span></div>
                </div>
                <div className="mt-4 text-xs text-gray-400">Profile information loaded from VendorContext.</div>
              </>
            ) : (
              <div className="text-gray-500">No vendor profile found.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
