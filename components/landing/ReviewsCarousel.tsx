'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'María Fernanda Rodríguez',
    role: 'Desarrolladora Frontend',
    content:
      '<span className="text-foreground">Curs</span><span className="text-blue-600">ia</span> ha revolucionado mi forma de aprender. Los cursos generados con IA son increíblemente detallados y personalizados. En solo 2 semanas aprendí React desde cero.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Carlos Andrés Mendoza',
    role: 'Product Manager',
    content:
      'La calidad del contenido es excepcional. Los ejemplos prácticos y los quizzes me ayudaron a consolidar mi conocimiento en gestión de productos digitales.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ana Lucía Herrera',
    role: 'Diseñadora UX/UI',
    content:
      'Como diseñadora, necesitaba actualizar mis conocimientos en Figma y diseño de interfaces. <span className="text-foreground">Curs</span><span className="text-blue-600">ia</span> me dio exactamente lo que necesitaba, con ejemplos reales.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Diego Alejandro Vargas',
    role: 'Ingeniero de Software',
    content:
      'Los cursos de programación son de nivel profesional. La estructura modular y los ejercicios prácticos me ayudaron a dominar Python y Django en tiempo récord.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Valentina Sánchez',
    role: 'Marketing Digital',
    content:
      'Increíble plataforma para aprender marketing digital. Los cursos incluyen estrategias actuales y casos de estudio reales. Definitivamente la recomiendo.',
    rating: 5,
  },
  {
    id: 6,
    name: 'Sebastián Camilo Torres',
    role: 'Data Analyst',
    content:
      'Los cursos de análisis de datos son completos y actualizados. Aprendí SQL, Python para data science y visualización de datos de manera muy práctica.',
    rating: 5,
  },
  {
    id: 7,
    name: 'Isabella Morales',
    role: 'Emprendedora',
    content:
      'Como emprendedora, necesitaba conocimientos en múltiples áreas. <span className="text-foreground">Curs</span><span className="text-blue-600">ia</span> me permitió aprender sobre finanzas, marketing y gestión de equipos de forma eficiente.',
    rating: 5,
  },
  {
    id: 8,
    name: 'Nicolás David Jiménez',
    role: 'DevOps Engineer',
    content:
      'Los cursos de DevOps y cloud computing son excelentes. Aprendí Docker, Kubernetes y AWS con ejemplos prácticos que pude aplicar inmediatamente en mi trabajo.',
    rating: 5,
  },
];

export function ReviewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={cn(
          'h-4 w-4',
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        )}
      />
    ));
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 dark:from-slate-900 dark:via-blue-950 dark:to-blue-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-6">
            Lo que dicen nuestros estudiantes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Miles de profesionales en Colombia ya están transformando sus
            carreras con <span className="text-foreground">Curs</span>
            <span className="text-blue-600">ia</span>
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Reviews Container */}
          <div
            className="flex transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {reviews.map(review => (
              <div key={review.id} className="w-full flex-shrink-0 px-4">
                <Card className="max-w-4xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-8 md:p-12">
                    <div className="text-center">
                      {/* Stars */}
                      <div className="flex justify-center mb-6">
                        {renderStars(review.rating)}
                      </div>

                      {/* Review Content */}
                      <blockquote className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                        "{review.content}"
                      </blockquote>

                      {/* Author Info */}
                      <div className="flex items-center justify-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {review.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-foreground">
                            {review.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {review.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 scale-125'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                )}
                aria-label={`Ir a review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
