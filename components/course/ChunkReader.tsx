'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, User, CheckCircle2, Play, Loader2 } from 'lucide-react';
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
  courseTopic?: string;
  className?: string;
}

export function ChunkReader({ 
  chunk, 
  isCompleted = false, 
  isMarkingComplete = false, 
  onMarkComplete,
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

      {/* Reading Progress Indicator */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Has completado esta lección cuando marques el botón "Completado"</span>
          </div>
        </CardContent>
      </Card>

      {/* Mark Complete Button - Fixed Position */}
      {!isCompleted && onMarkComplete && (
        <div className="fixed bottom-6 right-6 z-10">
          <Button
            onClick={() => onMarkComplete(chunk.id)}
            disabled={isMarkingComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isMarkingComplete ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Marcando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Completado
              </>
            )}
          </Button>
        </div>
      )}

      {/* Completion Status - Fixed Position */}
      {isCompleted && (
        <div className="fixed bottom-6 right-6 z-10">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">¡Lección Completada!</span>
          </div>
        </div>
      )}
    </div>
  );
}