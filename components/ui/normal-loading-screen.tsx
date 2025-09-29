'use client';

import { Loader2 } from 'lucide-react';

interface NormalLoadingScreenProps {
  message?: string;
}

export function NormalLoadingScreen({
  message = 'Cargando...',
}: NormalLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">
            Por favor espera un momento...
          </p>
        </div>
      </div>
    </div>
  );
}
