// Minimal Firebase client stubs for tests/development
export const auth = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
};

export const storage = {
  ref: () => ({
    child: () => ({
      put: async () => ({}),
    }),
  }),
};

export const db = {};

export default {
  auth,
  storage,
  db,
};
