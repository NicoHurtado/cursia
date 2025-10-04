/**
 * Script para probar la integración con Wompi
 * Ejecutar con: node scripts/test-wompi-integration.js
 */

const https = require('https');

// Configuración de prueba
const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;

if (!WOMPI_PRIVATE_KEY) {
  console.error('❌ WOMPI_PRIVATE_KEY no está configurada');
  process.exit(1);
}

async function testWompiConnection() {
  console.log('🔍 Probando conexión con Wompi...');
  
  try {
    const response = await fetch(`${WOMPI_BASE_URL}/merchants/${WOMPI_PRIVATE_KEY}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión exitosa con Wompi');
      console.log('📊 Información del merchant:', {
        name: data.data.name,
        email: data.data.email,
        environment: data.data.environment
      });
    } else {
      console.error('❌ Error en la conexión:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

async function testWebhookEndpoint() {
  console.log('\n🔍 Probando endpoint de webhook...');
  
  const webhookUrl = process.env.NEXTAUTH_URL + '/api/webhooks/wompi';
  console.log('📡 URL del webhook:', webhookUrl);
  
  // Simular evento de webhook
  const testEvent = {
    event: 'transaction.created',
    data: {
      transaction: {
        id: 'test-transaction-123',
        status: 'APPROVED',
        amount_in_cents: 29900,
        reference: 'test-reference-123',
        customer_email: 'test@example.com',
        payment_method_type: 'CARD',
        created_at: new Date().toISOString()
      }
    }
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wompi-signature': 'test-signature'
      },
      body: JSON.stringify(testEvent)
    });
    
    if (response.ok) {
      console.log('✅ Endpoint de webhook responde correctamente');
    } else {
      console.log('⚠️  Endpoint de webhook responde con error:', response.status);
    }
  } catch (error) {
    console.log('⚠️  No se pudo probar el webhook (servidor no iniciado):', error.message);
  }
}

async function testDatabaseSchema() {
  console.log('\n🔍 Probando esquema de base de datos...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Probar conexión
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');
    
    // Verificar si las tablas existen
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('users', 'subscriptions')
    `;
    
    console.log('📊 Tablas encontradas:', tables.map(t => t.name));
    
    if (tables.some(t => t.name === 'subscriptions')) {
      console.log('✅ Tabla de suscripciones existe');
    } else {
      console.log('❌ Tabla de suscripciones no existe');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error con base de datos:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de integración con Wompi\n');
  
  await testWompiConnection();
  await testWebhookEndpoint();
  await testDatabaseSchema();
  
  console.log('\n📋 Resumen de configuración requerida:');
  console.log('1. Configurar variables de entorno en .env.local');
  console.log('2. Configurar webhooks en el dashboard de Wompi');
  console.log('3. Probar con tarjetas de prueba');
  console.log('4. Monitorear logs de webhooks');
  
  console.log('\n✅ Pruebas completadas');
}

main().catch(console.error);
