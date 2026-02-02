#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the base64 encoded Google Services JSON from environment variable
const base64GoogleServices = process.env.GOOGLE_SERVICES_JSON;

if (!base64GoogleServices) {
  console.error('GOOGLE_SERVICES_JSON environment variable is not set');
  process.exit(1);
}

try {
  // Decode base64 to string
  const googleServicesJson = Buffer.from(base64GoogleServices, 'base64').toString('utf8');
  
  // Write to google-services.json file
  const outputPath = path.join(__dirname, '..', 'google-services.json');
  fs.writeFileSync(outputPath, googleServicesJson);
  
  console.log('Successfully decoded and wrote google-services.json');
} catch (error) {
  console.error('Error decoding Google Services JSON:', error);
  process.exit(1);
}
