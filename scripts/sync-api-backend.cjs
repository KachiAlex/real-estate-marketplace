/**
 * Sync script: copies backend/ → api/backend/ and applies Vercel-specific patches.
 *
 * This ensures api/backend/ is NEVER manually edited. All changes go into backend/.
 * Run this before every commit, or add it as a pre-commit hook.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'backend');
const DST = path.resolve(__dirname, '..', 'api', 'backend');

// Files that should NOT be copied (Vercel-specific or generated)
const EXCLUDE = new Set([
  // Logs & temp files
  'server.log', 'backend.log', 'backend-foreground.log',
  'server_error.log', 'server_error.log.bak', 'request.log',
  // Audit / uploads
  'audit_logs', 'uploads', 'tmp',
  // Node modules (should be installed by Vercel)
  'node_modules',
]);

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyRecursive(src, dst) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(dstPath, { recursive: true });
      copyRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// ── 1. Wipe and re-copy ──
console.log('[sync-api-backend] Removing', DST);
rimraf(DST);
fs.mkdirSync(DST, { recursive: true });
console.log('[sync-api-backend] Copying', SRC, '→', DST);
copyRecursive(SRC, DST);

// ── 2. Apply Vercel-specific patches ──

// Patch 1: app.js — skip dotenv when VERCEL env is set
const appPath = path.join(DST, 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');
// Find "require('dotenv').config(...)" line and wrap it
const dotenvLine = appJs.match(/require\('dotenv'\)\.config\(\{[^}]+\}\);/);
if (dotenvLine) {
  const idx = appJs.indexOf(dotenvLine[0]);
  const preceding = appJs.substring(Math.max(0, idx - 80), idx);
  if (!preceding.includes('if (!process.env.VERCEL)')) {
    appJs = appJs.replace(
      dotenvLine[0],
      `if (!process.env.VERCEL) {\n  ${dotenvLine[0].trim()}\n}`
    );
    fs.writeFileSync(appPath, appJs, 'utf8');
    console.log('[sync-api-backend] Patched app.js for Vercel');
  }
}

// Patch 2: server.js — use simpler dotenv config
const serverPath = path.join(DST, 'server.js');
let serverJs = fs.readFileSync(serverPath, 'utf8');
// Replace complex multi-line dotenv block with simple one
const complexDotenv = serverJs.match(
  /const dotenv = require\('dotenv'\);[\s\S]*?\}\s*\}\);/
);
if (complexDotenv && !serverJs.includes("require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })") && serverJs.includes('dotenv.config({ path: backendEnvPath })')) {
  serverJs = serverJs.replace(
    complexDotenv[0],
    `require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });`
  );
  fs.writeFileSync(serverPath, serverJs, 'utf8');
  console.log('[sync-api-backend] Patched server.js for Vercel');
}

// Patch 3: Replace package.json with lightweight deps only
const pkgPath = path.join(DST, 'package.json');
const lightweightPkg = {
  name: 'propertyark-serverless-api',
  version: '1.0.0',
  dependencies: {
    pg: '^8.18.0',
    'pg-hstore': '^2.3.4',
    sequelize: '^6.37.7'
  }
};
fs.writeFileSync(pkgPath, JSON.stringify(lightweightPkg, null, 2) + '\n', 'utf8');
console.log('[sync-api-backend] Patched package.json for Vercel');

// ── 3. Write .gitignore inside api/backend so accidental edits are flagged ──
const gitignorePath = path.join(DST, '.gitignore');
fs.writeFileSync(
  gitignorePath,
  '# AUTO-GENERATED — DO NOT EDIT\n' +
  '# This directory is synced from backend/ by scripts/sync-api-backend.js\n' +
  '# Make all changes in backend/ instead.\n',
  'utf8'
);

console.log('[sync-api-backend] ✅ Sync complete. api/backend/ is now a fresh copy of backend/ with Vercel patches.');
