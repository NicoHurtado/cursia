'use client';

import {
  CheckCircle,
  Circle,
  BookOpen,
  Play,
  ArrowLeft,
  ArrowRight,
  Home,
} from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CourseViewMockupProps {
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
}

export function CourseViewMockup({ course }: CourseViewMockupProps) {
  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
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
          <Button className="bg-white/20 hover:bg-white/30 text-white">
            Cursia Course
          </Button>
          <div className="flex space-x-1">
            <div className="w-8 h-1 bg-white rounded"></div>
            <div className="w-8 h-1 bg-white rounded"></div>
            <div className="w-8 h-1 bg-white/50 rounded"></div>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <div className="flex items-center space-x-4 text-sm">
          <span>{course.progress}% completado</span>
          <Progress value={course.progress} className="w-32 h-2" />
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6">{course.title}</h2>

          {/* Current Lesson Content */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Lección 3 de 5: Estructuras de Control
                </CardTitle>
                <Badge variant="outline">En progreso</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-4">
                  ¿Qué son las estructuras de control?
                </h3>
                <p className="mb-4">
                  Las estructuras de control son elementos fundamentales en la
                  programación que nos permiten controlar el flujo de ejecución
                  de nuestro código. En Python, las principales estructuras de
                  control son:
                </p>

                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    <strong>Condicionales (if, elif, else):</strong> Permiten
                    ejecutar código basado en condiciones
                  </li>
                  <li>
                    <strong>Bucles (for, while):</strong> Repiten bloques de
                    código múltiples veces
                  </li>
                  <li>
                    <strong>Excepciones (try, except):</strong> Manejan errores
                    de manera controlada
                  </li>
                </ul>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">Ejemplo práctico:</h4>
                  <pre className="text-sm bg-white p-3 rounded border">
                    {`# Verificar si un número es par o impar
numero = 10
if numero % 2 == 0:
    print(f"{numero} es par")
else:
    print(f"{numero} es impar")`}
                  </pre>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 text-blue-400">💡</div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Consejo:</strong> Siempre usa indentación
                        consistente (4 espacios) para que tu código sea legible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Lección 3 de 5</span>
              <Progress value={60} className="w-32 h-2" />
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-50 p-6 space-y-6">
          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progreso del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Módulo 1: Introducción</span>
                    <span>100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Módulo 2: Variables</span>
                    <span>100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Módulo 3: Control</span>
                    <span>60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Módulo 4: Funciones</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Módulo 5: Proyecto</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Módulos del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    title: 'Introducción a Python',
                    completed: true,
                    current: false,
                  },
                  {
                    title: 'Variables y tipos de datos',
                    completed: true,
                    current: false,
                  },
                  {
                    title: 'Estructuras de control',
                    completed: false,
                    current: true,
                  },
                  {
                    title: 'Funciones y módulos',
                    completed: false,
                    current: false,
                  },
                  { title: 'Proyecto final', completed: false, current: false },
                ].map((module, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-2 rounded ${
                      module.current ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        module.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {module.completed ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`text-sm font-medium ${
                          module.current ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {module.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz del Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="font-semibold mb-2">
                  Quiz: Estructuras de Control
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  5 preguntas • 10 minutos
                </p>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600">
                  <Play className="w-4 h-4 mr-2" />
                  Tomar Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cursi Image */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-32 h-32 mx-auto mb-3 rounded-2xl overflow-hidden">
                <Image
                  src="/Cursi.png"
                  alt="Cursi mascot"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-gray-600">¡Sigue así!</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Continuar Curso
            </Button>
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
