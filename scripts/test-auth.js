#!/usr/bin/env node

// Script to test authentication flow
const { execSync } = require('child_process');

console.log('🧪 Testing Authentication Flow...\n');

// Check if we can start the dev server
try {
  console.log('1. Starting development server...');
  const server = execSync('npm run dev', { 
    cwd: process.cwd(),
    stdio: 'pipe',
    timeout: 10000 
  });
  console.log('✅ Development server started successfully');
} catch (error) {
  console.log('❌ Failed to start development server:', error.message);
}

console.log('\n2. Environment variables check:');
const envVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.log(`❌ ${envVar}: Not set`);
  }
});

console.log('\n3. Next steps:');
console.log('   - Open http://localhost:3000/login');
console.log('   - Try to login with test credentials');
console.log('   - Check browser console for errors');
console.log('   - Check server logs for JWT/Session callbacks');
