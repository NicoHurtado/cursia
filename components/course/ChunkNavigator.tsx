'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  BookOpen,
  Clock
} from 'lucide-react';

interface Chunk {
  id: string;
  chunkOrder: number;
  title: string;
  content: string;
}

interface ChunkNavigatorProps {
  chunks: Chunk[];
  currentChunkOrder: number;
  completedChunks: string[];
  onChunkChange: (chunkOrder: number) => void;
  onTakeQuiz?: () => void;
  allChunksCompleted?: boolean;
  className?: string;
}

export function ChunkNavigator({
  chunks,
  currentChunkOrder,
  completedChunks,
  onChunkChange,
  onTakeQuiz,
  allChunksCompleted = false,
  className
}: ChunkNavigatorProps) {
  const currentChunk = chunks.find(chunk => chunk.chunkOrder === currentChunkOrder);
  const currentChunkIndex = chunks.findIndex(chunk => chunk.chunkOrder === currentChunkOrder);
  const isCurrentChunkCompleted = currentChunk ? completedChunks.includes(currentChunk.id) : false;

  const handlePrevious = () => {
    if (currentChunkIndex > 0) {
      onChunkChange(chunks[currentChunkIndex - 1].chunkOrder);
    }
  };

  const handleNext = () => {
    if (currentChunkIndex < chunks.length - 1) {
      onChunkChange(chunks[currentChunkIndex + 1].chunkOrder);
    }
  };


  return (
    <div className={cn("space-y-4", className)}>
      {/* Chunk List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Lecciones del Módulo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {chunks.map((chunk) => {
              const isCompleted = completedChunks.includes(chunk.id);
              const isCurrent = chunk.chunkOrder === currentChunkOrder;
              
              return (
                <div
                  key={chunk.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    "hover:bg-muted/50",
                    isCurrent && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
                    isCompleted && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  )}
                  onClick={() => onChunkChange(chunk.chunkOrder)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={isCurrent ? "default" : "outline"}
                          className="text-xs"
                        >
                          {chunk.chunkOrder}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="secondary" className="text-xs">
                            Completado
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-sm leading-relaxed">
                        {chunk.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Current Chunk Info */}
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                Lección {currentChunkOrder} de {chunks.length}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentChunkIndex === 0}
                className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 hover:border-blue-200 transition-colors flex-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentChunkIndex === chunks.length - 1}
                className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 hover:border-blue-200 transition-colors flex-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Section */}
      {allChunksCompleted && onTakeQuiz && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 text-green-600">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-lg">¡Módulo Completado!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                Has completado todas las lecciones de este módulo. 
                Ahora puedes tomar el quiz para evaluar tu conocimiento.
              </p>
              <Button
                onClick={onTakeQuiz}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Tomar Quiz del Módulo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}