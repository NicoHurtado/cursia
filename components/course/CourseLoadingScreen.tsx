'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Brain,
  Target,
  Clock,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';

const studyTips = [
  {
    icon: Brain,
    title: 'Técnica Pomodoro',
    description:
      'Estudia en bloques de 25 minutos con descansos de 5 minutos para mantener la concentración.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: Target,
    title: 'Objetivos Claros',
    description:
      'Define qué quieres aprender en cada sesión. Los objetivos específicos mejoran el rendimiento.',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: BookOpen,
    title: 'Repaso Activo',
    description:
      'En lugar de solo leer, hazte preguntas y explica los conceptos con tus propias palabras.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  {
    icon: Clock,
    title: 'Consistencia',
    description:
      'Es mejor estudiar 30 minutos diarios que 3 horas una vez por semana.',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
  {
    icon: Lightbulb,
    title: 'Conexiones',
    description:
      'Relaciona nuevos conceptos con conocimientos previos para crear una red de aprendizaje.',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
  {
    icon: TrendingUp,
    title: 'Progreso Visual',
    description:
      'Celebra los pequeños logros y mantén un registro de tu progreso para mantener la motivación.',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
  },
];

// Curious facts, tips, and interesting data about learning
const learningFacts: string[] = [
  '🧠 El cerebro humano puede procesar 11 millones de bits de información por segundo, pero solo puede procesar conscientemente 40 bits.',
  '⚡ La técnica de espaciado puede mejorar la retención de información hasta en un 200% comparado con el estudio masivo.',
  '🎯 Los estudiantes que establecen objetivos específicos tienen 42% más probabilidades de alcanzarlos que aquellos con objetivos vagos.',
  '🔄 El efecto de repetición espaciada fue descubierto por Hermann Ebbinghaus en 1885 y sigue siendo la técnica más efectiva.',
  '🧘 La meditación de solo 10 minutos al día puede aumentar la concentración y reducir el estrés durante el estudio.',
  '🎵 La música instrumental puede mejorar el rendimiento cognitivo hasta en un 23% durante tareas complejas.',
  '🌙 El sueño REM es crucial para consolidar la memoria. Dormir 7-9 horas optimiza el aprendizaje.',
  '💡 El ejercicio físico aumenta la producción de BDNF, una proteína que mejora la neuroplasticidad cerebral.',
  '📝 Escribir a mano activa más áreas del cerebro que escribir en teclado, mejorando la retención.',
  '🎨 El uso de colores en notas puede mejorar la memoria hasta en un 55% comparado con texto monocromático.',
  '🤝 Enseñar a otros lo que aprendes puede aumentar tu comprensión hasta en un 90%.',
  '⏰ El momento óptimo para aprender nueva información es entre las 10 AM y 2 PM.',
  '🧩 Resolver puzzles y rompecabezas puede aumentar la capacidad de resolución de problemas en un 40%.',
  '💧 La deshidratación puede reducir la capacidad cognitiva hasta en un 15%. Mantente hidratado.',
  '🌱 El aprendizaje de nuevas habilidades físicas crea nuevas conexiones neuronales permanentes.',
];

interface CourseLoadingScreenProps {
  status?: string;
}

export function CourseLoadingScreen({
  status = 'loading',
}: CourseLoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % studyTips.length);
    }, 4000);

    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % learningFacts.length);
    }, 5000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(factInterval);
    };
  }, []);

  const currentTipData = studyTips[currentTip];
  const IconComponent = currentTipData.icon;

  const getStatusMessage = () => {
    switch (status) {
      case 'GENERATING_METADATA':
        return {
          title: 'Generando estructura del curso...',
          description:
            'Creando la estructura y planificación de tu curso personalizado',
        };
      case 'METADATA_READY':
        return {
          title: 'Creando contenido educativo...',
          description:
            'Generando el primer módulo con contenido de alta calidad',
        };
      default:
        return {
          title: 'Preparando tu curso...',
          description:
            'Estamos generando contenido educativo personalizado para ti',
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
            <p className="text-muted-foreground">{statusInfo.description}</p>
          </div>
        </div>

        {/* Curious Facts */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
            <p className="text-lg font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
              {learningFacts[currentFact]}
            </p>
          </div>
        </div>

        {/* Current Tip */}
        <Card className="border-0 shadow-lg animate-slide-in-up">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div
                className={`p-3 rounded-lg ${currentTipData.bgColor} flex-shrink-0 transition-all duration-500`}
              >
                <IconComponent
                  className={`h-6 w-6 ${currentTipData.color} transition-all duration-500`}
                />
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

        {/* Loading Animation - Modern dots */}
        <div className="flex justify-center space-x-2">
          <div className="flex space-x-1">
            <div
              className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        </div>

        {/* Helper text */}
        <div className="text-center text-sm text-muted-foreground">
          Generando tu curso personalizado... ¡Aprende mientras esperas!
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
