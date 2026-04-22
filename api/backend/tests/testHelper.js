// Bootstrap test environment (stub auth, disable background services)
require('./setupTest');
const request = require('supertest');

// Lazy-load app to ensure NODE_ENV=test is set before server side effects run
let appInstance = null;
function getApp() {
  if (!appInstance) {
    appInstance = require('../server');
  }
  return appInstance;
}

module.exports = {
  request,
  get app() {
    return getApp();
  }
};
