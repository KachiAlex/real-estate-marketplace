#!/usr/bin/env node

/**
 * Import properties data to Neon database
 */

const { Client } = require('pg');
const fs = require('fs');

const NEON_DB_URL = process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_xUZQWBfyGt79@ep-noisy-resonance-am77s3ty-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const importProperties = async () => {
  const client = new Client(NEON_DB_URL);
  
  try {
    await client.connect();
    log('Connected to Neon database');
    
    // Read properties data directly from API
    const response = await fetch('http://localhost:5001/api/properties');
    const data = await response.json();
    const properties = data.data || [];
    
    log(`Found ${properties.length} properties to import`);
    
    for (const property of properties) {
      const query = `
        INSERT INTO properties (id, title, description, price, type, status, location, city, state, ownerid)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `;
      
      const values = [
        property.id,
        property.title,
        property.description,
        property.price,
        property.type || 'residential',
        property.status || 'active',
        JSON.stringify(property.location),
        property.city || property.location?.city,
        property.state || property.location?.state,
        property.ownerId || '550e8400-e29b-41d4-a716-446655440001'
      ];
      
      await client.query(query, values);
      log(`Imported property: ${property.title}`);
    }
    
    // Verify import
    const result = await client.query('SELECT COUNT(*) as count FROM properties');
    log(`Total properties in Neon: ${result.rows[0].count}`);
    
    log('Properties import completed successfully!');
    
  } catch (error) {
    log(`Import failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await client.end();
  }
};

if (require.main === module) {
  importProperties();
}

module.exports = { importProperties };
