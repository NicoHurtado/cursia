#!/usr/bin/env node

// Script to check database connection
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Checking Database Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL is not set');
  process.exit(1);
}

// Test database connection
async function testConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('\n🔌 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Query test successful - Users in database: ${userCount}`);
    
    // Test course query (the one that's failing)
    const courseCount = await prisma.course.count();
    console.log(`✅ Course query successful - Courses in database: ${courseCount}`);
    
    // Test chunk query (the specific one failing)
    const chunkCount = await prisma.chunk.count();
    console.log(`✅ Chunk query successful - Chunks in database: ${chunkCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('  Error code:', error.code);
    console.error('  Error message:', error.message);
    console.error('  Error meta:', error.meta);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 P1001 Error Solutions:');
      console.log('1. Check if Neon database is paused');
      console.log('2. Verify DATABASE_URL is correct');
      console.log('3. Check if database server is running');
      console.log('4. Verify network connectivity');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
