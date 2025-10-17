#!/usr/bin/env node

// Script to check NextAuth configuration
console.log('🔍 Checking NextAuth Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const optionalEnvVars = [
  'WOMPI_PUBLIC_KEY',
  'WOMPI_PRIVATE_KEY',
  'WOMPI_EVENTS_SECRET',
  'WOMPI_ACCEPTANCE_TOKEN',
];

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚠️  ${envVar}: NOT SET`);
  }
});

console.log('\n🔧 Configuration Recommendations:');
console.log('1. Set NEXTAUTH_SECRET in your environment variables');
console.log('2. Set NEXTAUTH_URL to your production domain');
console.log('3. Ensure all Wompi variables are set for payment functionality');

console.log('\n🚀 To generate NEXTAUTH_SECRET, run:');
console.log('openssl rand -base64 32');
