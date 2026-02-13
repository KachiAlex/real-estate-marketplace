// backend/models/Message.js
const { db } = require('../config/firestore');

const COLLECTION = 'messages';

const MessageModel = {
  async saveMessage(msg) {
    const ref = db.collection(COLLECTION).doc(msg.id);
    await ref.set(msg);
    return msg;
  },
  async getMessagesBetween(userA, userB, limit = 50) {
    // Query for messages where (from==userA && to==userB) OR (from==userB && to==userA)
    const snapshot = await db.collection(COLLECTION)
      .where('participants', 'array-contains', userA)
      .orderBy('timestamp', 'asc')
      .limit(limit)
      .get();
    return snapshot.docs
      .map(doc => doc.data())
      .filter(msg => (msg.from === userA && msg.to === userB) || (msg.from === userB && msg.to === userA));
  }
};

module.exports = MessageModel;
