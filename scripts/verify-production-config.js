#!/usr/bin/env node

/**
 * Script de Verificación de Configuración de Producción
 * 
 * Este script verifica que todas las variables de entorno necesarias
 * estén configuradas correctamente antes de desplegar a producción.
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvVar(varName, required = true, prefix = null) {
  const value = process.env[varName];
  
  if (!value || value === '' || value === 'undefined') {
    if (required) {
      log(`  ❌ ${varName} - NO CONFIGURADA`, colors.red);
      return false;
    } else {
      log(`  ⚠️  ${varName} - Opcional, no configurada`, colors.yellow);
      return true;
    }
  }
  
  // Verificar prefijo si se especifica
  if (prefix && !value.startsWith(prefix)) {
    log(`  ⚠️  ${varName} - Configurada pero no tiene el prefijo esperado "${prefix}"`, colors.yellow);
    return false;
  }
  
  log(`  ✅ ${varName} - Configurada`, colors.green);
  return true;
}

function verifyWompiConfig() {
  log('\n📝 Verificando Configuración de Wompi...', colors.cyan);
  
  const wompiEnv = process.env.WOMPI_ENV;
  const nodeEnv = process.env.NODE_ENV;
  
  log(`\n  Ambiente: ${wompiEnv || 'sandbox'} (NODE_ENV: ${nodeEnv || 'development'})`, colors.blue);
  
  if (wompiEnv === 'production') {
    log('  ⚠️  MODO PRODUCCIÓN - Usando claves reales', colors.yellow);
  } else {
    log('  ℹ️  MODO SANDBOX - Usando claves de prueba', colors.cyan);
  }
  
  let allValid = true;
  
  // Verificar claves de Wompi
  if (wompiEnv === 'production') {
    allValid &= checkEnvVar('WOMPI_PUBLIC_KEY', true, 'pub_prod_');
    allValid &= checkEnvVar('WOMPI_PRIVATE_KEY', true, 'prv_prod_');
  } else {
    allValid &= checkEnvVar('WOMPI_PUBLIC_KEY', true, 'pub_test_');
    allValid &= checkEnvVar('WOMPI_PRIVATE_KEY', true, 'prv_test_');
  }
  
  allValid &= checkEnvVar('WOMPI_EVENTS_SECRET', true);
  allValid &= checkEnvVar('WOMPI_ACCEPTANCE_TOKEN', true);
  
  return allValid;
}

function verifyDatabaseConfig() {
  log('\n🗄️  Verificando Configuración de Base de Datos...', colors.cyan);
  
  const allValid = checkEnvVar('DATABASE_URL', true);
  
  // Verificar que el archivo de schema existe
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    log('  ✅ Schema de Prisma encontrado', colors.green);
    
    // Verificar que el schema incluye el campo paymentMethodToken
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    if (schemaContent.includes('paymentMethodToken')) {
      log('  ✅ Campo paymentMethodToken presente en el schema', colors.green);
    } else {
      log('  ❌ Campo paymentMethodToken NO encontrado en el schema', colors.red);
      log('     Ejecuta: npx prisma migrate deploy', colors.yellow);
      return false;
    }
  } else {
    log('  ❌ Schema de Prisma no encontrado', colors.red);
    return false;
  }
  
  return allValid;
}

function verifyAuthConfig() {
  log('\n🔐 Verificando Configuración de Autenticación...', colors.cyan);
  
  let allValid = true;
  allValid &= checkEnvVar('NEXTAUTH_URL', true);
  allValid &= checkEnvVar('NEXTAUTH_SECRET', true);
  
  return allValid;
}

function verifyAIConfig() {
  log('\n🤖 Verificando Configuración de IA...', colors.cyan);
  
  const allValid = checkEnvVar('ANTHROPIC_API_KEY', true, 'sk-ant-');
  
  return allValid;
}

function verifyOptionalConfig() {
  log('\n📧 Verificando Configuración Opcional...', colors.cyan);
  
  checkEnvVar('RESEND_API_KEY', false);
  
  return true;
}

function verifyWebhookEndpoint() {
  log('\n🔗 Verificando Endpoint de Webhook...', colors.cyan);
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  if (!nextAuthUrl) {
    log('  ⚠️  No se puede verificar webhook sin NEXTAUTH_URL', colors.yellow);
    return false;
  }
  
  const webhookUrl = `${nextAuthUrl}/api/webhooks/wompi`;
  log(`  📍 URL del Webhook: ${webhookUrl}`, colors.blue);
  
  if (nextAuthUrl.startsWith('https://')) {
    log('  ✅ HTTPS habilitado', colors.green);
  } else if (nextAuthUrl.startsWith('http://localhost')) {
    log('  ⚠️  Localhost - Solo para desarrollo', colors.yellow);
  } else {
    log('  ❌ Se requiere HTTPS para producción', colors.red);
    return false;
  }
  
  log('\n  📌 Recuerda configurar este webhook en el Dashboard de Wompi:', colors.yellow);
  log(`     ${webhookUrl}`, colors.bright);
  
  return true;
}

function generateEnvTemplate() {
  log('\n📄 Generando plantilla de .env...', colors.cyan);
  
  const template = `# ============================================
# WOMPI CONFIGURATION
# ============================================

# Modo: "production" o "sandbox" (default: sandbox)
WOMPI_ENV=sandbox

# Claves de API de Wompi
# Producción: pub_prod_xxx / prv_prod_xxx
# Sandbox: pub_test_xxx / prv_test_xxx
WOMPI_PUBLIC_KEY=pub_test_XXXXXX
WOMPI_PRIVATE_KEY=prv_test_XXXXXX
WOMPI_EVENTS_SECRET=tu_secreto_de_webhooks_aqui
WOMPI_ACCEPTANCE_TOKEN=tu_token_de_aceptacion_aqui

# ============================================
# DATABASE
# ============================================

DATABASE_URL="file:./dev.db"

# ============================================
# AUTHENTICATION
# ============================================

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secreto-aleatorio-aqui

# ============================================
# AI CONFIGURATION
# ============================================

ANTHROPIC_API_KEY=sk-ant-XXXXXX

# ============================================
# OPTIONAL: EMAIL
# ============================================

RESEND_API_KEY=re_XXXXXX

# ============================================
# PRODUCTION SETTINGS
# ============================================

NODE_ENV=development
`;

  const envPath = path.join(__dirname, '..', '.env.example');
  fs.writeFileSync(envPath, template);
  
  log(`  ✅ Plantilla guardada en: .env.example`, colors.green);
  log(`     Copia este archivo a .env y completa los valores`, colors.blue);
}

function main() {
  log('='.repeat(60), colors.bright);
  log('  VERIFICACIÓN DE CONFIGURACIÓN DE PRODUCCIÓN - CURSIA', colors.bright);
  log('='.repeat(60), colors.bright);
  
  const checks = {
    wompi: verifyWompiConfig(),
    database: verifyDatabaseConfig(),
    auth: verifyAuthConfig(),
    ai: verifyAIConfig(),
    optional: verifyOptionalConfig(),
    webhook: verifyWebhookEndpoint(),
  };
  
  log('\n' + '='.repeat(60), colors.bright);
  log('  RESUMEN', colors.bright);
  log('='.repeat(60), colors.bright);
  
  const allPassed = Object.values(checks).every(check => check !== false);
  
  if (allPassed) {
    log('\n✅ TODAS LAS VERIFICACIONES PASARON', colors.green);
    log('   Tu aplicación está lista para producción!', colors.green);
    
    if (process.env.WOMPI_ENV === 'production') {
      log('\n⚠️  IMPORTANTE: Estás en MODO PRODUCCIÓN', colors.yellow);
      log('   - Los pagos serán REALES', colors.yellow);
      log('   - Verifica que todo funcione correctamente', colors.yellow);
      log('   - Monitorea los logs y webhooks', colors.yellow);
    }
  } else {
    log('\n❌ ALGUNAS VERIFICACIONES FALLARON', colors.red);
    log('   Revisa los errores arriba y corrige la configuración', colors.red);
    
    log('\n💡 Necesitas ayuda? Revisa:', colors.cyan);
    log('   - docs/DESPLIEGUE_PRODUCCION.md', colors.blue);
    log('   - docs/wompi-setup.md', colors.blue);
  }
  
  // Preguntar si quiere generar plantilla
  log('\n💾 Para generar una plantilla de .env.example, ejecuta:', colors.cyan);
  log('   node scripts/verify-production-config.js --generate-template', colors.blue);
  
  if (process.argv.includes('--generate-template')) {
    generateEnvTemplate();
  }
  
  log('');
  
  // Retornar código de salida
  process.exit(allPassed ? 0 : 1);
}

// Ejecutar
main();

