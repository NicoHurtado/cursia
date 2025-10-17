import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Verificar que el curso existe y pertenece al usuario
    const course = await db.course.findFirst({
      where: {
        courseId: courseId,
        userId: session.user.id,
      },
      include: {
        modules: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verificar que solo el módulo 1 existe (los otros deben generarse)
    const existingModules = course.modules.length;
    if (existingModules < 1) {
      return NextResponse.json({ error: 'Course not ready' }, { status: 400 });
    }

    // Obtener la lista de módulos del curso
    const moduleList = JSON.parse(course.moduleList || '[]');
    const remainingModules = moduleList.slice(1); // Módulos 2-5

    if (remainingModules.length === 0) {
      return NextResponse.json({ message: 'All modules already generated' });
    }

    // Iniciar generación en background
    console.log('🚀 Starting background generation for remaining modules...');

    // No esperar la generación, devolver inmediatamente
    generateRemainingModulesInBackground(
      course.id,
      remainingModules,
      course.title || 'Course',
      course.userLevel
    );

    return NextResponse.json({
      message: 'Background generation started',
      remainingModules: remainingModules.length,
    });
  } catch (error) {
    console.error('Error starting module generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función para generar módulos restantes en background
async function generateRemainingModulesInBackground(
  courseId: string,
  moduleTitles: string[],
  courseTopic: string,
  level: string
) {
  try {
    for (let i = 0; i < moduleTitles.length; i++) {
      const moduleTitle = moduleTitles[i];
      const moduleNumber = i + 2; // Módulos 2-5

      console.log(`📚 Generating Module ${moduleNumber}: ${moduleTitle}`);

      // Crear el módulo en la base de datos
      const module = await db.module.create({
        data: {
          courseId: courseId,
          moduleOrder: moduleNumber,
          title: moduleTitle,
          description: `Módulo sobre ${moduleTitle.toLowerCase()}. Aprenderás los conceptos fundamentales y verás ejemplos prácticos de implementación.`,
        },
      });

      // Crear las 5 lecciones del módulo
      for (let j = 0; j < 5; j++) {
        const lessonNumber = j + 1;
        const lessonTitle = generateDescriptiveLessonTitle(
          moduleTitle,
          lessonNumber
        );
        const lessonContent = generateCompleteLessonContent(
          lessonTitle,
          moduleTitle
        );

        const miniDoc = {
          version: '1.0',
          locale: 'es',
          content_id: `module_${moduleNumber}_lesson_${lessonNumber}`,
          meta: {
            topic: lessonTitle,
            audience: 'Estudiantes',
            level: level as 'beginner' | 'intermediate' | 'advanced',
            created_at: new Date().toISOString().split('T')[0],
          },
          blocks: lessonContent,
        };

        await db.chunk.create({
          data: {
            moduleId: module.id,
            chunkOrder: j + 1,
            title: lessonTitle,
            content: JSON.stringify(miniDoc),
            videoData: null,
          },
        });
      }

      // Crear quiz del módulo
      const quiz = await db.quiz.create({
        data: {
          moduleId: module.id,
          quizOrder: 1,
          title: `Quiz: ${moduleTitle}`,
        },
      });

      await db.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionOrder: 1,
          question: `¿Cuál es el concepto principal de ${moduleTitle}?`,
          options: JSON.stringify([
            'Concepto clave',
            'Detalle menor',
            'Dato aislado',
            'Ejemplo aleatorio',
          ]),
          correctAnswer: 0,
          explanation:
            'Refuerza el concepto clave para consolidar el aprendizaje.',
        },
      });

      console.log(`✅ Module ${moduleNumber} completed successfully`);

      // Pequeña pausa entre módulos para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 All remaining modules generated successfully!');
  } catch (error) {
    console.error('❌ Error in background generation:', error);
  }
}

// Función para generar títulos descriptivos de lecciones
function generateDescriptiveLessonTitle(
  moduleTitle: string,
  lessonNumber: number
) {
  const lessonTitles = [
    '¿Para qué es necesario?',
    'Fundamentos',
    'Estructuras básicas',
    'Casos de uso y ejemplos',
    'Conclusión',
  ];

  return lessonTitles[lessonNumber - 1] || `Lección ${lessonNumber}`;
}

// Función para generar contenido completo de lección
function generateCompleteLessonContent(title: string, moduleTitle: string) {
  const timestamp = Date.now();

  let blocks: any[] = [];

  if (title === '¿Para qué es necesario?') {
    blocks = [
      {
        id: `heading_${timestamp}`,
        type: 'heading',
        data: { level: 1, text: title },
      },
      {
        id: `intro_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `En esta lección entenderemos por qué ${moduleTitle.toLowerCase()} es fundamental en programación y cuáles son sus ventajas principales.`,
        },
      },
      {
        id: `importance_${timestamp}`,
        type: 'heading',
        data: { level: 2, text: 'Importancia en el desarrollo' },
      },
      {
        id: `benefits_${timestamp}`,
        type: 'list',
        data: {
          style: 'bulleted',
          items: [
            'Mejora la eficiencia del código',
            'Facilita el mantenimiento',
            'Optimiza el uso de memoria',
            'Permite escalabilidad',
          ],
        },
      },
    ];
  } else if (title === 'Fundamentos') {
    blocks = [
      {
        id: `heading_${timestamp}`,
        type: 'heading',
        data: { level: 1, text: title },
      },
      {
        id: `intro_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `Exploraremos los conceptos teóricos fundamentales de ${moduleTitle.toLowerCase()} y sus principios básicos.`,
        },
      },
      {
        id: `theory_${timestamp}`,
        type: 'heading',
        data: { level: 2, text: 'Conceptos teóricos' },
      },
      {
        id: `theory_paragraph_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `Los fundamentos de ${moduleTitle.toLowerCase()} se basan en principios matemáticos y computacionales que permiten organizar y manipular datos de manera eficiente.`,
        },
      },
    ];
  } else if (title === 'Estructuras básicas') {
    blocks = [
      {
        id: `heading_${timestamp}`,
        type: 'heading',
        data: { level: 1, text: title },
      },
      {
        id: `intro_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `Aprenderemos las estructuras básicas de ${moduleTitle.toLowerCase()} y cómo implementarlas en Python.`,
        },
      },
      {
        id: `implementation_${timestamp}`,
        type: 'heading',
        data: { level: 2, text: 'Implementación básica' },
      },
      {
        id: `code_${timestamp}`,
        type: 'code',
        data: {
          language: 'python',
          snippet: `# Estructura básica de ${moduleTitle.toLowerCase()}\nclass EstructuraBasica:\n    def __init__(self):\n        self.datos = []\n    \n    def agregar(self, elemento):\n        self.datos.append(elemento)\n    \n    def obtener(self, indice):\n        return self.datos[indice]`,
        },
      },
    ];
  } else if (title === 'Casos de uso y ejemplos') {
    blocks = [
      {
        id: `heading_${timestamp}`,
        type: 'heading',
        data: { level: 1, text: title },
      },
      {
        id: `intro_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `Veremos ejemplos prácticos de ${moduleTitle.toLowerCase()} en situaciones reales de programación.`,
        },
      },
      {
        id: `example1_${timestamp}`,
        type: 'heading',
        data: { level: 2, text: 'Ejemplo 1: Aplicación básica' },
      },
      {
        id: `code1_${timestamp}`,
        type: 'code',
        data: {
          language: 'python',
          snippet: `# Ejemplo práctico de ${moduleTitle.toLowerCase()}\ndef procesar_datos(datos):\n    resultado = []\n    for item in datos:\n        if item > 0:\n            resultado.append(item * 2)\n    return resultado\n\n# Uso\ndatos = [1, 2, 3, 4, 5]\nresultado = procesar_datos(datos)\nprint(resultado)  # [2, 4, 6, 8, 10]`,
        },
      },
    ];
  } else if (title === 'Conclusión') {
    blocks = [
      {
        id: `heading_${timestamp}`,
        type: 'heading',
        data: { level: 1, text: title },
      },
      {
        id: `intro_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `Hemos completado el estudio de ${moduleTitle.toLowerCase()}. Resumamos los puntos clave aprendidos.`,
        },
      },
      {
        id: `summary_${timestamp}`,
        type: 'heading',
        data: { level: 2, text: 'Resumen de conceptos' },
      },
      {
        id: `summary_list_${timestamp}`,
        type: 'list',
        data: {
          style: 'bulleted',
          items: [
            'Entendimos la importancia de la estructura',
            'Aprendimos los fundamentos teóricos',
            'Implementamos estructuras básicas',
            'Vimos casos de uso prácticos',
          ],
        },
      },
    ];
  } else {
    // Fallback genérico
    blocks = [
      {
        id: `heading_${timestamp}`,
        type: 'heading',
        data: { level: 1, text: title },
      },
      {
        id: `intro_${timestamp}`,
        type: 'paragraph',
        data: {
          text: `En esta lección exploraremos ${title.toLowerCase()}. Aprenderemos los conceptos fundamentales y veremos ejemplos prácticos.`,
        },
      },
    ];
  }

  return blocks;
}
