#!/usr/bin/env node
const axios = require('axios');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value === undefined ? true : value;
  return acc;
}, {});

const BASE_URL = args.baseUrl || process.env.BASE_URL || 'http://localhost:5000/api';
const USER_TOKEN = args.userToken || process.env.USER_TOKEN;
const ADMIN_TOKEN = args.adminToken || process.env.ADMIN_TOKEN;
const TIMEOUT = Number(args.timeout || process.env.TEST_TIMEOUT_MS || 15000);

if (!USER_TOKEN) {
  console.error('❌ Missing user token. Pass --userToken=<JWT> or set USER_TOKEN env variable.');
  process.exit(1);
}

const decodeUserIdFromToken = (token) => {
  try {
    const base64Payload = token.split('.')[1];
    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
    return payload.id || payload.userId || payload.uid || payload.sub;
  } catch (error) {
    console.warn('⚠️ Unable to decode user ID from token:', error.message);
    return null;
  }
};

const USER_ID = args.userId || decodeUserIdFromToken(USER_TOKEN);
if (!USER_ID) {
  console.error('❌ Unable to determine user ID from token. Pass --userId=<ID> explicitly.');
  process.exit(1);
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function httpRequest(method, path, token, data) {
  try {
    const response = await client.request({
      method,
      url: path,
      data,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Request failed [${method.toUpperCase()} ${path}] (${error.response.status}): ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw new Error(`Request failed [${method.toUpperCase()} ${path}]: ${error.message}`);
  }
}

async function runNotificationFlow() {
  console.log('\n🔔 Notification flow tests');
  const list = await httpRequest('get', '/notifications', USER_TOKEN);
  console.log(`✅ Fetched ${list?.data?.notifications?.length ?? 0} notifications`);

  let notificationId = list?.data?.notifications?.[0]?.id;

  if (ADMIN_TOKEN) {
    console.log('→ Creating test notification via admin token');
    const created = await httpRequest('post', '/notifications/test', ADMIN_TOKEN, {
      type: 'general',
      title: 'Test Notification',
      message: 'Automated test notification',
      priority: 'low',
      recipient: USER_ID
    });
    notificationId = created?.data?.id || created?.data?.data?.id || notificationId;
    console.log(`✅ Created notification ${notificationId}`);
    await sleep(500);
  } else {
    console.warn('⚠️ No admin token provided; skipping notification creation test.');
  }

  if (!notificationId) {
    console.warn('⚠️ No notifications available to exercise detail routes. Skipping remaining notification tests.');
    return;
  }

  const detail = await httpRequest('get', `/notifications/${notificationId}`, USER_TOKEN);
  console.log(`✅ Retrieved notification ${detail?.data?.id}`);

  await httpRequest('put', `/notifications/${notificationId}/read`, USER_TOKEN);
  console.log('✅ Marked notification as read');

  await httpRequest('put', `/notifications/${notificationId}/archive`, USER_TOKEN);
  console.log('✅ Archived notification');

  const unread = await httpRequest('get', '/notifications/unread/count', USER_TOKEN);
  console.log(`✅ Unread count: ${unread?.data?.unreadCount}`);

  await httpRequest('delete', `/notifications/${notificationId}`, USER_TOKEN);
  console.log('✅ Deleted notification');
}

function buildFutureDate(daysAhead = 14) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
}

const FALLBACK_PROPERTY_IDS = ['prop_001', 'prop_003', 'prop_005'];
const ESCROW_STATUS_ORDER = ['initiated', 'pending', 'active', 'completed', 'disputed', 'cancelled', 'refunded'];
const ACTIVE_ESCROW_STATUSES = ['initiated', 'pending', 'active'];

const isPurchaseEligible = (property = {}) => {
  const status = (property.status || property.listingType || '').toLowerCase();
  if (!status) return true; // default to true if status missing
  if (status.includes('rent') || status.includes('lease')) return false;
  return ['for-sale', 'available', 'sale', 'for sale'].includes(status) || status.includes('sale');
};

async function fetchPropertyId() {
  const propertyResponse = await httpRequest('get', '/properties?limit=10&status=for-sale', USER_TOKEN)
    .catch(() => null);

  const fallbackResponse = propertyResponse || await httpRequest('get', '/properties?limit=10', USER_TOKEN);
  const payload = fallbackResponse?.data ?? {};
  let properties = [];

  if (Array.isArray(payload)) {
    properties = payload;
  } else if (Array.isArray(payload?.properties)) {
    properties = payload.properties;
  } else if (Array.isArray(payload?.data)) {
    properties = payload.data;
  }

  const preferred = properties?.find((prop) => isPurchaseEligible(prop)) || null;

  let propertyId = preferred?.id;

  if (!propertyId || !isPurchaseEligible(preferred)) {
    for (const fallbackId of FALLBACK_PROPERTY_IDS) {
      try {
        const detail = await httpRequest('get', `/properties/${fallbackId}`, USER_TOKEN);
        if (isPurchaseEligible(detail?.data)) {
          propertyId = detail?.data?.id || fallbackId;
          break;
        }
      } catch (error) {
        // Ignore and continue to next fallback ID
      }
    }
  }

  if (!propertyId) {
    throw new Error('Unable to fetch property ID for escrow tests. Ensure at least one property exists.');
  }
  return propertyId;
}

async function findActiveEscrowForProperty(propertyId) {
  try {
    const response = await httpRequest('get', '/escrow?limit=20&type=buyer', USER_TOKEN);
    const transactions = response?.data?.transactions || [];
    return transactions.find((tx) => tx.propertyId === propertyId && ACTIVE_ESCROW_STATUSES.includes(tx.status));
  } catch (error) {
    console.warn('⚠️ Unable to list existing escrows:', error.message);
    return null;
  }
}

function nextStatus(currentStatus, targetStatus) {
  const currentIndex = ESCROW_STATUS_ORDER.indexOf(currentStatus);
  const targetIndex = ESCROW_STATUS_ORDER.indexOf(targetStatus);
  if (currentIndex === -1 || targetIndex === -1 || targetIndex <= currentIndex) {
    return null;
  }
  return ESCROW_STATUS_ORDER[currentIndex + 1] || null;
}

async function ensureStatusProgression(escrowId, currentStatus, targetStatus, token) {
  let status = currentStatus;
  while (status !== targetStatus) {
    const next = nextStatus(status, targetStatus);
    if (!next) break;
    await httpRequest('put', `/escrow/${escrowId}/status`, token, { status: next });
    console.log(`✅ Escrow moved to ${next}`);
    status = next;
  }
  return status;
}

async function runEscrowFlow() {
  console.log('\n💼 Escrow flow tests');
  const propertyId = await fetchPropertyId();
  console.log(`→ Using property ${propertyId}`);

  let escrow = await httpRequest('post', '/escrow', USER_TOKEN, {
    propertyId,
    amount: 2500000,
    paymentMethod: 'bank_transfer',
    expectedCompletion: buildFutureDate(21),
    currency: 'NGN'
  }).then((response) => {
    console.log(`✅ Created escrow transaction ${response?.data?.id}`);
    return response?.data;
  }).catch(async (error) => {
    if (error.message.includes('active escrow transaction already exists')) {
      console.log('ℹ️ Active escrow already exists for property. Reusing existing transaction.');
      const existing = await findActiveEscrowForProperty(propertyId);
      if (!existing) {
        throw new Error('Active escrow reported but none found via list API. Please inspect data manually.');
      }
      return existing;
    }
    throw error;
  });

  const escrowId = escrow?.id;
  if (!escrowId) {
    throw new Error('Escrow creation/listing did not return an ID.');
  }

  escrow.status = await ensureStatusProgression(escrowId, escrow.status || 'initiated', 'active', USER_TOKEN) || escrow.status;

  await httpRequest('post', `/escrow/${escrowId}/documents`, USER_TOKEN, {
    type: 'contract',
    url: 'https://example.com/contract.pdf',
    name: 'Test Contract'
  });
  console.log('✅ Uploaded escrow document');

  await httpRequest('post', `/escrow/${escrowId}/dispute`, USER_TOKEN, {
    reason: 'payment_issues',
    description: 'Automated dispute created for testing',
    evidence: ['https://example.com/evidence.png']
  }).then(() => {
    console.log('✅ Filed escrow dispute');
    escrow.status = 'disputed';
  }).catch((error) => {
    if (error.message.includes('Dispute already filed') || error.message.includes('Transaction cannot be disputed')) {
      console.log('ℹ️ Dispute step skipped because transaction is already disputed/resolved.');
    } else {
      throw error;
    }
  });

  if (ADMIN_TOKEN) {
    await httpRequest('put', `/escrow/${escrowId}/resolve-dispute`, ADMIN_TOKEN, {
      resolution: 'buyer_favor',
      adminNotes: 'Automated resolution for testing'
    }).then(() => {
      console.log('✅ Resolved dispute as admin');
    }).catch((error) => {
      if (error.message.includes('Transaction is not in disputed status')) {
        console.log('ℹ️ Dispute resolution skipped because transaction already resolved.');
      } else {
        throw error;
      }
    });
  } else {
    console.warn('⚠️ No admin token provided; skipping dispute resolution test.');
  }

  const detail = await httpRequest('get', `/escrow/${escrowId}`, USER_TOKEN);
  console.log(`✅ Escrow detail retrieved (status: ${detail?.data?.status})`);

  const list = await httpRequest('get', '/escrow?limit=5', USER_TOKEN);
  console.log(`✅ Retrieved escrow list (count: ${list?.data?.transactions?.length ?? 0})`);

  if (ADMIN_TOKEN) {
    const stats = await httpRequest('get', '/escrow/stats/overview', ADMIN_TOKEN);
    console.log(`✅ Escrow stats overview total transactions: ${stats?.data?.overview?.totalTransactions ?? 0}`);
  }
}

(async () => {
  console.log('Starting notifications & escrow integration script');
  console.log(`Base URL: ${BASE_URL}`);
  try {
    await runNotificationFlow();
    await runEscrowFlow();
    console.log('\n🎉 All targeted notification & escrow tests passed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
})();
