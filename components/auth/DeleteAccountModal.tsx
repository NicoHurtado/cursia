'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'Borrar') {
      toast({
        title: 'Error',
        description: 'Debes escribir exactamente "Borrar" para confirmar',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la cuenta');
      }

      toast({
        title: 'Cuenta eliminada',
        description: 'Tu cuenta ha sido eliminada exitosamente',
      });

      // Sign out and redirect to landing page
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Error al eliminar la cuenta',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-red-900 dark:text-red-100">
                Eliminar Cuenta
              </DialogTitle>
              <DialogDescription className="text-red-700 dark:text-red-300">
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  ¿Estás seguro de que quieres eliminar tu cuenta?
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  <li>• Se eliminarán todos tus cursos y progreso</li>
                  <li>• Se perderán todos tus certificados</li>
                  <li>• Esta acción es permanente e irreversible</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmation"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Para confirmar, escribe{' '}
              <span className="font-bold text-red-600">Borrar</span>:
            </label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={e => setConfirmationText(e.target.value)}
              placeholder="Escribe 'Borrar' aquí"
              className="border-red-200 focus:border-red-400 focus:ring-red-400"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={confirmationText !== 'Borrar' || isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Cuenta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
