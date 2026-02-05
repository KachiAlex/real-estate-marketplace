import notificationService from './notificationService';

const COLLECTION = 'inspectionRequests';
const VIEWING_REQUESTS_KEY = 'viewingRequests';
const INSPECTION_ACTIVITY_KEY = 'inspectionActivityLog';
const ANALYTICS_EVENT = 'inspectionAnalyticsUpdated';
const ACTIVITY_EVENT = 'inspectionActivity';

const defaultAnalytics = {
  totalRequests: 0,
  pendingResponses: 0,
  confirmed: 0,
  vendorProposals: 0,
  buyerReschedules: 0,
  cancelledByBuyer: 0,
  cancelledByVendor: 0,
  timeline: []
};

const safeWindowDispatch = (eventName, detail) => {
  if (typeof window === 'undefined') return;
  if (eventName === 'storage') {
    try {
      window.dispatchEvent(new StorageEvent('storage', detail));
    } catch {
      window.dispatchEvent(new CustomEvent('storage', { detail }));
    }
    return;
  }
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
};

const getStoredRequests = () => {
  try {
    return JSON.parse(localStorage.getItem(VIEWING_REQUESTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveStoredRequests = (requests) => {
  localStorage.setItem(VIEWING_REQUESTS_KEY, JSON.stringify(requests));
};

const getActivityLog = () => {
  try {
    return JSON.parse(localStorage.getItem(INSPECTION_ACTIVITY_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveActivityLog = (log) => {
  localStorage.setItem(INSPECTION_ACTIVITY_KEY, JSON.stringify(log));
};

const buildActivityPayload = (action, request) => ({
  action,
  requestId: request.id,
  propertyTitle: request.propertyTitle || request.projectTitle || request.projectName || request.title || 'Property',
  buyerId: request.buyerId || request.userId,
  vendorId: request.vendorId,
  vendorEmail: request.vendorEmail,
  status: request.status,
  timestamp: new Date().toISOString()
});

const formatDateTimeLabel = (date, time) => {
  if (!date && !time) return '';
  if (!time) return date;
  if (!date) return time;
  return `${date} ${time}`;
};

const buildInspectionNotificationEntries = (action, request, payload) => {
  const entries = [];
  const propertyTitle = payload.propertyTitle;
  const buyerName = request.buyerName || request.userName || 'Buyer';
  const vendorName = request.vendorName || request.vendor || request.owner || 'Vendor';
  const preferredLabel = formatDateTimeLabel(request.preferredDate, request.preferredTime);
  const confirmedLabel = formatDateTimeLabel(request.confirmedDate, request.confirmedTime);
  const proposedLabel = formatDateTimeLabel(request.proposedDate, request.proposedTime);

  const pushForVendor = (title, message) => {
    if (request.vendorId || request.vendorEmail) {
      entries.push({
        recipientId: request.vendorId,
        recipientEmail: request.vendorEmail,
        roles: ['vendor'],
        type: action,
        title,
        message,
        priority: 'medium',
        metadata: { requestId: request.id, propertyTitle, buyerName, vendorName }
      });
    }
  };

  const pushForBuyer = (title, message) => {
    if (request.buyerId || request.userId || request.buyerEmail || request.userEmail) {
      entries.push({
        recipientId: request.buyerId || request.userId,
        recipientEmail: request.buyerEmail || request.userEmail,
        roles: ['buyer'],
        type: action,
        title,
        message,
        priority: 'medium',
        metadata: { requestId: request.id, propertyTitle, buyerName, vendorName }
      });
    }
  };

  switch (action) {
    case 'inspection_requested':
      pushForVendor('New inspection request', `${buyerName} requested to view ${propertyTitle} ${preferredLabel ? `on ${preferredLabel}` : ''}`.trim());
      break;
    case 'inspection_confirmed':
      pushForBuyer('Inspection confirmed', `${vendorName} confirmed ${propertyTitle} ${confirmedLabel ? `for ${confirmedLabel}` : ''}`.trim());
      break;
    case 'vendor_proposed_new_time':
      pushForBuyer('Vendor proposed new time', `${vendorName} suggested ${proposedLabel || 'another slot'} for ${propertyTitle}`);
      break;
    case 'buyer_rescheduled':
      pushForVendor('Buyer requested new time', `${buyerName} rescheduled ${propertyTitle} ${preferredLabel ? `to ${preferredLabel}` : ''}`.trim());
      break;
    case 'inspection_cancelled_by_buyer':
      pushForVendor('Inspection cancelled by buyer', `${buyerName} cancelled ${propertyTitle}`);
      break;
    case 'inspection_cancelled_by_vendor':
      pushForBuyer('Inspection cancelled by vendor', `${vendorName} cancelled ${propertyTitle}`);
      break;
    case 'inspection_declined':
      pushForBuyer('Inspection declined', `${vendorName} declined the request for ${propertyTitle}`);
      break;
    default:
      break;
  }

  return entries;
};

const persistInspectionNotifications = (entries = []) => {
  if (!entries.length || typeof window === 'undefined') return;
  const payloads = entries
    .filter((entry) => entry.recipientId)
    .map((entry) => ({
      recipientId: entry.recipientId,
      type: entry.type,
      title: entry.title,
      message: entry.message,
      priority: entry.priority || 'medium',
      metadata: {
        ...(entry.metadata || {}),
        source: entry.metadata?.source || 'inspection_client_sync'
      },
      data: entry.metadata || {}
    }));

  if (!payloads.length) return;

  notificationService.createInspectionNotifications(payloads)
    .then((result) => {
      if (!result?.success) {
        console.warn('Failed to persist inspection notifications', result);
      }
    })
    .catch((error) => {
      console.error('Error persisting inspection notifications:', error);
    });
};

const logInspectionActivity = (action, request) => {
  if (!action || !request) return;
  const payload = buildActivityPayload(action, request);
  const log = getActivityLog();
  log.unshift(payload);
  if (log.length > 200) {
    log.pop();
  }
  saveActivityLog(log);
  safeWindowDispatch(ACTIVITY_EVENT, payload);
  safeWindowDispatch(ANALYTICS_EVENT, payload);
  const notifications = buildInspectionNotificationEntries(action, request, payload);
  if (notifications.length) {
    safeWindowDispatch('inspectionNotification', { action, payload, notifications, request });
    persistInspectionNotifications(notifications);
  }
};

const deriveActionFromStatus = (previous, next, updates = {}) => {
  const status = (next?.status || updates.status || '').toLowerCase();
  if (!status && (updates.proposedDate || updates.proposedTime)) {
    return 'vendor_proposed_new_time';
  }
  switch (status) {
    case 'accepted':
    case 'confirmed':
      return 'inspection_confirmed';
    case 'proposed_new_time':
      return 'vendor_proposed_new_time';
    case 'buyer_rescheduled':
      return 'buyer_rescheduled';
    case 'cancelled_by_buyer':
      return 'inspection_cancelled_by_buyer';
    case 'cancelled_by_vendor':
      return 'inspection_cancelled_by_vendor';
    case 'declined':
      return 'inspection_declined';
    default:
      if (previous && previous.status !== next?.status) {
        return `inspection_status_${next?.status || 'updated'}`;
      }
      return null;
  }
};

const getDateKey = (isoDate) => {
  const date = isoDate ? new Date(isoDate) : new Date();
  return date.toISOString().slice(0, 10);
};

const matchesBuyer = (request, buyerId) => {
  if (!buyerId) return false;
  return request?.buyerId === buyerId || request?.userId === buyerId;
};

const matchesVendor = (request, vendorId, vendorEmail) => {
  if (!vendorId && !vendorEmail) return false;
  return (vendorId && request?.vendorId === vendorId) || (vendorEmail && request?.vendorEmail === vendorEmail);
};

export const getInspectionAnalytics = ({ role = 'buyer', userId, vendorId, vendorEmail } = {}) => {
  if (typeof window === 'undefined') return { ...defaultAnalytics };
  if (role === 'buyer' && !userId) return { ...defaultAnalytics };
  if (role === 'vendor' && !vendorId && !vendorEmail) return { ...defaultAnalytics };

  const requests = getStoredRequests();
  const relevant = requests.filter((req) =>
    role === 'buyer' ? matchesBuyer(req, userId) : matchesVendor(req, vendorId || req.vendorId, vendorEmail)
  );

  const analytics = {
    totalRequests: relevant.length,
    pendingResponses: 0,
    confirmed: 0,
    vendorProposals: 0,
    buyerReschedules: 0,
    cancelledByBuyer: 0,
    cancelledByVendor: 0,
    timeline: []
  };

  const pendingStatuses = ['pending', 'pending_vendor', 'pending_vendor_confirmation'];
  const log = getActivityLog();
  const activityFilter = (entry) =>
    role === 'buyer' ? entry?.buyerId === userId : matchesVendor(entry, vendorId, vendorEmail);

  relevant.forEach((req) => {
    const status = (req.status || '').toLowerCase();
    if (pendingStatuses.includes(status)) {
      analytics.pendingResponses += 1;
    }
    if (['accepted', 'confirmed'].includes(status)) {
      analytics.confirmed += 1;
    }
    if (status === 'proposed_new_time') {
      analytics.vendorProposals += 1;
    }
    if (status === 'buyer_rescheduled') {
      analytics.buyerReschedules += 1;
    }
    if (status === 'cancelled_by_buyer') {
      analytics.cancelledByBuyer += 1;
    }
    if (['cancelled_by_vendor', 'declined'].includes(status)) {
      analytics.cancelledByVendor += 1;
    }
  });

  const lastSevenDays = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const dateKey = date.toISOString().slice(0, 10);
    const dailyCount = log.filter((entry) => activityFilter(entry) && getDateKey(entry.timestamp) === dateKey).length;
    return { date: dateKey, count: dailyCount };
  });

  analytics.timeline = lastSevenDays;
  return analytics;
};

export const createInspectionRequest = async (requestData) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for creating inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const existing = getStoredRequests();
    const newRequest = {
      id: `viewing-${Date.now()}`,
      ...requestData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    existing.push(newRequest);
    saveStoredRequests(existing);
    
    // Dispatch event to notify Dashboard and other components
    safeWindowDispatch('viewingsUpdated', {
      viewingRequest: newRequest,
      action: 'created'
    });
    
    // Also trigger a storage event for cross-tab synchronization
    safeWindowDispatch('storage', {
      key: VIEWING_REQUESTS_KEY,
      newValue: JSON.stringify(existing)
    });
    logInspectionActivity('inspection_requested', newRequest);
    
    return newRequest;
  } catch (error) {
    console.error('Error creating inspection request:', error);
    // Final fallback to localStorage
    const existing = getStoredRequests();
    const newRequest = {
      id: `viewing-${Date.now()}`,
      ...requestData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    existing.push(newRequest);
    saveStoredRequests(existing);
    
    // Dispatch event to notify Dashboard and other components
    safeWindowDispatch('viewingsUpdated', {
      viewingRequest: newRequest,
      action: 'created'
    });
    
    // Also trigger a storage event for cross-tab synchronization
    safeWindowDispatch('storage', {
      key: VIEWING_REQUESTS_KEY,
      newValue: JSON.stringify(existing)
    });
    logInspectionActivity('inspection_requested', newRequest);
    
    return newRequest;
  }
};

export const listInspectionRequestsByVendor = async (vendorId, vendorEmail) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const local = getStoredRequests();
    
    // Filter by vendorId or vendorEmail
    const filtered = local.filter((r) => 
      (vendorId && r.vendorId === vendorId) || 
      (vendorEmail && r.vendorEmail === vendorEmail)
    );
    
    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    return filtered;
  } catch (error) {
    console.error('Error listing inspection requests:', error);
    // Final fallback to localStorage
    const local = getStoredRequests();
    const filtered = local.filter((r) => 
      (vendorId && r.vendorId === vendorId) || 
      (vendorEmail && r.vendorEmail === vendorEmail)
    );
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
};

export const listInspectionRequestsByBuyer = async (buyerId) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for buyer inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const local = getStoredRequests();
    const filtered = local.filter((r) => r.buyerId === buyerId);
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (error) {
    console.error('Error listing buyer inspection requests:', error);
    return [];
  }
};

export const updateInspectionRequest = async (requestId, updates) => {
  try {
    // Skip API call for now since it's returning 404, go directly to localStorage
    console.log('Using localStorage for updating inspection requests (API unavailable)');
    
    // Fallback to localStorage
    const all = getStoredRequests();
    let nextRecord = null;
    const updated = all.map((r) => {
      if (r.id === requestId) {
        nextRecord = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return nextRecord;
      }
      return r;
    });
    if (!nextRecord) {
      saveStoredRequests(all);
      return false;
    }
    saveStoredRequests(updated);
    
    // Dispatch event to notify Dashboard and other components when status changes
    safeWindowDispatch('viewingsUpdated', {
      requestId,
      updates,
      action: 'updated'
    });
    
    // Also trigger a storage event for cross-tab synchronization
    safeWindowDispatch('storage', {
      key: VIEWING_REQUESTS_KEY,
      newValue: JSON.stringify(updated)
    });
    const action = deriveActionFromStatus(all.find((r) => r.id === requestId), nextRecord, updates);
    if (action) {
      logInspectionActivity(action, nextRecord);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating inspection request:', error);
    // Final fallback to localStorage
    const all = getStoredRequests();
    let nextRecord = null;
    const updated = all.map((r) => {
      if (r.id === requestId) {
        nextRecord = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return nextRecord;
      }
      return r;
    });
    if (!nextRecord) {
      saveStoredRequests(all);
      return false;
    }
    saveStoredRequests(updated);
    
    // Dispatch event to notify Dashboard and other components when status changes
    safeWindowDispatch('viewingsUpdated', {
      requestId,
      updates,
      action: 'updated'
    });
    
    // Also trigger a storage event for cross-tab synchronization
    safeWindowDispatch('storage', {
      key: VIEWING_REQUESTS_KEY,
      newValue: JSON.stringify(updated)
    });
    const action = deriveActionFromStatus(all.find((r) => r.id === requestId), nextRecord, updates);
    if (action) {
      logInspectionActivity(action, nextRecord);
    }
    
    return true;
  }
};

export const syncLocalInspectionRequests = async () => {
  try {
    // Try to sync with API if available
    const local = getStoredRequests();
    console.log('Inspection requests stored locally:', local.length);
    return { synced: local.length };
  } catch (error) {
    console.error('syncLocalInspectionRequests failed:', error);
    return { synced: 0 };
  }
};

export default {
  createInspectionRequest,
  listInspectionRequestsByVendor,
  listInspectionRequestsByBuyer,
  updateInspectionRequest,
  syncLocalInspectionRequests,
  getInspectionAnalytics
};