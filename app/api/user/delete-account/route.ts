import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  // Account deletion is disabled
  return NextResponse.json(
    { 
      error: 'La eliminación de cuentas está deshabilitada temporalmente',
      message: 'Esta funcionalidad no está disponible en este momento'
    },
    { status: 403 }
  );
}
