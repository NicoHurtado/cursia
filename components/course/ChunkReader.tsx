'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, User, CheckCircle2, Play, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Chunk {
  id: string;
  chunkOrder: number;
  title: string;
  content: string;
  videoData?: string | null;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  publishedAt: string;
  embedUrl: string;
}

interface ChunkReaderProps {
  chunk: Chunk;
  isCompleted?: boolean;
  isMarkingComplete?: boolean;
  onMarkComplete?: (chunkId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  courseTopic?: string;
  className?: string;
}

export function ChunkReader({ 
  chunk, 
  isCompleted = false, 
  isMarkingComplete = false, 
  onMarkComplete,
  onPrevious,
  onNext,
  canGoPrevious = false,
  canGoNext = false,
  courseTopic = '',
  className 
}: ChunkReaderProps) {
  // Check if this is the second lesson of a module
  const isSecondLesson = chunk.chunkOrder === 2;

  // Parse video data from chunk
  const video: YouTubeVideo | null = chunk.videoData ? JSON.parse(chunk.videoData) : null;
  return (
    <div className={cn("space-y-6", className)}>
      {/* Chunk Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Lección {chunk.chunkOrder}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~5 min lectura
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold leading-tight">
            {chunk.title}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Video Section - Only for second lesson */}
      {isSecondLesson && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5" />
              Video Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {video ? (
              <VideoPlayer video={video} />
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">
                  <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay video disponible para esta lección</p>
                  <p className="text-sm">El video se genera automáticamente durante la creación del curso</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chunk Content */}
      <Card>
        <CardContent className="p-6">
          <MarkdownRenderer content={chunk.content} />
        </CardContent>
      </Card>

      {/* Navigation Buttons - Large Center Buttons */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-6">
            {/* Previous Button */}
            {canGoPrevious && onPrevious && (
              <Button
                variant="outline"
                size="lg"
                onClick={onPrevious}
                className="flex items-center gap-3 px-8 py-4 text-lg font-medium hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 min-w-[160px]"
              >
                <ChevronLeft className="h-5 w-5" />
                Anterior
              </Button>
            )}

            {/* Next Button */}
            {canGoNext && onNext && (
              <Button
                onClick={onNext}
                disabled={isMarkingComplete}
                className="flex items-center gap-3 px-8 py-4 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 min-w-[160px] shadow-lg hover:shadow-xl"
              >
                {isMarkingComplete ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Completando...
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            )}

            {/* Mark Complete Button (only if no next button) */}
            {!canGoNext && !isCompleted && onMarkComplete && (
              <Button
                onClick={() => onMarkComplete(chunk.id)}
                disabled={isMarkingComplete}
                className="flex items-center gap-3 px-8 py-4 text-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-all duration-200 min-w-[160px] shadow-lg hover:shadow-xl"
              >
                {isMarkingComplete ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Completando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Completar Lección
                  </>
                )}
              </Button>
            )}

            {/* Completion Status */}
            {isCompleted && (
              <div className="flex items-center gap-3 px-8 py-4 text-lg font-medium bg-green-600 text-white rounded-lg shadow-lg min-w-[160px] justify-center">
                <CheckCircle2 className="h-5 w-5" />
                ¡Completada!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}