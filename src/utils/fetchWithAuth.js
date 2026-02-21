import auth from './authToken';

export const fetchWithAuth = (url, options = {}) => {
  return auth.authenticatedFetch(url, options);
};

export default fetchWithAuth;
