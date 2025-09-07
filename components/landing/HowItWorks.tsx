import {
  Sparkles,
  BookOpen,
  Video,
  CheckCircle2,
  Zap,
  Shield,
} from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Sparkles,
      title: 'Generación con IA',
      description:
        'Crea cursos completos en minutos con inteligencia artificial avanzada.',
    },
    {
      icon: BookOpen,
      title: 'Módulos estructurados',
      description:
        'Contenido organizado en lecciones progresivas y fáciles de seguir.',
    },
    {
      icon: Video,
      title: 'Múltiples formatos',
      description:
        'Texto, videos, imágenes y recursos interactivos en cada módulo.',
    },
    {
      icon: CheckCircle2,
      title: 'Quizzes automáticos',
      description:
        'Evaluaciones generadas automáticamente para validar el aprendizaje.',
    },
    {
      icon: Zap,
      title: 'Certificados instantáneos',
      description: 'Genera certificados profesionales listos para compartir.',
    },
    {
      icon: Shield,
      title: 'Calidad garantizada',
      description: 'Contenido revisado y optimizado para máxima efectividad.',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4">
            Cómo funciona
          </h2>
          <p className="text-lg text-muted-foreground">
            Desde la idea hasta el certificado,{' '}
            <span className="text-foreground">Curs</span>
            <span className="text-blue-600">ia</span> automatiza todo el proceso
            de creación de cursos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="group bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.25)] hover:shadow-[0_15px_50px_-20px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
