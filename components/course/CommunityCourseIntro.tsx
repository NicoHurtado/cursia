'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Play,
  Download,
  AlertTriangle,
  User,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleData {
  title: string;
  description: string;
}

interface CommunityCourseIntroProps {
  title: string;
  description: string;
  level: string;
  language: string;
  totalModules: number;
  topics: string[];
  prerequisites: string[];
  totalSizeEstimate?: string;
  modules: ModuleData[];
  createdBy: string;
  authorName: string;
  authorUsername: string;
  publishedAt: string;
  onTakeCourse: () => void;
  onGoBack?: () => void;
  isTaking: boolean;
}

export function CommunityCourseIntro({
  title,
  description,
  level,
  language,
  totalModules,
  topics,
  prerequisites,
  totalSizeEstimate,
  modules,
  createdBy,
  authorName,
  authorUsername,
  publishedAt,
  onTakeCourse,
  onGoBack,
  isTaking,
}: CommunityCourseIntroProps) {
  const [showTakeDialog, setShowTakeDialog] = useState(false);
  const router = useRouter();

  const handleTakeClick = () => {
    setShowTakeDialog(true);
  };

  const handleConfirmTake = () => {
    setShowTakeDialog(false);
    onTakeCourse();
  };

  const handleGoBackToDashboard = () => {
    router.push('/dashboard/community');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          {onGoBack && (
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={onGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Comunidad
              </Button>
            </div>
          )}
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Badge
                variant="secondary"
                className={cn(
                  'text-sm font-medium px-3 py-1',
                  level === 'BEGINNER' && 'bg-green-100 text-green-800',
                  level === 'INTERMEDIATE' && 'bg-yellow-100 text-yellow-800',
                  level === 'ADVANCED' && 'bg-red-100 text-red-800'
                )}
              >
                {level}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {language}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Author Info Bar */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {authorName}
                    </p>
                    <p className="text-sm text-gray-500">@{authorUsername}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    Publicado {formatDate(publishedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Topics */}
              {topics.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Temas que aprenderás
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prerequisites */}
              {prerequisites.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Requisitos previos
                    </h3>
                    <ul className="space-y-2">
                      {prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Modules */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Módulos del curso
                  </h3>
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <h4 className="font-medium text-gray-900">
                          {module.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Take Course Card */}
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        ¿Te interesa este curso?
                      </h3>
                      <p className="text-sm text-gray-600">
                        Tómalo y aparecerá en tus cursos para que puedas
                        aprender a tu ritmo.
                      </p>
                    </div>
                    <Button
                      onClick={handleTakeClick}
                      disabled={isTaking}
                      size="lg"
                      className="w-full px-8 py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      {isTaking ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Tomando curso...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Tomar este curso
                        </>
                      )}
                    </Button>

                    {/* Panda with laptop */}
                    <div className="flex justify-center mt-6">
                      <img
                        src="/laptop_panda.png"
                        alt="Panda estudiando"
                        className="w-full max-w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Take Course Confirmation Dialog */}
      <Dialog open={showTakeDialog} onOpenChange={setShowTakeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Tomar este curso
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                <strong>"{title}"</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Al tomar este curso:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Aparecerá en tu sección "Mis Cursos"</li>
                      <li>• Podrás hacerlo desde cero a tu ritmo</li>
                      <li>• Tu progreso se guardará personalmente</li>
                      <li>• Podrás obtener certificados al completarlo</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Esto hará que el curso aparezca en tus cursos y puedas hacerlo
                tú.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTakeDialog(false)}
              disabled={isTaking}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTake}
              disabled={isTaking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTaking ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Tomando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Tomar curso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
