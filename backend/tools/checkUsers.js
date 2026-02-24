#!/usr/bin/env node
/*
  Simple script to check recent users via Sequelize models.
  Usage:
    node tools/checkUsers.js            # lists 10 most recent users
    node tools/checkUsers.js email@x.y  # shows the user with that email
 */

const path = require('path');

// Ensure working dir is backend
process.chdir(path.resolve(__dirname, '..'));

const db = require('../config/sequelizeDb');

async function delay(ms){return new Promise(r=>setTimeout(r,ms));}

async function waitForConnection(timeoutMs = 30000){
  const start = Date.now();
  while(!db.isConnected && (Date.now() - start) < timeoutMs){
    process.stdout.write('.');
    await delay(1000);
  }
  if(!db.isConnected) return false;
  return true;
}

async function main(){
  process.stdout.write('Waiting for DB connection');
  const connected = await waitForConnection(30000);
  console.log('');
  if(!connected){
    console.warn('DB not connected after wait; attempting one-time authenticate...');
    try{
      await db.sequelize.authenticate();
      db.isConnected = true;
      console.log('Authenticated to DB');
    }catch(e){
      console.error('Failed to authenticate to DB:', e.message);
      process.exit(2);
    }
  }

  const args = process.argv.slice(2);
  if(args[0]){
    const email = args[0];
    const user = await db.User.findOne({ where: { email } });
    if(!user){
      console.log('No user found for', email);
      process.exit(0);
    }
    console.log(JSON.stringify(user.get({ plain: true }), null, 2));
    process.exit(0);
  }

  const users = await db.User.findAll({ limit: 10, order: [['createdAt','DESC']] });
  const plain = users.map(u => u.get ? u.get({ plain: true }) : u);
  console.log(JSON.stringify(plain, null, 2));
  process.exit(0);
}

main().catch(e => { console.error('Error in checkUsers:', e); process.exit(1); });
