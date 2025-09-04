'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Clock,
  Play,
  Lock
} from 'lucide-react';

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
}

interface ModuleSidebarProps {
  modules: Module[];
  currentModuleOrder: number;
  currentChunkOrder: number;
  completedChunks: string[];
  onModuleChange: (moduleOrder: number) => void;
  onChunkChange: (moduleOrder: number, chunkOrder: number) => void;
  className?: string;
}

export function ModuleSidebar({
  modules,
  currentModuleOrder,
  currentChunkOrder,
  completedChunks,
  onModuleChange,
  onChunkChange,
  className
}: ModuleSidebarProps) {
  const [expandedModule, setExpandedModule] = useState<number>(currentModuleOrder);

  const getModuleStatus = (module: Module) => {
    const totalChunks = module.chunks.length;
    const completedModuleChunks = module.chunks.filter(chunk => 
      completedChunks.includes(chunk.id)
    ).length;
    
    if (completedModuleChunks === 0) return 'locked';
    if (completedModuleChunks === totalChunks) return 'completed';
    return 'in-progress';
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
      case 'locked':
        return <Lock className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800';
      case 'in-progress':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800';
      case 'locked':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700';
      default:
        return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700';
    }
  };

  return (
    <div className={cn("w-80 bg-background border-r border-border", className)}>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Contenido del Curso
        </h2>
      </div>

      <div className="overflow-y-auto h-full pb-4">
        <div className="space-y-2 p-4">
          {modules.map((module) => {
            const status = getModuleStatus(module);
            const isExpanded = expandedModule === module.moduleOrder;
            const isCurrentModule = currentModuleOrder === module.moduleOrder;
            const totalChunks = module.chunks.length;
            const completedChunksCount = module.chunks.filter(chunk => 
              completedChunks.includes(chunk.id)
            ).length;
            const progressPercentage = totalChunks > 0 ? (completedChunksCount / totalChunks) * 100 : 0;

            return (
              <Card 
                key={module.id} 
                className={cn(
                  "transition-all duration-200 cursor-pointer",
                  getStatusColor(status),
                  isCurrentModule && "ring-2 ring-blue-500 ring-offset-2"
                )}
              >
                <CardContent className="p-4">
                  {/* Module Header */}
                  <div 
                    className="flex items-center justify-between mb-3"
                    onClick={() => {
                      setExpandedModule(isExpanded ? -1 : module.moduleOrder);
                      if (status !== 'locked') {
                        onModuleChange(module.moduleOrder);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(status)}
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          Módulo {module.moduleOrder}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {module.title}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {completedChunksCount}/{totalChunks}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedModule(isExpanded ? -1 : module.moduleOrder);
                        }}
                      >
                        <span className={cn(
                          "text-xs transition-transform",
                          isExpanded ? "rotate-180" : ""
                        )}>
                          ▼
                        </span>
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
                        {module.chunks.map((chunk) => {
                          const chunkStatus = getChunkStatus(chunk.id);
                          const isCurrentChunk = isCurrentModule && currentChunkOrder === chunk.chunkOrder;
                          
                          return (
                            <div
                              key={chunk.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md text-xs cursor-pointer transition-colors",
                                "hover:bg-muted/50",
                                isCurrentChunk && "bg-blue-100 dark:bg-blue-900/30",
                                chunkStatus === 'completed' && "text-green-700 dark:text-green-400"
                              )}
                              onClick={() => {
                                if (status !== 'locked') {
                                  onChunkChange(module.moduleOrder, chunk.chunkOrder);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {chunkStatus === 'completed' ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Circle className="h-3 w-3 text-gray-400" />
                                )}
                                <span className="font-medium">
                                  {chunk.chunkOrder}.
                                </span>
                                <span className="line-clamp-1">
                                  {chunk.title}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quiz */}
                      {module.quizzes.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center gap-2 p-2 rounded-md text-xs">
                            <Clock className="h-3 w-3 text-orange-500" />
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
    </div>
  );
}