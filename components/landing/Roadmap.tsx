import {
  MessageSquare,
  Brain,
  LayoutPanelTop,
  CheckCircle2,
  Award,
  ChevronRight,
  ArrowDown,
} from 'lucide-react';

export function Roadmap() {
  const steps = [
    {
      icon: MessageSquare,
      title: 'Envías tu prompt',
      description: 'Describe el tema, nivel e intereses.',
      step: 1,
    },
    {
      icon: Brain,
      title: 'La IA estructura el curso',
      description: 'Título, objetivos y módulos.',
      step: 2,
    },
    {
      icon: LayoutPanelTop,
      title: 'Vista previa inmediata',
      description: 'Revisa la metadata antes de generar.',
      step: 3,
    },
    {
      icon: CheckCircle2,
      title: 'Tienes tu curso listo',
      description: 'Quizzes y refuerzo si hace falta.',
      step: 4,
    },
    {
      icon: Award,
      title: 'Una vez terminado tendrás tu certificado',
      description: 'PDF verificable y enlace público.',
      step: 5,
    },
  ];

  const Connector = ({ isLast }: { isLast: boolean }) => (
    <div
      className="hidden md:flex items-center justify-center px-4"
      aria-hidden="true"
    >
      {!isLast && (
        <div className="w-8 h-px border-t-2 border-dashed border-primary/30"></div>
      )}
    </div>
  );

  const VerticalConnector = ({ isLast }: { isLast: boolean }) => (
    <div className="md:hidden flex justify-center py-4" aria-hidden="true">
      {!isLast && (
        <div className="w-px h-6 border-l-2 border-dashed border-primary/30"></div>
      )}
    </div>
  );

  return (
    <section id="roadmap" className="py-20 bg-muted/30">
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

        {/* Desktop: Horizontal flow with large circles */}
        <div className="hidden md:flex md:items-center md:justify-center md:gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  {/* Step number */}
                  <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mb-3">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {step.step}
                    </span>
                  </div>

                  {/* Large circle with icon */}
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 shadow-lg flex items-center justify-center mb-4 group-hover:shadow-xl transition-all duration-200">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Title and description */}
                  <h3 className="text-sm font-semibold mb-2 tracking-[-0.02em] w-40 h-12 flex items-center justify-center text-center">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed w-40 h-10 flex items-center justify-center text-center">
                    {step.description}
                  </p>
                </div>
                <Connector isLast={index === steps.length - 1} />
              </div>
            );
          })}
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden flex flex-col items-center gap-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="flex flex-col items-center">
                <div className="flex flex-col items-center text-center">
                  {/* Step number */}
                  <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mb-3">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {step.step}
                    </span>
                  </div>

                  {/* Large circle with icon */}
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 shadow-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Title and description */}
                  <h3 className="text-sm font-semibold mb-2 tracking-[-0.02em] w-48 h-12 flex items-center justify-center text-center">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed w-48 h-10 flex items-center justify-center text-center mb-4">
                    {step.description}
                  </p>
                </div>
                <VerticalConnector isLast={index === steps.length - 1} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
