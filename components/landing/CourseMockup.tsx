'use client';

import Image from 'next/image';

interface CourseMockupProps {
  course: {
    title: string;
    description: string;
    level: string;
    language: string;
    modules: number;
    author: string;
    progress: number;
    duration: string;
    completedModules: number;
    quizzes: number;
    passedQuizzes: number;
    completionDate?: string;
  };
  variant?: 'intro' | 'course';
}

export function CourseMockup({ course, variant = 'intro' }: CourseMockupProps) {
  if (variant === 'intro') {
    return (
      <div
        className="w-full max-w-6xl mx-auto"
        style={{
          background: '#f7f8fc',
          borderRadius: '16px',
          padding: '32px 20px',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Inter, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji","Segoe UI Emoji"',
          maxHeight: '600px',
          overflow: 'hidden',
        }}
      >
        <div
          className="grid grid-cols-[1.4fr_0.9fr] gap-8 max-md:grid-cols-1"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 0.9fr',
            gap: '32px',
          }}
        >
          {/* Columna izquierda */}
          <section>
            <h1
              className="text-4xl font-extrabold leading-tight tracking-tight mb-3"
              style={{
                fontSize: 'clamp(28px, 4.5vw, 40px)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
                margin: '0 0 12px',
                fontWeight: '800',
              }}
            >
              {course.title}
            </h1>
            <p
              className="text-slate-600 mb-4 max-w-4xl"
              style={{
                color: '#475569',
                margin: '0 0 16px',
                maxWidth: '66ch',
              }}
            >
              {course.description}
            </p>

            <div className="flex flex-wrap gap-2.5 mb-5">
              <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-3 py-1.5 text-sm font-semibold">
                {course.level}
              </span>
              <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-3 py-1.5 text-sm font-semibold">
                {course.language}
              </span>
              <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-3 py-1.5 text-sm font-semibold">
                {course.modules} módulos
              </span>
            </div>

            <div
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-5"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, .06)',
                padding: '14px 16px',
                display: 'grid',
                gap: '8px',
                margin: '0 0 18px',
              }}
            >
              <div className="flex gap-2.5 items-center text-slate-600">
                <span>
                  Generado por:{' '}
                  <b className="text-slate-900">{course.author}</b>
                </span>
              </div>
              <div className="flex gap-2.5 items-center text-slate-600">
                <span>
                  Prompt: <b className="text-slate-900">{course.title}</b>
                </span>
              </div>
            </div>

            <h3
              className="font-extrabold mb-3"
              style={{
                fontWeight: '800',
                margin: '10px 0 12px',
              }}
            >
              Módulos del Curso
            </h3>
            <div
              className="grid gap-3"
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {course.modules === 7
                ? [
                    'Fundamentos de Python y configuración del entorno',
                    'Variables, tipos de datos y operadores básicos',
                    'Estructuras de control y flujo de programa',
                    'Funciones y módulos en Python',
                    'Manejo de archivos y excepciones',
                    'Programación orientada a objetos',
                    'Proyecto final: Aplicación práctica',
                  ]
                : course.modules === 5
                  ? [
                      'Fundamentos de Python para análisis financiero',
                      'Manipulación y limpieza de datos financieros con Pandas',
                      'Análisis de tendencias y patrones en datos financieros',
                      'Desarrollo de modelos predictivos de mercados financieros',
                      'Automatización de informes y reportes financieros',
                    ]
                  : [
                      'Introducción a Kubernetes y conceptos básicos',
                      'Pods, Deployments y gestión de contenedores',
                      'Services, Networking y comunicación entre servicios',
                      'ConfigMaps, Secrets y gestión de configuración',
                      'Monitoreo, logs y observabilidad en producción',
                    ].map((module, index) => (
                      <article
                        key={index}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-150 hover:transform hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          boxShadow: '0 8px 24px rgba(15, 23, 42, .06)',
                          transition:
                            'transform .12s ease, box-shadow .12s ease',
                        }}
                      >
                        <h4
                          className="font-semibold mb-1 text-sm"
                          style={{
                            margin: '0 0 4px',
                            fontSize: '15px',
                          }}
                        >
                          Módulo {index + 1}
                        </h4>
                        <p
                          className="text-slate-600 text-sm m-0"
                          style={{
                            margin: '0',
                            color: '#475569',
                            fontSize: '14px',
                          }}
                        >
                          {module}
                        </p>
                      </article>
                    ))}
            </div>
          </section>

          {/* Columna derecha */}
          <aside>
            <div
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-4"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, .06)',
                padding: '16px',
              }}
            >
              <h3
                className="font-extrabold mb-3"
                style={{
                  fontWeight: '800',
                  margin: '4px 0 12px',
                }}
              >
                Topics
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {course.modules === 7
                  ? [
                      'Fundamentos de programación',
                      'Sintaxis y estructuras',
                      'Manejo de datos',
                      'POO y patrones',
                      'Proyectos prácticos',
                    ]
                  : course.modules === 5
                    ? [
                        'Análisis de datos financieros',
                        'Automatización de procesos',
                        'Visualización de datos',
                        'Modelos predictivos',
                        'Gestión de riesgos',
                      ]
                    : [
                        'Contenedores y orquestación',
                        'Microservicios',
                        'DevOps y CI/CD',
                        'Monitoreo y observabilidad',
                        'Escalabilidad y performance',
                      ].map((topic, index) => (
                        <span
                          key={index}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-full font-bold text-xs"
                          style={{
                            background: '#eef2ff',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                            padding: '8px 12px',
                            borderRadius: '999px',
                            fontWeight: '700',
                            fontSize: '13px',
                          }}
                        >
                          {topic}
                        </span>
                      ))}
              </div>
            </div>

            <div
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-center"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, .06)',
                padding: '16px',
                display: 'grid',
                gap: '14px',
                justifyItems: 'center',
                textAlign: 'center',
              }}
            >
              <div>
                <div
                  className="font-extrabold text-center mb-1.5"
                  style={{
                    fontWeight: '800',
                    textAlign: 'center',
                    marginBottom: '6px',
                  }}
                >
                  ¿Listo para iniciar?
                </div>
                <div
                  className="text-slate-600 font-bold text-center mb-2"
                  style={{
                    color: '#475569',
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '8px',
                  }}
                >
                  Cursi ya está listo
                </div>
              </div>

              {/* Panda Image */}
              <div
                className="w-60 h-60 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center"
                style={{
                  width: '240px',
                  height: '240px',
                  borderRadius: '16px',
                  border: '1px dashed #e2e8f0',
                  background: '#f8fafc center/cover no-repeat',
                }}
              >
                <Image
                  src="/laptop_panda.png"
                  alt="Panda de Cursia"
                  width={240}
                  height={240}
                  className="rounded-2xl"
                />
              </div>

              <button
                className="inline-grid place-items-center px-4.5 h-12 min-w-60 text-white font-extrabold tracking-wide rounded-full border-none cursor-pointer transition-all duration-150 hover:brightness-110 active:translate-y-0.5"
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  padding: '0 18px',
                  height: '48px',
                  minWidth: '240px',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: '800',
                  letterSpacing: '.01em',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                  boxShadow: '0 8px 20px rgba(99,102,241,.35)',
                  transition: 'filter .12s ease, transform .06s ease',
                }}
              >
                ▶ ¡Continuar Curso!
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Course view variant
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Browser Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 max-w-md mx-4">
          <div className="bg-white border rounded-lg px-3 py-1.5 text-sm text-gray-500">
            cursia.app/course/{course.title.toLowerCase().replace(/\s+/g, '-')}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded">
            Cursia Course
          </button>
          <div className="flex space-x-1">
            <div className="w-8 h-1 bg-white rounded"></div>
            <div className="w-8 h-1 bg-white rounded"></div>
            <div className="w-8 h-1 bg-white/50 rounded"></div>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <div className="flex items-center space-x-4 text-sm">
          <span>{course.progress}% completado</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6">{course.title}</h2>

          {/* Modules */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Módulos del Curso</h3>
            <div className="space-y-3">
              {[
                { title: 'Introducción y configuración', completed: true },
                { title: 'Sintaxis básica y variables', completed: true },
                { title: 'Estructuras de control', completed: true },
                { title: 'Funciones y módulos', completed: false },
                { title: 'Proyecto final', completed: false },
              ].map((module, index) => (
                <div key={index} className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        module.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {module.completed ? (
                        <div className="w-4 h-4 text-green-600">✓</div>
                      ) : (
                        <div className="w-4 h-4 text-gray-400">○</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Módulo {index + 1}: {module.title}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">
              Quiz: {course.title.split(' ')[0]} Básico
            </h3>
            <div className="p-4 bg-white border rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-2">
                7 preguntas - 6/10 puntos
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <div className="w-3 h-3 text-green-600">✓</div>
                  </div>
                  <span className="text-sm">
                    ¿Qué es una variable en programación?
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                    <div className="w-3 h-3 text-red-600">✗</div>
                  </div>
                  <span className="text-sm">
                    ¿Cuál es la diferencia entre lista y tupla?
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-50 p-6 space-y-6">
          {/* Certificate */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Certificado de Completación
              </h3>
              <div className="text-center">
                <div className="w-12 h-12 text-yellow-500 mx-auto mb-2">🏆</div>
                <h4 className="font-semibold mb-1">{course.title}</h4>
                <p className="text-sm text-gray-600">
                  {course.completionDate ||
                    `Completado el ${new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estadísticas del Curso</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <div className="w-4 h-4">⏱️</div>
                    Duración:
                  </span>
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <div className="w-4 h-4">📚</div>
                    Módulos:
                  </span>
                  <span>{course.completedModules} completados</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quizzes:</span>
                  <span>{course.passedQuizzes} aprobados</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Progreso:</span>
                  <span>{course.progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center">
              <div className="w-4 h-4 mr-2">▶️</div>
              Continuar Curso
            </button>
            <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded flex items-center justify-center">
              <div className="w-4 h-4 mr-2">⬇️</div>
              Descargar Certificado
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-600">
        Gratis para empezar • Sin tarjeta de crédito
      </div>
    </div>
  );
}
