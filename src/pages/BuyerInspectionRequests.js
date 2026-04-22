import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateInspectionRequest, getInspectionAnalytics, listInspectionRequestsByBuyer } from '../services/inspectionService';
import { FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

const BuyerInspectionRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const prevStatusRef = useRef({});
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleRequest, setRescheduleRequest] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  const ensureNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (e) {}
  };

  const showWebNotification = (title, options = {}) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') new Notification(title, options);
    } catch (e) {}
  };

  const toDateTime = (dateStr, timeStr) => {
    try { return new Date(`${dateStr}T${timeStr}:00`); } catch { return null; }
  };

  const buildCalendar = (r) => {
    const title = `Property Inspection - ${r.projectName}`;
    const start = r.confirmedDate && r.confirmedTime ? toDateTime(r.confirmedDate, r.confirmedTime) : toDateTime(r.preferredDate, r.preferredTime);
    const end = start ? new Date(start.getTime() + 60 * 60 * 1000) : null; // 1 hour
    const details = `Inspection at ${r.projectLocation || ''}`;
    const location = r.projectLocation || '';
    return { title, start, end, details, location };
  };

  const formatDateICS = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  const downloadICS = (r) => {
    const { title, start, end, details, location } = buildCalendar(r);
    if (!start || !end) { return; }
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PropertyArk//Inspection//EN','BEGIN:VEVENT',
      `UID:${r.id}@propertyark`,`DTSTAMP:${formatDateICS(new Date())}`,
      `DTSTART:${formatDateICS(start)}`,`DTEND:${formatDateICS(end)}`,
      `SUMMARY:${title}`,`DESCRIPTION:${details}`,`LOCATION:${location}`,'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inspection-${r.id}.ics`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const openGoogleCalendar = (r) => {
    const { title, start, end, details, location } = buildCalendar(r);
    if (!start || !end) { return; }
    const fmt = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}T${String(d.getUTCHours()).padStart(2,'0')}${String(d.getUTCMinutes()).padStart(2,'0')}00Z`;
    const text = encodeURIComponent(title);
    const dates = `${fmt(start)}/${fmt(end)}`;
    const detailsEnc = encodeURIComponent(details);
    const locationEnc = encodeURIComponent(location);
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${detailsEnc}&location=${locationEnc}`;
    window.open(url, '_blank');
  };

  // Load requests from localStorage (primary source for now)
  const loadRequestsFromLocalStorage = () => {
    if (!user?.id) return [];
    
    try {
      const viewingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      
      // Filter by user ID (check both userId and buyerId for compatibility)
      const userRequests = viewingRequests.filter(req => 
        req.userId === user.id || req.buyerId === user.id
      );
      
      // Transform localStorage format to match component expectations
      const transformed = userRequests.map(req => ({
        id: req.id,
        // Map property fields to project fields (for display compatibility)
        projectName: req.propertyTitle || req.projectName || req.title || 'Property',
        projectLocation: req.propertyLocation || req.projectLocation || req.location || '',
        // Keep original fields
        preferredDate: req.preferredDate,
        preferredTime: req.preferredTime,
        confirmedDate: req.confirmedDate,
        confirmedTime: req.confirmedTime,
        proposedDate: req.proposedDate,
        proposedTime: req.proposedTime,
        status: req.status || 'pending_vendor',
        createdAt: req.requestedAt || req.createdAt || new Date().toISOString(),
        // Keep other fields
        ...req
      }));
      
      // Sort by date (newest first)
      transformed.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      return transformed;
    } catch (error) {
      console.error('Error loading requests from localStorage:', error);
      return [];
    }
  };

  // Update requests state
  const updateRequests = (newRequests) => {
    setRequests(newRequests);
    ensureNotificationPermission();
    const prev = prevStatusRef.current || {};
    for (const r of newRequests) {
      const previous = prev[r.id];
      if (previous && previous !== r.status) {
        if (r.status === 'accepted') {
          showWebNotification('Inspection confirmed', { body: `${r.projectName} on ${r.confirmedDate} ${r.confirmedTime}` });
        } else if (r.status === 'proposed_new_time') {
          showWebNotification('Vendor proposed a new time', { body: `${r.projectName}: ${r.proposedDate} ${r.proposedTime}` });
        } else if (r.status === 'declined') {
          showWebNotification('Inspection declined', { body: `${r.projectName}` });
        } else if (r.status === 'cancelled_by_vendor') {
          showWebNotification('Vendor cancelled inspection', { body: `${r.projectName} was cancelled by vendor` });
          toast.error(`Vendor cancelled inspection for ${r.projectName}`);
        }
      }
    }
    prevStatusRef.current = Object.fromEntries(newRequests.map(x => [x.id, x.status]));
    if (user && user.id) {
      setAnalytics(getInspectionAnalytics({ role: 'buyer', userId: user.id }));
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setRequests([]);
      return;
    }

    // Load from localStorage (primary source)
    const localRequests = loadRequestsFromLocalStorage();
    updateRequests(localRequests);

    // Poll for updates every 5 seconds as fallback
    const pollInterval = setInterval(() => {
      const updatedRequests = loadRequestsFromLocalStorage();
      updateRequests(updatedRequests);
    }, 5000);

    // Listen for viewing updates from other components
    const handleViewingsUpdate = () => {
      const updatedRequests = loadRequestsFromLocalStorage();
      updateRequests(updatedRequests);
    };

    const handleAnalyticsUpdate = (event) => {
      if (!user?.id) return;
      const detail = event.detail || event;
      if (detail?.buyerId && detail.buyerId !== user.id) return;
      const data = getInspectionAnalytics({ role: 'buyer', userId: user.id });
      setAnalytics(data);
    };

    window.addEventListener('viewingsUpdated', handleViewingsUpdate);
    window.addEventListener('inspectionAnalyticsUpdated', handleAnalyticsUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'viewingRequests') {
        handleViewingsUpdate();
      }
    });

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('viewingsUpdated', handleViewingsUpdate);
      window.removeEventListener('inspectionAnalyticsUpdated', handleAnalyticsUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setAnalytics(null);
      return;
    }
    setAnalytics(getInspectionAnalytics({ role: 'buyer', userId: user.id }));
  }, [user?.id]);

  const acceptProposal = async (r) => {
    if (!r.proposedDate || !r.proposedTime) {
      toast.error('No proposed time from vendor');
      return;
    }
    const ok = await updateInspectionRequest(r.id, {
      status: 'accepted',
      confirmedDate: r.proposedDate,
      confirmedTime: r.proposedTime
    });
    if (ok) toast.success('Proposal accepted'); else toast.error('Failed to accept');
  };

  const declineProposal = async (r) => {
    const ok = await updateInspectionRequest(r.id, { status: 'declined' });
    if (ok) toast.success('Proposal declined'); else toast.error('Failed to decline');
  };

  const handleCancelRequest = async (r) => {
    const confirm = window.confirm('Cancel this inspection request? Vendors will be notified.');
    if (!confirm) return;
    const ok = await updateInspectionRequest(r.id, { status: 'cancelled_by_buyer', cancelledAt: new Date().toISOString() });
    if (ok) toast.success('Inspection cancelled'); else toast.error('Failed to cancel');
  };

  const openReschedule = (r) => {
    setRescheduleRequest(r);
    setRescheduleDate(r.preferredDate || '');
    setRescheduleTime(r.preferredTime || '');
    setRescheduleNote('');
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleRequest || !rescheduleDate || !rescheduleTime) {
      toast.error('Select your new date and time');
      return;
    }
    const ok = await updateInspectionRequest(rescheduleRequest.id, {
      status: 'buyer_rescheduled',
      preferredDate: rescheduleDate,
      preferredTime: rescheduleTime,
      buyerMessage: rescheduleNote || '',
      proposedDate: null,
      proposedTime: null
    });
    if (ok) {
      toast.success('Reschedule request sent to vendor');
      setShowRescheduleModal(false);
      setRescheduleRequest(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleNote('');
    } else {
      toast.error('Failed to reschedule');
    }
  };

  const handleViewProperty = (request) => {
    // Try to get propertyId from the request
    const propertyId = request.propertyId || request.projectId;
    
    if (propertyId) {
      navigate(`/property/${propertyId}`);
    } else {
      toast.error('Property information not available');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Inspection Requests</h1>
        <p className="text-gray-600">Track and respond to vendor proposals</p>
      </div>

      {analytics && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600">Pending Responses</p>
              <p className="text-3xl font-semibold text-blue-900">{analytics.pendingResponses}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600">Confirmed</p>
              <p className="text-3xl font-semibold text-green-900">{analytics.confirmed}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-600">Vendor Reschedules</p>
              <p className="text-3xl font-semibold text-purple-900">{analytics.vendorProposals}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm text-red-600">Vendor Cancellations</p>
              <p className="text-3xl font-semibold text-red-900">{analytics.cancelledByVendor}</p>
            </div>
          </div>

          {analytics.timeline?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Last 7 days activity</h3>
                <span className="text-xs text-gray-500">{analytics.totalRequests} total requests</span>
              </div>
              <div className="flex gap-3 overflow-x-auto text-sm">
                {analytics.timeline.map((item) => (
                  <div key={item.date} className="flex-1 min-w-[90px] text-center">
                    <p className="text-gray-500 text-xs">{new Date(item.date).toLocaleDateString()}</p>
                    <p className="text-lg font-semibold text-gray-900">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 text-sm text-gray-600">{requests.length} request(s)</div>
        <div className="divide-y">
          {requests.length === 0 && (
            <div className="p-6 text-sm text-gray-600">No inspection requests yet.</div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="p-4 flex items-center text-sm">
              <div className="w-1/5">
                <div className="font-medium text-gray-900">{r.projectName}</div>
                <div className="text-gray-600">{r.projectLocation}</div>
              </div>
              <div className="w-1/5">
                <div>Preferred: {r.preferredDate} {r.preferredTime}</div>
                {r.proposedDate && r.proposedTime && (
                  <div className="text-xs text-gray-600">Vendor proposed: {r.proposedDate} {r.proposedTime}</div>
                )}
              </div>
              <div className="w-1/5">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  r.status === 'pending_vendor' ? 'bg-yellow-100 text-yellow-800' :
                  r.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  r.status === 'proposed_new_time' ? 'bg-blue-100 text-blue-800' :
                  r.status === 'pending_vendor_confirmation' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {r.status?.replaceAll('_',' ') || 'pending'}
                </span>
              </div>
              <div className="w-2/5 flex flex-wrap gap-2 items-center">
                {/* View Property Icon */}
                <button
                  onClick={() => handleViewProperty(r)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="View Property Details"
                >
                  <FaEye className="w-5 h-5" />
                </button>
                
                {r.status === 'proposed_new_time' && (
                  <>
                    <button onClick={() => acceptProposal(r)} className="px-3 py-1 bg-green-600 text-white rounded">Accept Proposal</button>
                    <button onClick={() => declineProposal(r)} className="px-3 py-1 bg-red-600 text-white rounded">Decline</button>
                  </>
                )}
                {r.status === 'accepted' && (
                  <>
                    <button onClick={() => openGoogleCalendar(r)} className="px-3 py-1 bg-gray-800 text-white rounded">Google Calendar</button>
                    <button onClick={() => downloadICS(r)} className="px-3 py-1 border rounded">Download .ics</button>
                  </>
                )}
                {r.status !== 'cancelled_by_buyer' && r.status !== 'declined' && (
                  <>
                    <button onClick={() => openReschedule(r)} className="px-3 py-1 bg-blue-600 text-white rounded">Reschedule</button>
                    <button onClick={() => handleCancelRequest(r)} className="px-3 py-1 bg-red-100 text-red-700 rounded border border-red-300">Cancel</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRescheduleModal && rescheduleRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reschedule Inspection</h3>
                <p className="text-sm text-gray-500">{rescheduleRequest.projectName}</p>
              </div>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message to vendor (optional)</label>
                <textarea
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share context for the new time"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setShowRescheduleModal(false)} className="px-5 py-2 border rounded-lg">Close</button>
              <button onClick={submitReschedule} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerInspectionRequests;





