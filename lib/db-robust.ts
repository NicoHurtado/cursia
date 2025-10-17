import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Función para crear una nueva instancia de Prisma con configuración robusta
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configuración para manejar conexiones de larga duración
    errorFormat: 'pretty',
  });
}

// Función para reconectar si es necesario
async function ensureConnection(prisma: PrismaClient) {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed, attempting to reconnect...', error);
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('✅ Database reconnected successfully');
      return true;
    } catch (reconnectError) {
      console.error('❌ Failed to reconnect to database:', reconnectError);
      return false;
    }
  }
}

// Función wrapper para operaciones de base de datos con reconexión automática
export async function withDatabaseRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prisma = getPrismaClient();
      const isConnected = await ensureConnection(prisma);
      
      if (!isConnected) {
        throw new Error('Could not establish database connection');
      }
      
      return await operation(prisma);
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Esperar antes del siguiente intento (backoff exponencial)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Database operation failed after all retries');
}

// Función para obtener el cliente de Prisma (singleton)
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Exportar el cliente principal
export const db = getPrismaClient();

// Función de limpieza para shutdown graceful
export async function disconnectDatabase() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

// Manejar shutdown graceful
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });
}
