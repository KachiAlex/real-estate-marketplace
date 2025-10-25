import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { updateInspectionRequest } from '../services/inspectionService';
import toast from 'react-hot-toast';

const BuyerInspectionRequests = () => {
  const { user } = useAuth();
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
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KIKI ESTATES//Inspection//EN','BEGIN:VEVENT',
      `UID:${r.id}@kikiestate`,`DTSTAMP:${formatDateICS(new Date())}`,
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

  useEffect(() => {
    if (!user?.id) return;
    try {
      const q = query(collection(db, 'inspectionRequests'), where('buyerId', '==', user.id));
      const unsub = onSnapshot(q, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0));
        setRequests(arr);
        ensureNotificationPermission();
        const prev = prevStatusRef.current || {};
        for (const r of arr) {
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
        prevStatusRef.current = Object.fromEntries(arr.map(x => [x.id, x.status]));
      });
      return () => unsub();
    } catch (e) {
      console.warn('Buyer realtime subscription failed', e);
    }
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
                  'bg-red-100 text-red-800'
                }`}>
                  {r.status?.replaceAll('_',' ') || 'pending'}
                </span>
              </div>
              <div className="w-2/5 flex flex-wrap gap-2">
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



