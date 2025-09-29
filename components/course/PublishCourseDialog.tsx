'use client';

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
import { AlertTriangle, Users, Eye, Upload, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PublishCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  isPublished: boolean;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  isProcessing: boolean;
}

export function PublishCourseDialog({
  isOpen,
  onClose,
  courseTitle,
  isPublished,
  onPublish,
  onUnpublish,
  isProcessing,
}: PublishCourseDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const { toast } = useToast();

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      onClose();
      toast({
        title: 'Curso publicado',
        description: 'Tu curso ahora es visible para toda la comunidad.',
      });
    } catch (error) {
      console.error('Error publishing course:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al publicar el curso.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      await onUnpublish();
      onClose();
      toast({
        title: 'Curso despublicado',
        description: 'Tu curso ya no es visible en la comunidad.',
      });
    } catch (error) {
      console.error('Error unpublishing course:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al despublicar el curso.',
        variant: 'destructive',
      });
    } finally {
      setIsUnpublishing(false);
    }
  };

  const isLoading = isPublishing || isUnpublishing || isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isPublished ? (
              <EyeOff className="h-5 w-5 text-orange-500" />
            ) : (
              <Upload className="h-5 w-5 text-green-500" />
            )}
            <DialogTitle>
              {isPublished ? 'Despublicar Curso' : 'Publicar en Comunidad'}
            </DialogTitle>
          </div>
          <DialogDescription className="space-y-3">
            <p>
              <strong>"{courseTitle}"</strong>
            </p>
            {isPublished ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  ¿Estás seguro de que quieres despublicar este curso?
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium">Al despublicar:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• El curso ya no será visible en la comunidad</li>
                        <li>• Otros usuarios no podrán acceder al contenido</li>
                        <li>• Solo tú podrás ver el curso</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Al publicar este curso en la comunidad:
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Otras personas podrán:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• Ver tu curso en la sección de comunidad</li>
                        <li>• Acceder al contenido completo</li>
                        <li>• Tomar el curso y obtener certificados</li>
                        <li>• Dejar comentarios y calificaciones</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Eye className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">El curso será público:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>
                          • Visible para todos los usuarios de la plataforma
                        </li>
                        <li>• Aparecerá en búsquedas de la comunidad</li>
                        <li>• Podrás despublicarlo en cualquier momento</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          {isPublished ? (
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isUnpublishing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Despublicando...
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Despublicar Curso
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={isLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isPublishing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Publicar en Comunidad
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
