#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Google Services JSON from environment variable...');

// Get the base64 encoded Google Services JSON from environment variable
const base64GoogleServices = process.env.GOOGLE_SERVICES_JSON;

if (!base64GoogleServices) {
  console.log('⚠️  GOOGLE_SERVICES_JSON environment variable not set, skipping...');
  process.exit(0);
}

try {
  // Decode base64 to string
  const googleServicesJson = Buffer.from(base64GoogleServices, 'base64').toString('utf8');
  
  // Write to google-services.json file in project root
  const outputPath = path.join(__dirname, '..', 'google-services.json');
  fs.writeFileSync(outputPath, googleServicesJson);
  
  console.log('✅ Successfully decoded and wrote google-services.json');
  console.log('📁 File location:', outputPath);
} catch (error) {
  console.error('❌ Error decoding Google Services JSON:', error);
  console.log('⚠️  Continuing build without google-services.json...');
  process.exit(0); // Changed from exit(1) to exit(0) - don't fail the build
}

