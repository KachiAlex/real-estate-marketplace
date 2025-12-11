import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { updateInspectionRequest } from '../services/inspectionService';
import { FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

const BuyerInspectionRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const prevStatusRef = useRef({});

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
        }
      }
    }
    prevStatusRef.current = Object.fromEntries(newRequests.map(x => [x.id, x.status]));
  };

  useEffect(() => {
    if (!user?.id) {
      setRequests([]);
      return;
    }

    // Load from localStorage first (primary source)
    const localRequests = loadRequestsFromLocalStorage();
    updateRequests(localRequests);

    // Also try to subscribe to Firestore (for future use when API is available)
    let firestoreUnsub = null;
    try {
      const q = query(collection(db, 'inspectionRequests'), where('buyerId', '==', user.id));
      firestoreUnsub = onSnapshot(q, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0));
        
        // Merge Firestore data with localStorage data (Firestore takes precedence if both exist)
        const localRequests = loadRequestsFromLocalStorage();
        const merged = [...arr, ...localRequests.filter(lr => !arr.find(fr => fr.id === lr.id))];
        updateRequests(merged);
      });
    } catch (e) {
      console.warn('Buyer realtime subscription failed, using localStorage only:', e);
    }

    // Listen for viewing updates from other components
    const handleViewingsUpdate = () => {
      const updatedRequests = loadRequestsFromLocalStorage();
      updateRequests(updatedRequests);
    };

    window.addEventListener('viewingsUpdated', handleViewingsUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'viewingRequests') {
        handleViewingsUpdate();
      }
    });

    return () => {
      if (firestoreUnsub) firestoreUnsub();
      window.removeEventListener('viewingsUpdated', handleViewingsUpdate);
    };
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerInspectionRequests;





