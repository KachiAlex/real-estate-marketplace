/* global importScripts, firebase */
/*
  Firebase messaging service worker

  This file used to contain hard-coded Firebase config which exposed API keys
  in build artifacts. The project has migrated backend services off Firebase.

  Behaviour now:
  - Attempt to fetch runtime Firebase config from `/api/config/firebase`.
  - If config is returned, load Firebase scripts and initialize messaging.
  - Otherwise, act as a no-op service worker for messaging to avoid runtime errors
    and to ensure no secrets are embedded at build time.
*/

const FIREBASE_CONFIG_ENDPOINT = '/api/config/firebase';

async function tryInitFirebaseMessaging() {
  try {
    const resp = await fetch(FIREBASE_CONFIG_ENDPOINT, { method: 'GET', cache: 'no-store' });
    if (!resp.ok) return;
    const cfg = await resp.json();
    if (!cfg || !cfg.apiKey) return;

    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

    // Initialize Firebase with runtime config
    try {
      firebase.initializeApp(cfg);
      const messaging = firebase.messaging();
      messaging.onBackgroundMessage(function(payload) {
        const { title, body } = payload.notification || {};
        const notificationTitle = title || 'PROPERTY ARK';
        const notificationOptions = { body: body || '', icon: '/logo192.png' };
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    } catch (e) {
      // initialization failed; swallow to avoid noisy errors in clients
      console.warn('Firebase messaging initialization skipped:', e && e.message);
    }
  } catch (err) {
    // fetch failed or endpoint absent - skip initializing messaging
    // This is expected if the project no longer uses Firebase for web push.
  }
}

// Run initialization but do not block service worker activation.
tryInitFirebaseMessaging();




