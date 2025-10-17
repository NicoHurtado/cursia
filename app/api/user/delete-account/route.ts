import { NextRequest, NextResponse } from 'next/server';

export async function DELETE() {
  // Account deletion is disabled
  return NextResponse.json(
    {
      error: 'La eliminación de cuentas está deshabilitada temporalmente',
      message: 'Esta funcionalidad no está disponible en este momento',
    },
    { status: 403 }
  );
}
