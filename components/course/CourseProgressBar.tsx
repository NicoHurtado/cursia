'use client';

import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';

interface CourseProgressBarProps {
  completionPercentage: number;
  totalChunks?: number;
  completedChunks?: number;
}

export function CourseProgressBar({
  completionPercentage,
  totalChunks,
  completedChunks,
}: CourseProgressBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Progreso del curso</span>
          </div>

          <div className="flex-1">
            <Progress
              value={completionPercentage}
              className="h-2"
              aria-label={`Progreso del curso: ${completionPercentage}%`}
            />
          </div>

          <div className="text-sm font-semibold">{completionPercentage}%</div>
        </div>
      </div>
    </div>
  );
}
