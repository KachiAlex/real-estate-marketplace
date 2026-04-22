/**
 * Cleanup script to remove temp uploaded files older than threshold
 * Usage: node backend/scripts/cleanupTempUploads.js [hours]
 */
const fs = require('fs').promises;
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'temp');
const hoursArg = parseInt(process.argv[2], 10) || 24;
const thresholdMs = hoursArg * 60 * 60 * 1000;

async function run() {
  try {
    const files = await fs.readdir(uploadsDir);
    const now = Date.now();
    let removed = 0;
    for (const f of files) {
      try {
        const full = path.join(uploadsDir, f);
        const st = await fs.stat(full);
        if (now - st.mtimeMs > thresholdMs) {
          await fs.unlink(full);
          removed++;
          console.log('Removed', full);
        }
      } catch (e) {
        console.warn('Error checking file', f, e.message);
      }
    }
    console.log(`Cleanup complete. Removed ${removed} files older than ${hoursArg} hours.`);
  } catch (e) {
    console.error('Cleanup failed', e);
    process.exit(1);
  }
}

run();
