// config/database.js — deprecated
// MongoDB/Mongoose support removed. This file retained for history only.
module.exports = async function connectDB() {
  console.warn('MongoDB support removed (deprecated)');
  return null;
};
