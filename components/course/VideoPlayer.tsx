'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  Clock,
  User,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

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

interface VideoPlayerProps {
  video: YouTubeVideo;
  className?: string;
}

export function VideoPlayer({ video, className }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (hasError) {
    return (
      <Card
        className={cn(
          'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Error al cargar el video</h3>
              <p className="text-sm text-red-500">
                No se pudo cargar el video. Por favor, inténtalo de nuevo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            Video Tutorial
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {video.duration}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{video.title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{video.channelTitle}</span>
          <span>•</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!isPlaying ? (
          <div className="relative group cursor-pointer" onClick={handlePlay}>
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>

            {/* Description */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {video.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando video...</span>
                </div>
              </div>
            )}

            {/* YouTube Embed */}
            <div className="aspect-video">
              <iframe
                src={video.embedUrl}
                title={video.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>

            {/* Video Actions */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Video de YouTube</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${video.id}`,
                      '_blank'
                    )
                  }
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir en YouTube
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
