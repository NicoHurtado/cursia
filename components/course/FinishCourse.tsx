'use client';

import {
  Trophy,
  CheckCircle2,
  BookOpen,
  Download,
  Star,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';

import { Certificate } from './Certificate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { downloadCertificatePDF } from '@/lib/certificate-pdf';

interface FinishCourseProps {
  courseTitle: string;
  totalModules: number;
  completedModules: number;
  totalChunks: number;
  completedChunks: number;
  timeSpent?: string;
  userName: string;
  courseId: string;
  courseModules?: Array<{
    title: string;
    description?: string;
  }>;
  onFinishCourse: () => Promise<{
    certificateId: string;
    course: {
      id: string;
      title: string;
      description: string;
      topics?: string[];
    };
    user: { id: string; name: string; email: string };
    completedAt: string;
  }>;
  onDownloadCertificate?: () => void;
  onGoBackToCourse?: () => void;
}

export function FinishCourse({
  courseTitle,
  totalModules,
  completedModules,
  totalChunks,
  completedChunks,
  timeSpent,
  userName,
  courseId,
  courseModules = [],
  onFinishCourse,
  onDownloadCertificate,
  onGoBackToCourse,
}: FinishCourseProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [certificateData, setCertificateData] = useState<{
    certificateId: string;
    course: {
      id: string;
      title: string;
      description: string;
      topics?: string[];
    };
    user: { id: string; name: string; email: string };
    completedAt: string;
  } | null>(null);

  const handleFinishCourse = async () => {
    setIsFinishing(true);
    try {
      const result = await onFinishCourse();
      console.log('FinishCourse - Result received:', result);
      console.log('FinishCourse - Certificate ID:', result.certificateId);
      setCertificateData(result);
      setIsFinished(true);
    } catch (error) {
      console.error('Error finishing course:', error);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleSavePDF = () => {
    if (certificateData) {
      downloadCertificatePDF({
        userName: certificateData.user?.name || userName || 'Usuario',
        courseName: certificateData.course?.title || courseTitle || 'Curso',
        completionDate: certificateData.completedAt || new Date().toISOString(),
        certificateId: certificateData.certificateId || 'CERT-UNKNOWN',
      });
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  if (isFinished && certificateData) {
    console.log('Certificate data received:', certificateData);

    // Validate and provide fallbacks for certificate data
    const safeUserName = certificateData.user?.name || userName || 'Usuario';
    const safeCourseName =
      certificateData.course?.title || courseTitle || 'Curso';
    const safeCompletionDate =
      certificateData.completedAt || new Date().toISOString();
    const safeCertificateId = certificateData.certificateId || 'CERT-UNKNOWN';
    const safeTopics = certificateData.course?.topics || [];

    return (
      <Certificate
        userName={safeUserName}
        courseName={safeCourseName}
        completionDate={safeCompletionDate}
        certificateId={safeCertificateId}
        topics={safeTopics}
        modules={courseModules}
        onSavePDF={handleSavePDF}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

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
                Completado el{' '}
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
            ¡Curso Completado!
          </CardTitle>

          <p className="text-lg text-muted-foreground">
            Has completado todos los módulos y quizzes. ¿Listo para finalizar tu
            curso?
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

          <div className="text-center space-y-4">
            {/* Botón Volver al Curso */}
            {onGoBackToCourse && (
              <Button
                onClick={onGoBackToCourse}
                variant="outline"
                size="lg"
                className="px-8 py-3 text-base font-medium border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Curso
              </Button>
            )}

            {/* Botón Finalizar Curso */}
            <div>
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
