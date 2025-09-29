'use client';

import Image from 'next/image';

interface SimpleCourseMockupProps {
  course: {
    title: string;
    description: string;
    level: string;
    language: string;
    modules: number;
    author: string;
  };
}

export function SimpleCourseMockup({ course }: SimpleCourseMockupProps) {
  const modules = [
    'Fundamentos y conceptos básicos',
    'Desarrollo de habilidades intermedias',
    'Técnicas avanzadas y especialización',
    'Aplicación práctica en proyectos reales',
    'Optimización y mejores prácticas',
  ];

  const topics = [
    'Fundamentos teóricos',
    'Herramientas y tecnologías',
    'Metodologías prácticas',
    'Casos de uso reales',
    'Optimización y escalabilidad',
  ];

  return (
    <div className="max-w-5xl w-full mx-auto p-8 bg-white dark:bg-slate-800 rounded-2xl min-h-[600px] overflow-hidden">
      <div className="grid grid-cols-[1.4fr_0.9fr] gap-5 h-full">
        {/* Columna izquierda */}
        <section>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-slate-900 dark:text-white">
            {course.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-5 max-w-4xl text-base leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-2.5 my-3 mb-5">
            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full px-3 py-1.5 text-sm font-semibold">
              {course.level}
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full px-3 py-1.5 text-sm font-semibold">
              {course.language}
            </span>
            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full px-3 py-1.5 text-sm font-semibold">
              {course.modules} módulos
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm p-4 grid gap-2 mb-4">
            <div className="flex gap-2.5 items-center text-slate-600 dark:text-slate-300 text-sm">
              <span>
                Generado por:{' '}
                <b className="text-slate-900 dark:text-white">
                  {course.author}
                </b>
              </span>
            </div>
            <div className="flex gap-2.5 items-center text-slate-600 dark:text-slate-300 text-sm">
              <span>
                Prompt:{' '}
                <b className="text-slate-900 dark:text-white">{course.title}</b>
              </span>
            </div>
          </div>

          <h3 className="font-extrabold my-2.5 mb-3 text-base text-slate-900 dark:text-white">
            Módulos del Curso
          </h3>
          <div className="grid gap-3">
            {modules.map((module, index) => (
              <article
                key={index}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 shadow-sm transition-transform hover:scale-[1.02] text-left"
              >
                <h4 className="m-0 mb-1 text-sm font-semibold text-slate-900 dark:text-white text-left">
                  Módulo {index + 1}
                </h4>
                <p className="m-0 text-slate-600 dark:text-slate-300 text-sm text-left">
                  {module}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Columna derecha */}
        <aside>
          <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm p-4 mb-4">
            <h3 className="font-extrabold my-1 mb-3 text-base text-slate-900 dark:text-white">
              Topics
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {topics.map((topic, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 px-3 py-2 rounded-full font-bold text-xs"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm p-4 flex flex-col justify-between text-center h-fit min-h-[300px]">
            <div>
              <div className="font-extrabold text-center mb-1.5 text-base text-slate-900 dark:text-white">
                ¿Listo para iniciar?
              </div>
              <div className="text-slate-600 dark:text-slate-300 font-bold text-center mb-5 text-sm">
                Cursi ya está listo
              </div>

              {/* Panda Image */}
              <div className="w-60 h-60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-5">
                <Image
                  src="/laptop_panda.png"
                  alt="Panda de Cursia"
                  width={240}
                  height={240}
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div>
              <button className="inline-grid place-items-center px-5 h-12 min-w-60 text-white font-extrabold tracking-wide rounded-full border-0 cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-base">
                ▶ ¡Continuar Curso!
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
