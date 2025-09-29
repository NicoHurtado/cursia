'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
  Edit3,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModuleData {
  title: string;
  description: string;
}

interface CourseIntroProps {
  title: string;
  description: string;
  level: string;
  language: string;
  totalModules: number;
  topics: string[];
  prerequisites: string[];
  totalSizeEstimate?: string;
  onStartCourse: () => void;
  isStarting: boolean;
  modules: ModuleData[];
  hasProgress?: boolean;
  createdBy?: string;
  userPrompt?: string;
  onModifyCourse?: () => void;
  isModifying?: boolean;
}

export function CourseIntro({
  title,
  description,
  level,
  language,
  totalModules,
  topics,
  prerequisites,
  totalSizeEstimate,
  onStartCourse,
  isStarting,
  modules,
  hasProgress = false,
  createdBy,
  userPrompt,
  onModifyCourse,
  isModifying = false,
}: CourseIntroProps) {
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const router = useRouter();

  const handleModifyClick = () => {
    setShowModifyDialog(true);
  };

  const handleConfirmModify = () => {
    setShowModifyDialog(false);
    if (onModifyCourse) {
      onModifyCourse();
    }
  };

  const handleCancelModify = () => {
    setShowModifyDialog(false);
  };

  const handleGoBack = () => {
    router.push('/dashboard/courses');
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
      case 'avanzado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Left Side - Title, Description and Modules */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
                  {title}
                </h1>

                <p className="text-[15px] md:text-base text-muted-foreground leading-relaxed max-w-3xl">
                  {description}
                </p>
              </div>

              {/* Course Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getLevelBadgeColor(level)}>
                  {level === 'BEGINNER'
                    ? 'Principiante'
                    : level === 'INTERMEDIATE'
                      ? 'Intermedio'
                      : level === 'ADVANCED'
                        ? 'Avanzado'
                        : level}
                </Badge>

                <Badge variant="outline">
                  {language === 'es' ? 'Español' : language}
                </Badge>

                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {totalModules} módulos
                </Badge>

                {totalSizeEstimate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalSizeEstimate}
                  </Badge>
                )}
              </div>

              {/* Author & Prompt */}
              {(createdBy || userPrompt) && (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      {createdBy && (
                        <div className="text-sm text-muted-foreground">
                          Generado por:{' '}
                          <span className="font-medium text-foreground">
                            {createdBy}
                          </span>
                        </div>
                      )}
                      {userPrompt && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Prompt:</span>
                          <span className="ml-2 text-foreground">
                            {userPrompt}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Modules Section - Moved to left column */}
              {modules && modules.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Módulos del Curso</h2>
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div
                        key={index}
                        className="bg-muted/40 rounded-lg p-4 border hover:bg-muted/60 transition-colors"
                      >
                        <h3 className="text-sm font-semibold">
                          Módulo {index + 1}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Side - Topics, Prerequisites, and Cursi */}
            <div className="space-y-4">
              {/* Topics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <BookOpen className="h-5 w-5" />
                    Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs md:text-sm px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-blue-700 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-[1.02]"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prerequisites */}
              {prerequisites.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="h-4 w-4" />
                      Prerequisites ({prerequisites.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {prerequisites.map((prereq, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Ready to Start Section */}
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    ¿Listo para iniciar?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Cursi ya está listo
                  </p>
                </div>

                {/* Cursi Image */}
                <div className="flex justify-center">
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <img
                      src="/Cursi.png"
                      alt="Cursi - Mascota de Cursia"
                      className="w-56 h-56 md:w-72 md:h-72 object-contain opacity-90"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Start Course Button */}
                  <Button
                    onClick={onStartCourse}
                    disabled={isStarting || isModifying}
                    size="lg"
                    className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-700 ease-in-out"
                  >
                    {isStarting ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        {hasProgress
                          ? 'Continuando curso...'
                          : 'Iniciando curso...'}
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        {hasProgress ? '¡Continuar Curso!' : '¡Iniciar Curso!'}
                      </>
                    )}
                  </Button>

                  {/* Modify Course Button - Only show if not in progress */}
                  {!hasProgress && onModifyCourse && (
                    <div>
                      <Button
                        onClick={handleModifyClick}
                        disabled={isStarting || isModifying}
                        variant="outline"
                        size="sm"
                        className="text-sm text-muted-foreground hover:text-foreground border-muted-foreground/20 hover:border-muted-foreground/40"
                      >
                        {isModifying ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            Modificando...
                          </>
                        ) : (
                          <>
                            <Edit3 className="mr-2 h-4 w-4" />
                            No me convence el curso, quiero modificar mi prompt
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modify Course Confirmation Dialog */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Estás seguro?
            </DialogTitle>
            <DialogDescription className="text-left">
              Si modificas tu prompt, se generará un curso completamente nuevo y
              se perderá el curso actual. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancelModify}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmModify}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
            >
              Sí, modificar curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
