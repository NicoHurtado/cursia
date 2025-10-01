import { Halo } from '@/components/landing/Halo';
import { Hero } from '@/components/landing/Hero';
import { PromptInput } from '@/components/landing/PromptInput';
import Image from 'next/image';
import { Target, BookOpen, Star, Zap, Users, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      {/* Background halo */}
      <Halo />

      {/* Hero section with integrated animation */}
      <section id="inicio">
        <Hero />
      </section>

      {/* Create your own course section */}
      <section className="py-2">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em]">
              Ahora es tu turno. Crea tu propio curso
            </h2>
            <p className="text-lg text-muted-foreground">
              Ahora es tu turno. Escribe tu prompt y genera un curso
              personalizado en minutos.
            </p>
            <PromptInput />

            {/* Cursi Landing Image - Just below the input */}
            <div className="flex justify-center -mt-16">
              <div className="relative w-[24rem] h-[24rem] flex items-start justify-center">
                <Image
                  src="/cursi_landing.png?v=2"
                  alt="Cursi mascot"
                  width={600}
                  height={600}
                  className="object-bottom object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios (duplicado) */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12">
              Qué hace Cursia
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="w-8 h-8 text-blue-600" />,
                  title: 'Personalización real',
                  description:
                    'Se adapta a tu nivel, tu tiempo y tus intereses.',
                },
                {
                  icon: <BookOpen className="w-8 h-8 text-purple-600" />,
                  title: 'Contenido accionable',
                  description:
                    'Te da lecciones, ejemplos y ejercicios prácticos.',
                },
                {
                  icon: <Star className="w-8 h-8 text-green-600" />,
                  title: 'Quizzes y progreso',
                  description: 'Mide tu avance y te mantiene motivado.',
                },
                {
                  icon: <Zap className="w-8 h-8 text-orange-600" />,
                  title: 'Estructura en los cursos',
                  description:
                    'Para que puedas navegar y estudiar cómodo con nuestra interfaz.',
                },
                {
                  icon: <Users className="w-8 h-8 text-indigo-600" />,
                  title: 'Comunidad',
                  description:
                    'Aprende con otros, comparte y descubre más cursos.',
                },
                {
                  icon: <Award className="w-8 h-8 text-red-600" />,
                  title: 'Certificados verificables',
                  description:
                    'Demuestra lo que aprendiste con certificados profesionales.',
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
