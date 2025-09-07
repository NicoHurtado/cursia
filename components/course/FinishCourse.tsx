'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  CheckCircle2,
  Clock,
  BookOpen,
  Download,
  Star,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';

interface FinishCourseProps {
  courseTitle: string;
  totalModules: number;
  completedModules: number;
  totalChunks: number;
  completedChunks: number;
  timeSpent?: string;
  onFinishCourse: () => Promise<void>;
  onDownloadCertificate?: () => void;
}

export function FinishCourse({
  courseTitle,
  totalModules,
  completedModules,
  totalChunks,
  completedChunks,
  timeSpent,
  onFinishCourse,
  onDownloadCertificate,
}: FinishCourseProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleFinishCourse = async () => {
    setIsFinishing(true);
    try {
      await onFinishCourse();
      setIsFinished(true);
    } catch (error) {
      console.error('Error finishing course:', error);
    } finally {
      setIsFinishing(false);
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              Congratulations!
            </CardTitle>

            <p className="text-lg text-muted-foreground">
              You have successfully completed the course
            </p>
          </CardHeader>

          <CardContent className="text-center">
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-2">{courseTitle}</h3>
              <p className="text-muted-foreground">
                Completed on{' '}
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {onDownloadCertificate && (
                <Button
                  onClick={onDownloadCertificate}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              )}

              <Button
                onClick={() => (window.location.href = '/dashboard')}
                size="lg"
                className="flex items-center gap-2"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold mb-2">
            Course Complete!
          </CardTitle>

          <p className="text-lg text-muted-foreground">
            You've finished all modules and quizzes. Ready to finalize your
            course?
          </p>
        </CardHeader>

        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-center">
              {courseTitle}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{completedModules}</div>
                <div className="text-sm text-muted-foreground">Modules</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{completedChunks}</div>
                <div className="text-sm text-muted-foreground">Chunks</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{timeSpent || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                All modules completed and quizzes passed
              </Badge>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={handleFinishCourse}
              disabled={isFinishing}
              size="lg"
              className="px-8"
            >
              {isFinishing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Finalizing Course...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Finish Course
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Once you finish the course, you'll be able to download your
              certificate and view your achievement in your dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
