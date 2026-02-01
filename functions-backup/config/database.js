const mongoose = require('mongoose');

const connectDB = async () => {
  // Skip MongoDB connection if URI is not provided
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not set - skipping MongoDB connection');
    return null;
  }

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️ Some features requiring MongoDB may not work. Firestore is used for auth.');
    // Don't exit - allow server to start with Firestore-only mode
    return null;
  }
};

module.exports = connectDB;

