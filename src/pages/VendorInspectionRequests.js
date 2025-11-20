import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listInspectionRequestsByVendor, updateInspectionRequest } from '../services/inspectionService';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

const VendorInspectionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [requestToRespond, setRequestToRespond] = useState(null);
  const [proposalDate, setProposalDate] = useState('');
  const [proposalTime, setProposalTime] = useState('');
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
    const end = start ? new Date(start.getTime() + 60 * 60 * 1000) : null; // 1 hour duration
    const details = `Inspection with ${r.buyerName || 'buyer'} at ${r.projectLocation || ''}`;
    const location = r.projectLocation || '';
    return { title, start, end, details, location };
  };

  const formatDateICS = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  const downloadICS = (r) => {
    const { title, start, end, details, location } = buildCalendar(r);
    if (!start || !end) { toast.error('Invalid date/time'); return; }
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
    if (!start || !end) { toast.error('Invalid date/time'); return; }
    const fmt = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}T${String(d.getUTCHours()).padStart(2,'0')}${String(d.getUTCMinutes()).padStart(2,'0')}00Z`;
    const text = encodeURIComponent(title);
    const dates = `${fmt(start)}/${fmt(end)}`;
    const detailsEnc = encodeURIComponent(details);
    const locationEnc = encodeURIComponent(location);
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${detailsEnc}&location=${locationEnc}`;
    window.open(url, '_blank');
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await listInspectionRequestsByVendor(user?.id, user?.email);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!user?.id && !user?.email) return;
    try {
      const clauses = [];
      if (user?.id) clauses.push(where('vendorId', '==', user.id));
      if (user?.email) clauses.push(where('vendorEmail', '==', user.email));
      const q = query(collection(db, 'inspectionRequests'), ...clauses);
      const unsub = onSnapshot(q, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        // sort newest first
        arr.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0));
        setRequests(arr);
        // web notifications on status changes
        ensureNotificationPermission();
        const prev = prevStatusRef.current || {};
        for (const r of arr) {
          const previous = prev[r.id];
          if (previous && previous !== r.status) {
            if (r.status === 'accepted') {
              toast.success(`Inspection accepted for ${r.projectName}`);
              if (r.confirmedDate && r.confirmedTime) {
                showWebNotification('Inspection accepted', { body: `${r.projectName} on ${r.confirmedDate} ${r.confirmedTime}` });
              }
            } else if (r.status === 'proposed_new_time') {
              toast('Proposed a new time to buyer', { icon: '✓' });
            } else if (r.status === 'declined') {
              toast.error(`Inspection declined for ${r.projectName}`);
            }
          }
        }
        prevStatusRef.current = Object.fromEntries(arr.map(x => [x.id, x.status]));
      });
      return () => unsub();
    } catch (e) {
      console.warn('Realtime subscription failed, using manual load', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  const accept = async (req) => {
    const ok = await updateInspectionRequest(req.id, {
      status: 'accepted',
      confirmedDate: req.preferredDate,
      confirmedTime: req.preferredTime
    });
    if (ok) {
      toast.success('Accepted');
      load();
    } else {
      toast.error('Failed to accept');
    }
  };

  const decline = async (req) => {
    const ok = await updateInspectionRequest(req.id, { status: 'declined' });
    if (ok) {
      toast.success('Declined');
      load();
    } else {
      toast.error('Failed to decline');
    }
  };

  const openPropose = (req) => {
    setRequestToRespond(req);
    setProposalDate('');
    setProposalTime('');
    setShowProposeModal(true);
  };

  const sendProposal = async () => {
    if (!proposalDate || !proposalTime || !requestToRespond) {
      toast.error('Provide date and time');
      return;
    }
    const ok = await updateInspectionRequest(requestToRespond.id, {
      status: 'proposed_new_time',
      proposedDate: proposalDate,
      proposedTime: proposalTime
    });
    if (ok) {
      toast.success('Proposed new time');
      setShowProposeModal(false);
      setRequestToRespond(null);
      load();
    } else {
      toast.error('Failed to propose');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inspection Requests</h1>
        <p className="text-gray-600">All viewing requests for your listed properties</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">{loading ? 'Loading...' : `${requests.length} request(s)`}</div>
          <button onClick={load} className="btn-outline text-sm">Refresh</button>
        </div>
        <div className="divide-y">
          {!loading && requests.length === 0 && (
            <div className="p-6 text-sm text-gray-600">No inspection requests yet.</div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="p-4 flex items-center text-sm">
              <div className="w-1/5">
                <div className="font-medium text-gray-900">{r.projectName}</div>
                <div className="text-gray-600">{r.projectLocation}</div>
              </div>
              <div className="w-1/5">
                <div className="font-medium text-gray-900">{r.buyerName || 'Unknown'}</div>
                <div className="text-gray-600">{r.buyerEmail || ''}</div>
              </div>
              <div className="w-1/5">
                <div>{r.preferredDate} {r.preferredTime}</div>
                {r.proposedDate && r.proposedTime && (
                  <div className="text-xs text-gray-600">Proposed: {r.proposedDate} {r.proposedTime}</div>
                )}
              </div>
              <div className="w-1/5">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  r.status === 'pending_vendor' ? 'bg-yellow-100 text-yellow-800' :
                  r.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  r.status === 'proposed_new_time' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {r.status?.replaceAll('_',' ') || 'pending'}
                </span>
              </div>
              <div className="w-1/5 flex flex-wrap gap-2">
                {r.status !== 'accepted' && (
                  <button onClick={() => accept(r)} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
                )}
                <button onClick={() => openPropose(r)} className="px-3 py-1 bg-blue-600 text-white rounded">Propose</button>
                {r.status !== 'declined' && (
                  <button onClick={() => decline(r)} className="px-3 py-1 bg-red-600 text-white rounded">Decline</button>
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

      {showProposeModal && requestToRespond && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Propose New Time</h3>
              <button onClick={() => setShowProposeModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm">
              <p className="font-semibold">{requestToRespond.projectName}</p>
              <p className="text-gray-600">Buyer: {requestToRespond.buyerName || 'Unknown'}</p>
              <p className="text-gray-600">Preferred: {requestToRespond.preferredDate} {requestToRespond.preferredTime}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New date</label>
                <input type="date" value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New time</label>
                <input type="time" value={proposalTime} onChange={(e) => setProposalTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setShowProposeModal(false)} className="px-5 py-2 border rounded-lg">Cancel</button>
              <button onClick={sendProposal} disabled={!proposalDate || !proposalTime} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Send Proposal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInspectionRequests;





