// Minimal Firebase shim for tests and local dev where full Firebase isn't configured.
// Tests often mock this module; providing a harmless default export prevents resolver errors.

export const storage = {
  ref: () => ({
    child: () => ({
      put: async () => ({ state: 'mocked' })
    })
  })
};

export const db = {};

export const auth = {
  currentUser: null
};

export default { storage, db, auth };
