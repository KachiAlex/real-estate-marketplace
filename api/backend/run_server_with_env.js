#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const dbUrl = process.argv[2];
const dbRequireSsl = process.argv[3] === 'true';
const dbRejectUnauthorized = process.argv[4] !== 'false';

if (!dbUrl) {
  console.error('Usage: node run_server_with_env.js "<DATABASE_URL>" <DB_REQUIRE_SSL:true|false> <DB_REJECT_UNAUTHORIZED:true|false>');
  process.exit(1);
}

const env = Object.assign({}, process.env, {
  DATABASE_URL: dbUrl,
  DB_REQUIRE_SSL: dbRequireSsl ? 'true' : 'false',
  DB_REJECT_UNAUTHORIZED: dbRejectUnauthorized ? 'true' : 'false'
});

const serverPath = path.join(__dirname, 'server.js');

const child = spawn(process.execPath, [serverPath], {
  env,
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit']
});

child.unref();
console.log('Started server.js as PID', child.pid);
