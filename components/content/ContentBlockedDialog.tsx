'use client';

import { AlertTriangle, Shield, Edit3, Home } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContentBlockedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onModifyPrompt: () => void;
  reason: string;
  category?: string;
}

export function ContentBlockedDialog({
  isOpen,
  onClose,
  onModifyPrompt,
  reason,
  category,
}: ContentBlockedDialogProps) {
  const [isModifying, setIsModifying] = useState(false);

  const handleModifyPrompt = () => {
    setIsModifying(true);
    onModifyPrompt();
    // Reset after a short delay
    setTimeout(() => setIsModifying(false), 1000);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'violence':
        return '⚔️';
      case 'drugs':
        return '💊';
      case 'sexual':
        return '🔞';
      case 'hate_speech':
        return '🚫';
      case 'self_harm':
        return '⚠️';
      case 'politics':
        return '🏛️';
      case 'fraud':
        return '💰';
      case 'cybersecurity':
        return '💻';
      case 'privacy':
        return '🔒';
      default:
        return '🛡️';
    }
  };

  const getCategoryTitle = (category?: string) => {
    switch (category) {
      case 'violence':
        return 'Contenido Violento';
      case 'drugs':
        return 'Sustancias Peligrosas';
      case 'sexual':
        return 'Contenido Sexual Inapropiado';
      case 'hate_speech':
        return 'Discurso de Odio';
      case 'self_harm':
        return 'Autolesiones';
      case 'politics':
        return 'Contenido Político Manipulativo';
      case 'fraud':
        return 'Estafas y Fraudes';
      case 'cybersecurity':
        return 'Ciberseguridad Maliciosa';
      case 'privacy':
        return 'Violación de Privacidad';
      default:
        return 'Contenido Restringido';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-400">
                Contenido Bloqueado
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {getCategoryIcon(category)} {getCategoryTitle(category)}
              </p>
            </div>
          </div>
          <DialogDescription className="text-left space-y-3">
            <div className="font-medium text-foreground">{reason}</div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Nuestra Política de Contenido
                  </div>
                  <div className="text-amber-700 dark:text-amber-300">
                    Cursia está comprometida con la seguridad y el bienestar de
                    nuestra comunidad. No permitimos contenido que pueda ser
                    dañino, ilegal o inmoral.
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al Dashboard
          </Button>
          <Button
            onClick={handleModifyPrompt}
            disabled={isModifying}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {isModifying ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Modificando...
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Modificar Prompt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
