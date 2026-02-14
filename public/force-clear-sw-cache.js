// This script unregisters all service workers and clears all caches in the browser.
// Usage: Paste in browser console, or include as a script in your app for a one-click fix.

async function forceClearServiceWorkersAndCaches() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      try { await reg.unregister(); } catch (e) { /* ignore */ }
    }
  }
  if (window.caches && caches.keys) {
    const keys = await caches.keys();
    for (const key of keys) {
      try { await caches.delete(key); } catch (e) { /* ignore */ }
    }
  }
  // Optionally reload the page after clearing
  window.location.reload();
}

// Uncomment to run automatically on load:
// forceClearServiceWorkersAndCaches();