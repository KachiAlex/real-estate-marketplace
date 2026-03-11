const axiosModule = require('axios');

const resolveAxios = (mod) => {
  let current = mod;
  while (current && current.default && current !== current.default) {
    current = current.default;
  }
  return current;
};

const axios = resolveAxios(axiosModule);
const { resolveApiBaseUrl } = require('../utils/apiConfig');

const createRefreshFunction = (baseUrl) => {
  const resolvedBase = resolveApiBaseUrl(baseUrl);
  const endpoints = [
    `${resolvedBase}/api/auth/jwt/refresh`,
    `${resolvedBase}/api/auth/refresh`
  ];

  return async (refreshToken) => {
    if (!refreshToken) return null;

    for (const url of endpoints) {
      try {
        const response = await axios.post(url, { refreshToken }, { withCredentials: true });
        if (response?.data) {
          return response.data;
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status && status !== 404) {
          // For non-404 errors we still attempt the remaining endpoints once
          continue;
        }
      }
    }

    return null;
  };
};

module.exports = {
  createRefreshFunction
};
