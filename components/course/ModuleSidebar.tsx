'use client';

import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Module {
  id: string;
  moduleOrder: number;
  title: string;
  description: string;
  chunks: Array<{
    id: string;
    chunkOrder: number;
    title: string;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
  }>;
  isGenerated?: boolean; // Indica si el módulo ya está generado con contenido completo
}

interface ModuleSidebarProps {
  modules: Module[];
  currentModuleOrder: number;
  currentChunkOrder: number;
  completedChunks: string[];
  completedModules: string[];
  quizAttempts: any[];
  onModuleChange: (moduleOrder: number) => void;
  onChunkChange: (moduleOrder: number, chunkOrder: number) => void;
  moduleGenerationStatus?: any;
  className?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
}

export function ModuleSidebar({
  modules,
  currentModuleOrder,
  currentChunkOrder,
  completedChunks,
  completedModules,
  quizAttempts,
  onModuleChange,
  onChunkChange,
  moduleGenerationStatus,
  className,
  width = 400,
  onWidthChange,
}: ModuleSidebarProps) {
  // Mantener todos los módulos expandidos por defecto para facilitar la navegación
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(
    new Set()
  );

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Función para alternar el estado de colapso de un módulo
  const toggleModuleCollapse = (moduleOrder: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleOrder)) {
        newSet.delete(moduleOrder);
      } else {
        newSet.add(moduleOrder);
      }
      return newSet;
    });
  };

  // Función para manejar el redimensionamiento
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Efecto para manejar el arrastre
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onWidthChange) return;

      const newWidth = e.clientX;
      const minWidth = 300;
      const maxWidth = 600;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  // Función para verificar si un módulo está desbloqueado
  const isModuleUnlocked = (moduleOrder: number) => {
    // El módulo 1 siempre está desbloqueado
    if (moduleOrder === 1) return true;

    // Para módulos 2+, verificar que el módulo anterior esté completado (incluyendo quiz)
    const previousModule = modules.find(m => m.moduleOrder === moduleOrder - 1);
    if (!previousModule) return false;

    // Verificar si el módulo anterior está completado
    const previousModuleCompleted = completedModules.includes(
      previousModule.id
    );

    // Verificar si el quiz del módulo anterior fue aprobado
    const previousModuleQuizPassed = quizAttempts.some(
      (attempt: any) =>
        attempt.moduleId === previousModule.id && attempt.passed === true
    );

    return previousModuleCompleted && previousModuleQuizPassed;
  };

  const getModuleStatus = (module: Module) => {
    const totalChunks = module.chunks.length;
    const completedModuleChunks = module.chunks.filter(chunk =>
      completedChunks.includes(chunk.id)
    ).length;

    // Verificar si el módulo está generado según el estado de generación
    const moduleGenStatus = moduleGenerationStatus?.moduleStatus?.find(
      (m: any) => m.moduleOrder === module.moduleOrder
    );
    const isModuleGenerated = moduleGenStatus?.isComplete || totalChunks > 0;

    // Si el módulo no tiene contenido (chunks) y no está generado, está en generación
    if (totalChunks === 0 && !isModuleGenerated) {
      return 'generating';
    }

    // Verificar si el módulo está desbloqueado
    const isUnlocked = isModuleUnlocked(module.moduleOrder);

    // Si no está desbloqueado, está bloqueado
    if (!isUnlocked) return 'locked';

    // PRIORIDAD 1: Si todas las lecciones del módulo están completadas, siempre es 'completed'
    if (totalChunks > 0 && completedModuleChunks === totalChunks) {
      console.log(
        `Module ${module.moduleOrder} is fully completed (${completedModuleChunks}/${totalChunks})`
      );
      return 'completed';
    }

    // Si está desbloqueado y es el módulo actual
    if (module.moduleOrder === currentModuleOrder) {
      return 'in-progress';
    }

    // Si está desbloqueado pero no es el actual
    return 'available';
  };

  const getChunkStatus = (chunkId: string) => {
    return completedChunks.includes(chunkId) ? 'completed' : 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'available':
        return <Play className="h-4 w-4 text-blue-500" />; // Disponible para acceder
      case 'generating':
        return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'generated-locked':
        return <Lock className="h-4 w-4 text-blue-500" />; // Candado azul
      case 'locked':
        return <Lock className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-300 bg-green-100 dark:bg-green-900/30 dark:border-green-700'; // Verde suave más visible
      case 'in-progress':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800';
      case 'available':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'; // Disponible para acceder
      case 'generating':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700'; // Naranja para generación
      case 'generated-locked':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'; // Fondo azul claro
      case 'locked':
        return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'; // Sin color de fondo
      default:
        return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'; // Sin color de fondo
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'bg-background border-r border-border relative flex flex-col h-full',
        className
      )}
      style={{ width: `${width}px` }}
    >
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Contenido del Curso
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="space-y-2 p-4">
          {modules.map(module => {
            const status = getModuleStatus(module);
            const isExpanded = !collapsedModules.has(module.moduleOrder);
            const isCurrentModule = currentModuleOrder === module.moduleOrder;
            const isUnlocked = isModuleUnlocked(module.moduleOrder);
            const totalChunks = module.chunks.length;
            const completedChunksCount = module.chunks.filter(chunk =>
              completedChunks.includes(chunk.id)
            ).length;
            const progressPercentage =
              totalChunks > 0 ? (completedChunksCount / totalChunks) * 100 : 0;

            // Determinar el mensaje de bloqueo
            let lockMessage = '';
            if (!isUnlocked && module.moduleOrder > 1) {
              const previousModule = modules.find(
                m => m.moduleOrder === module.moduleOrder - 1
              );
              const previousModuleQuizPassed =
                previousModule &&
                quizAttempts.some(
                  (attempt: any) =>
                    attempt.moduleId === previousModule.id &&
                    attempt.passed === true
                );

              if (!previousModuleQuizPassed) {
                lockMessage = `Completa el quiz del Módulo ${module.moduleOrder - 1} para desbloquear`;
              } else {
                lockMessage = `Completa todas las lecciones del Módulo ${module.moduleOrder - 1} para desbloquear`;
              }
            }

            return (
              <Card
                key={module.id}
                className={cn(
                  'transition-all duration-200',
                  getStatusColor(status),
                  isCurrentModule && 'ring-2 ring-blue-500 ring-offset-2',
                  isUnlocked ? 'cursor-pointer hover:shadow-md' : 'opacity-60'
                )}
                onClick={() => {
                  // Navegar al módulo solo si está desbloqueado
                  if (isUnlocked) {
                    onModuleChange(module.moduleOrder);
                  }
                }}
              >
                <CardContent className="p-4 relative">
                  {/* Indicador de generación (punto azul) - se actualiza en tiempo real */}
                  {(() => {
                    const moduleGenStatus =
                      moduleGenerationStatus?.moduleStatus?.find(
                        (m: any) => m.moduleOrder === module.moduleOrder
                      );
                    const isGenerated =
                      moduleGenStatus?.isGenerated || module.isGenerated;

                    return (
                      isGenerated && (
                        <div
                          className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full border border-blue-600"
                          title="Módulo generado con contenido completo"
                        />
                      )
                    );
                  })()}

                  {/* Module Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(status)}
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          Módulo {module.moduleOrder}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {module.title}
                        </p>
                        {/* Mensaje de generación */}
                        {status === 'generating' && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 animate-pulse" />
                            Generando contenido...
                          </p>
                        )}
                        {/* Mensaje de bloqueo */}
                        {!isUnlocked &&
                          status !== 'generating' &&
                          lockMessage && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {lockMessage}
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {completedChunksCount}/{totalChunks}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        onClick={e =>
                          toggleModuleCollapse(module.moduleOrder, e)
                        }
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200',
                            isExpanded ? 'rotate-180' : ''
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Module Content (Expanded) */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {/* Chunks */}
                      <div className="space-y-1">
                        {module.chunks.map(chunk => {
                          const chunkStatus = getChunkStatus(chunk.id);
                          const isCurrentChunk =
                            isCurrentModule &&
                            currentChunkOrder === chunk.chunkOrder;

                          return (
                            <div
                              key={chunk.id}
                              className={cn(
                                'flex items-center gap-2 p-3 rounded-lg text-xs transition-all duration-200',
                                'border border-transparent',
                                isUnlocked &&
                                  'cursor-pointer hover:bg-blue-100 hover:shadow-md hover:scale-[1.02] hover:border-blue-300',
                                isUnlocked && 'hover:border-blue-200',
                                isCurrentChunk &&
                                  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 shadow-md',
                                chunkStatus === 'completed' &&
                                  'text-green-700 dark:text-green-400',
                                chunkStatus === 'completed' &&
                                  isUnlocked &&
                                  'hover:bg-green-100',
                                !isUnlocked &&
                                  'opacity-40 cursor-not-allowed relative'
                              )}
                              onClick={e => {
                                e.stopPropagation();
                                if (isUnlocked) {
                                  onChunkChange(
                                    module.moduleOrder,
                                    chunk.chunkOrder
                                  );
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-shrink-0">
                                  {!isUnlocked ? (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  ) : chunkStatus === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : isCurrentChunk ? (
                                    <Play className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-500 text-xs">
                                      {chunk.chunkOrder}.
                                    </span>
                                    <span className="font-medium text-sm line-clamp-1">
                                      {chunk.title}
                                    </span>
                                  </div>
                                  {isCurrentChunk && (
                                    <div className="text-xs text-blue-600 font-medium mt-1">
                                      Lección actual
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quiz */}
                      {module.quizzes.length > 0 && (
                        <div
                          className={cn(
                            'pt-2 border-t border-border',
                            !isUnlocked && 'opacity-40'
                          )}
                        >
                          <div className="flex items-center gap-2 p-2 rounded-md text-xs">
                            {!isUnlocked ? (
                              <Lock className="h-3 w-3 text-gray-400" />
                            ) : (
                              <Clock className="h-3 w-3 text-orange-500" />
                            )}
                            <span className="font-medium">Quiz del Módulo</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Handle de redimensionamiento */}
      {onWidthChange && (
        <div
          className="absolute top-0 right-0 w-1 h-full bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}
