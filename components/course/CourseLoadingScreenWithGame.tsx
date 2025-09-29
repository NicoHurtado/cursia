'use client';

import { useState, useEffect } from 'react';
import { MemoryGame } from '@/components/loading/MemoryGame';

interface CourseLoadingScreenWithGameProps {
  status?: string;
  onCourseReady?: () => void;
}

export function CourseLoadingScreenWithGame({
  status = 'loading',
  onCourseReady,
}: CourseLoadingScreenWithGameProps) {
  const [courseProgress, setCourseProgress] = useState(0);
  const [isCourseReady, setIsCourseReady] = useState(false);

  // Simulate course generation progress based on status
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setCourseProgress(prev => {
        let targetProgress = 0;

        switch (status) {
          case 'GENERATING_METADATA':
            targetProgress = 25;
            break;
          case 'METADATA_READY':
            targetProgress = 50;
            break;
          case 'GENERATING_MODULE_1':
            targetProgress = 75;
            break;
          case 'READY':
            targetProgress = 100;
            setIsCourseReady(true);
            if (onCourseReady) {
              setTimeout(() => onCourseReady(), 2000);
            }
            break;
          default:
            targetProgress = Math.min(prev + Math.random() * 5, 90);
        }

        if (prev < targetProgress) {
          return Math.min(prev + Math.random() * 3, targetProgress);
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [status, onCourseReady]);

  return (
    <MemoryGame onGameComplete={onCourseReady} isCourseReady={isCourseReady} />
  );
}
