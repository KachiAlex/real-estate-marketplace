#!/usr/bin/env node
/*
  Migration: Normalize `publishedAt` in `blogs` collection to Firestore Timestamps.
  Usage:
    # Locally (with GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY set):
    node backend/scripts/migrate-publishedAt.js

  Notes:
  - Script uses existing backend `config/firestore.js` to initialize admin SDK.
  - It updates docs in batches (500) and sets `updatedAt` to serverTimestamp.
*/

const { getFirestore, admin } = require('../config/firestore');

const COLLECTION = 'blogs';
const BATCH_SIZE = 500;

function parseToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // If it's an object that has toDate, try calling it
  if (typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      return d instanceof Date ? d : null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function run() {
  console.log('Starting migration: normalize publishedAt → Firestore Timestamp');
  const db = getFirestore();
  if (!db) {
    console.error('Firestore not initialized; set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS');
    process.exit(1);
  }

  const snapshot = await db.collection(COLLECTION).get();
  console.log(`Found ${snapshot.size} documents in ${COLLECTION}`);

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const raw = data.publishedAt;

    // If it's already a Firestore Timestamp object with toDate, skip
    if (raw && typeof raw.toDate === 'function') {
      skipped++;
      continue;
    }

    const parsed = parseToDate(raw);
    if (!parsed) {
      skipped++;
      continue;
    }

    const ref = db.collection(COLLECTION).doc(doc.id);
    batch.update(ref, {
      publishedAt: admin.firestore.Timestamp.fromDate(parsed),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    ops++;
    updated++;

    if (ops >= BATCH_SIZE) {
      await batch.commit();
      console.log(`Committed batch of ${ops} updates`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${ops} updates`);
  }

  console.log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(2);
});
