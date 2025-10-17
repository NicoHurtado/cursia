import { NextRequest, NextResponse } from 'next/server';
import { WOMPI_CONFIG } from '@/lib/wompi';

export async function GET(request: NextRequest) {
  try {
    // Solo devolver la clave pública (segura para el cliente)
    return NextResponse.json({
      publicKey: WOMPI_CONFIG.publicKey,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });
  } catch (error) {
    console.error('Error getting payment config:', error);
    return NextResponse.json(
      { error: 'Failed to get payment configuration' },
      { status: 500 }
    );
  }
}

