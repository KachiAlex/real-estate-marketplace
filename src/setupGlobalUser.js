// Early bootstrap: ensure a global `user` exists before other modules run.
// This file should be imported at the very top of `src/index.js`.
if (typeof window !== 'undefined') {
  try {
    if (!window.user) window.user = null;
    // Create a global variable binding `user` that reads from window.user
    try { (0, eval)('var user = window.user;'); } catch (e) { /* ignore */ }
  } catch (e) {
    // best-effort only
  }
}

export default null;
