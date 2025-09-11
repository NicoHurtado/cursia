'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Brain, Target, Clock, Lightbulb, TrendingUp } from 'lucide-react';

const studyTips = [
  {
    icon: Brain,
    title: 'Técnica Pomodoro',
    description: 'Estudia en bloques de 25 minutos con descansos de 5 minutos para mantener la concentración.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: Target,
    title: 'Objetivos Claros',
    description: 'Define qué quieres aprender en cada sesión. Los objetivos específicos mejoran el rendimiento.',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: BookOpen,
    title: 'Repaso Activo',
    description: 'En lugar de solo leer, hazte preguntas y explica los conceptos con tus propias palabras.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  {
    icon: Clock,
    title: 'Consistencia',
    description: 'Es mejor estudiar 30 minutos diarios que 3 horas una vez por semana.',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  {
    icon: Lightbulb,
    title: 'Conexiones',
    description: 'Relaciona nuevos conceptos con conocimientos previos para crear una red de aprendizaje.',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  {
    icon: TrendingUp,
    title: 'Progreso Visual',
    description: 'Celebra los pequeños logros y mantén un registro de tu progreso para mantener la motivación.',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
  },
];

interface CourseLoadingScreenProps {
  status?: string;
}

export function CourseLoadingScreen({ status = 'loading' }: CourseLoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % studyTips.length);
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentTipData = studyTips[currentTip];
  const IconComponent = currentTipData.icon;

  const getStatusMessage = () => {
    switch (status) {
      case 'GENERATING_METADATA':
        return {
          title: 'Generando estructura del curso...',
          description: 'Creando la estructura y planificación de tu curso personalizado',
          progress: Math.min(progress * 0.3, 30)
        };
      case 'METADATA_READY':
        return {
          title: 'Creando contenido educativo...',
          description: 'Generando el primer módulo con contenido de alta calidad',
          progress: Math.min(30 + progress * 0.4, 70)
        };
      default:
        return {
          title: 'Preparando tu curso...',
          description: 'Estamos generando contenido educativo personalizado para ti',
          progress: Math.min(progress, 100)
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in-scale">
          <div className="relative animate-float">
            <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="animate-slide-in-up">
            <h1 className="text-2xl font-bold mb-2 animate-gradient">
              {statusInfo.title}
            </h1>
            <p className="text-muted-foreground">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progreso</span>
            <span>{Math.round(statusInfo.progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${statusInfo.progress}%` }}
            />
          </div>
        </div>

        {/* Current Tip */}
        <Card className="border-0 shadow-lg animate-slide-in-up">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${currentTipData.bgColor} flex-shrink-0 transition-all duration-500`}>
                <IconComponent className={`h-6 w-6 ${currentTipData.color} transition-all duration-500`} />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground transition-all duration-500">
                  {currentTipData.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed transition-all duration-500">
                  {currentTipData.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>

        {/* Status Messages */}
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            {statusInfo.progress < 30 && "Generando estructura del curso..."}
            {statusInfo.progress >= 30 && statusInfo.progress < 70 && "Creando contenido educativo..."}
            {statusInfo.progress >= 70 && statusInfo.progress < 90 && "Optimizando para tu nivel..."}
            {statusInfo.progress >= 90 && "¡Casi listo! Preparando la experiencia..."}
          </div>
          <div className="text-xs text-muted-foreground">
            Esto puede tomar unos minutos. Mientras tanto, revisa estos tips de estudio.
          </div>
        </div>

        {/* Tips Navigation */}
        <div className="flex justify-center space-x-2">
          {studyTips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTip(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentTip
                  ? 'bg-blue-600 w-6'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
