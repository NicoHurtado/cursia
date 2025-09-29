import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { askClaude, generateCourseMetadata } from '@/lib/ai/anthropic';
import { simpleAI } from '@/lib/ai/simple';
import { ModuleContentSchema } from '@/lib/dto/course';
import { UserPlan } from '@/lib/plans';
import { ContractPromptBuilder } from '@/lib/ai/content-contract-prompts';
import { YouTubeService } from '@/lib/youtube';

// Función para generar títulos específicos de lecciones para cada módulo
async function generateSpecificLessonTitles(
  moduleTitle: string,
  courseTopic: string,
  level: string
): Promise<string[]> {
  try {
    console.log('🤖 Generating specific lesson titles using AI...');

    const systemPrompt = `Eres un experto en diseño de contenido educativo. Tu tarea es generar 5 títulos de lecciones específicas y únicas para un módulo.

REGLAS CRÍTICAS:
- Cada lección debe ser ÚNICA y específica del módulo
- NO uses plantillas genéricas como "Fundamentos", "Conclusión", "¿Para qué es necesario?"
- Cada título debe ser ACCIONABLE y CONCRETO
- Evita títulos vagos o genéricos
- Las lecciones deben cubrir subtemas distintos sin solaparse
- Cada lección debe mapearse directamente al tema del módulo

FORMATO DE SALIDA:
Responde SOLO con un JSON válido que contenga un array de 5 títulos:
{
  "lessonTitles": [
    "Título específico y accionable 1",
    "Título específico y accionable 2",
    "Título específico y accionable 3",
    "Título específico y accionable 4",
    "Título específico y accionable 5"
  ]
}

EJEMPLOS BUENOS:
- Para "Manipulación de datos": ["Manejo de errores básicos en pipelines", "Técnicas de limpieza y normalización", "Preparación de datos para modelos", "Tratamiento de valores nulos", "Optimización de rendimiento en procesamiento"]
- Para "Cocina saludable": ["Selección y almacenamiento de ingredientes frescos", "Técnicas de cocción que preservan nutrientes", "Combinación de sabores y texturas", "Adaptación de recetas tradicionales", "Planificación de menús equilibrados"]

EJEMPLOS MALOS (NO USAR):
- "Fundamentos", "Introducción", "Conclusión", "¿Para qué es necesario?", "Conceptos básicos"`;

    const userPrompt = `Genera 5 títulos de lecciones específicas y únicas para el módulo "${moduleTitle}" del curso sobre "${courseTopic}" (nivel: ${level}).

IMPORTANTE:
- Los títulos deben ser específicos del tema del módulo
- Deben ser accionables y concretos
- No uses plantillas genéricas
- Cada lección debe abordar un subtema distinto
- Los títulos deben reflejar el contenido específico que se enseñará

MÓDULO: ${moduleTitle}
CURSO: ${courseTopic}
NIVEL: ${level}

Responde SOLO con el JSON solicitado.`;

    const response = await askClaude({
      system: systemPrompt,
      user: userPrompt,
    });

    // Intentar parsear la respuesta JSON
    let lessonTitles: string[] = [];

    try {
      const jsonResponse = JSON.parse(response);
      if (
        jsonResponse.lessonTitles &&
        Array.isArray(jsonResponse.lessonTitles)
      ) {
        lessonTitles = jsonResponse.lessonTitles.slice(0, 5);
      }
    } catch (parseError) {
      console.error('❌ Error parsing lesson titles JSON:', parseError);
      console.log('Raw response:', response);

      // Fallback: extraer títulos del texto si el JSON falla
      const lines = response.split('\n').filter(line => line.trim());
      lessonTitles = lines
        .filter(line => line.match(/^\d+\.|^[-*]\s/))
        .map(line => line.replace(/^\d+\.\s*|^[-*]\s*/, '').trim())
        .slice(0, 5);
    }

    // Asegurar que tenemos exactamente 5 títulos
    while (lessonTitles.length < 5) {
      lessonTitles.push(
        `Lección específica ${lessonTitles.length + 1} de ${moduleTitle}`
      );
    }

    console.log('✅ Generated specific lesson titles:', lessonTitles);
    return lessonTitles;
  } catch (error) {
    console.error('❌ Error generating specific lesson titles:', error);

    // Fallback: títulos específicos basados en el módulo
    return generateFallbackLessonTitles(moduleTitle, courseTopic);
  }
}

// Función para generar títulos de fallback específicos
function generateFallbackLessonTitles(
  moduleTitle: string,
  courseTopic: string
): string[] {
  const moduleLower = moduleTitle.toLowerCase();
  const courseLower = courseTopic.toLowerCase();

  // Títulos específicos basados en el tema del módulo
  if (moduleLower.includes('manipulación') || moduleLower.includes('datos')) {
    return [
      'Manejo de errores básicos en pipelines de datos',
      'Técnicas de limpieza y normalización',
      'Preparación de datos para modelos',
      'Tratamiento de valores nulos y outliers',
      'Optimización de rendimiento en procesamiento',
    ];
  } else if (
    moduleLower.includes('cocina') ||
    moduleLower.includes('receta') ||
    courseLower.includes('comida')
  ) {
    return [
      'Selección y almacenamiento de ingredientes frescos',
      'Técnicas de cocción que preservan nutrientes',
      'Combinación de sabores y texturas equilibradas',
      'Adaptación de recetas tradicionales a versiones saludables',
      'Planificación de menús semanales balanceados',
    ];
  } else if (
    moduleLower.includes('programación') ||
    moduleLower.includes('código') ||
    courseLower.includes('python')
  ) {
    return [
      'Configuración del entorno de desarrollo',
      'Estructuras de datos fundamentales',
      'Control de flujo y funciones',
      'Manejo de errores y debugging',
      'Mejores prácticas y optimización',
    ];
  } else if (
    moduleLower.includes('arte') ||
    moduleLower.includes('dibujo') ||
    courseLower.includes('creativo')
  ) {
    return [
      'Fundamentos de composición visual',
      'Técnicas de color y contraste',
      'Perspectiva y proporciones',
      'Estilos y expresión personal',
      'Proyecto final integrador',
    ];
  } else {
    // Fallback genérico pero más específico
    return [
      `Fundamentos específicos de ${moduleTitle}`,
      `Aplicaciones prácticas en ${moduleTitle}`,
      `Técnicas avanzadas de ${moduleTitle}`,
      `Casos de uso reales de ${moduleTitle}`,
      `Integración y mejores prácticas de ${moduleTitle}`,
    ];
  }
}

// Función para generar lecciones completas e individuales usando IA (mismo sistema que Módulo 1)
async function generateCompleteLessonsForModule(
  moduleTitle: string,
  courseTopic: string,
  level: string
) {
  // Importar dependencias dinámicamente para evitar duplicaciones
  const { normalizeToContract } = await import('@/lib/content-normalizer');
  const { ContentContractValidator } = await import('@/lib/content-contract');

  const lessons = [];
  // Generate specific lesson titles for this module
  const lessonTitles = await generateSpecificLessonTitles(
    moduleTitle,
    courseTopic,
    level
  );

  console.log(`🎯 Generating 5 complete lessons for module: ${moduleTitle}`);

  for (let i = 0; i < lessonTitles.length; i++) {
    const lessonTitle = lessonTitles[i];
    const lessonNumber = i + 1;

    try {
      console.log(`📚 Generating lesson ${lessonNumber}/5: ${lessonTitle}`);

      // Generar lección completa usando IA
      const systemPrompt = ContractPromptBuilder.buildSystemPrompt('chunk');
      const userPrompt = ContractPromptBuilder.buildUserPrompt('chunk', {
        topic: courseTopic,
        level: level,
        interests: [],
        moduleTitle: moduleTitle,
        lessonTitle: lessonTitle,
        lessonNumber: lessonNumber,
        totalLessons: 5,
      });

      const aiResponse = await askClaude({
        system: systemPrompt,
        user: userPrompt,
      });

      // Parsear y normalizar la respuesta
      let lessonDoc;
      try {
        lessonDoc = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('❌ JSON parse error for lesson:', parseError);
        console.log('🔧 Attempting to repair JSON...');

        // Intentar reparar JSON
        const repairedJson = repairMalformedJson(aiResponse);
        if (repairedJson) {
          try {
            lessonDoc = JSON.parse(repairedJson);
            console.log('✅ JSON repaired successfully');
          } catch (repairError) {
            console.error('❌ Repaired JSON still invalid:', repairError);
            throw new Error('No valid JSON found in AI response');
          }
        } else {
          throw new Error('Could not repair malformed JSON');
        }
      }

      // Normalizar el documento
      const normalizedDoc = normalizeToContract(lessonDoc);

      // Validar el documento
      const validationResult =
        ContentContractValidator.validateDocument(normalizedDoc);
      if (!validationResult.isValid) {
        console.error(
          '❌ Content validation failed for lesson:',
          validationResult.errors
        );
        throw new Error(
          `Content validation failed: ${validationResult.errors.join(', ')}`
        );
      }

      // Buscar video para la lección 2
      let videoData = null;
      if (lessonNumber === 2) {
        try {
          console.log(`🎥 Searching for video for lesson: ${lessonTitle}`);
          console.log(
            `🔍 YouTube API Key available: ${process.env.YOUTUBE_DATA_API_KEY ? 'YES' : 'NO'}`
          );

          // Crear contenido de la lección para la búsqueda de video
          const lessonContent = normalizedDoc.blocks
            .map(block => {
              if (block.type === 'paragraph')
                return (block.data as any).text || '';
              if (block.type === 'heading')
                return (block.data as any).text || '';
              return '';
            })
            .join(' ')
            .slice(0, 500); // Limitar contenido para la búsqueda

          // Crear una consulta de búsqueda específica del módulo
          const moduleSpecificQuery = `${moduleTitle} ${lessonTitle}`;

          // Usar Promise.race para timeout de 10 segundos
          const videoPromise = YouTubeService.findVideoForChunk(
            moduleSpecificQuery,
            lessonContent,
            courseTopic,
            lessonNumber
          );

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Video search timeout')), 10000)
          );

          const video = (await Promise.race([
            videoPromise,
            timeoutPromise,
          ])) as any;
          if (video && video.title) {
            videoData = JSON.stringify(video);
            console.log(`✅ Video found: ${video.title}`);
          } else {
            console.log('⚠️ No video found for this lesson');
          }
        } catch (videoError) {
          console.error('❌ Error searching for video:', videoError);
        }
      }

      lessons.push({
        title: lessonTitle,
        blocks: normalizedDoc.blocks,
        videoData: videoData,
      });

      console.log(`✅ Lesson ${lessonNumber} generated successfully`);
    } catch (error) {
      console.error(`❌ Error generating lesson ${lessonNumber}:`, error);
      throw error; // Re-throw para que se maneje en el nivel superior
    }
  }

  // Generar preguntas de quiz basadas en el contenido del módulo
  console.log(`📝 Generating quiz questions for module: ${moduleTitle}`);
  const moduleContent = lessons
    .map(lesson => `${lesson.title}: ${JSON.stringify(lesson.blocks)}`)
    .join('\n\n');

  const quizQuestions = await generateQuizQuestions(
    moduleTitle,
    moduleContent,
    courseTopic,
    level
  );

  return {
    lessons,
    quizQuestions,
  };
}

// Función para generar preguntas de quiz usando IA
async function generateQuizQuestions(
  moduleTitle: string,
  moduleContent: string,
  courseTopic: string,
  level: string
): Promise<any[]> {
  try {
    console.log('🤖 Generating quiz questions using AI...');

    const systemPrompt = `Eres un experto en educación y evaluación. Tu tarea es generar 5 preguntas de quiz MUY ESPECÍFICAS del contenido del módulo.

REGLAS CRÍTICAS:
- Genera exactamente 5 preguntas
- Cada pregunta debe tener 4 opciones de respuesta
- Las preguntas DEBEN ser sobre conceptos, técnicas, métodos, ingredientes, procesos o información específica del tema
- NO uses preguntas genéricas como "¿Cuál es el concepto principal?"
- Las preguntas deben ser sobre detalles específicos del contenido
- Una opción debe ser claramente correcta, las otras 3 deben ser incorrectas pero plausibles
- Usa un lenguaje claro y profesional en español
- Las preguntas deben evaluar comprensión profunda del tema

EJEMPLOS DE BUENAS PREGUNTAS:
- Para comida saludable: "¿Cuáles son las proteínas presentes en el salmón?", "¿Cuál es el mejor método para cocinar verduras al vapor?", "¿Qué vitaminas se pierden al freír los alimentos?"
- Para programación: "¿Qué patrón de diseño se usa para crear objetos sin especificar su clase?", "¿Cuál es la complejidad temporal del algoritmo de ordenamiento burbuja?"
- Para arte: "¿Qué técnica de pintura al óleo permite crear transiciones suaves?", "¿Cuál es la regla de los tercios en composición fotográfica?"

CONTENIDO DEL MÓDULO: ${moduleContent}
TÍTULO DEL MÓDULO: ${moduleTitle}
TEMA DEL CURSO: ${courseTopic}
NIVEL: ${level}

Responde SOLO con un JSON válido que contenga un array de 5 preguntas:
{
  "questions": [
    {
      "question": "Pregunta específica sobre detalles del tema",
      "options": ["Respuesta específica correcta", "Respuesta incorrecta pero plausible", "Otra respuesta incorrecta", "Cuarta respuesta incorrecta"],
      "correctAnswer": 0,
      "explanation": "Explicación específica de por qué la respuesta es correcta"
    }
  ]
}`;

    const userPrompt = `Genera 5 preguntas de quiz MUY ESPECÍFICAS para el módulo "${moduleTitle}" sobre "${courseTopic}".

IMPORTANTE: Las preguntas deben ser sobre:
- Conceptos específicos del tema
- Técnicas, métodos o procesos mencionados
- Ingredientes, herramientas o elementos específicos
- Detalles técnicos o información concreta
- Aplicaciones prácticas del contenido

NO uses preguntas genéricas. Cada pregunta debe requerir conocimiento específico del contenido del módulo.

Responde SOLO con el JSON solicitado.`;

    const response = await askClaude({
      system: systemPrompt,
      user: userPrompt,
    });

    // Intentar parsear la respuesta JSON
    let questions: any[] = [];

    try {
      const jsonResponse = JSON.parse(response);
      if (jsonResponse.questions && Array.isArray(jsonResponse.questions)) {
        questions = jsonResponse.questions.slice(0, 5);
      }
    } catch (parseError) {
      console.error('❌ Error parsing quiz questions JSON:', parseError);
      console.log('Raw response:', response);

      // Fallback: generar preguntas básicas
      questions = generateFallbackQuizQuestions(moduleTitle, courseTopic);
    }

    // Asegurar que tenemos exactamente 5 preguntas
    while (questions.length < 5) {
      questions.push(
        generateFallbackQuizQuestion(
          moduleTitle,
          courseTopic,
          questions.length + 1
        )
      );
    }

    console.log('✅ Generated quiz questions:', questions.length);
    return questions;
  } catch (error) {
    console.error('❌ Error generating quiz questions:', error);

    // Fallback: generar preguntas básicas
    return generateFallbackQuizQuestions(moduleTitle, courseTopic);
  }
}

// Función para generar preguntas de fallback
function generateFallbackQuizQuestions(
  moduleTitle: string,
  courseTopic: string
): any[] {
  const questions = [];

  for (let i = 1; i <= 5; i++) {
    questions.push(generateFallbackQuizQuestion(moduleTitle, courseTopic, i));
  }

  return questions;
}

// Función para generar una pregunta de fallback individual
function generateFallbackQuizQuestion(
  moduleTitle: string,
  courseTopic: string,
  questionNumber: number
): any {
  // Generar preguntas más específicas basadas en el tema del curso
  const isHealthyFood =
    courseTopic.toLowerCase().includes('comida') ||
    courseTopic.toLowerCase().includes('alimentación') ||
    courseTopic.toLowerCase().includes('saludable');
  const isProgramming =
    courseTopic.toLowerCase().includes('programación') ||
    courseTopic.toLowerCase().includes('código') ||
    courseTopic.toLowerCase().includes('desarrollo');
  const isArt =
    courseTopic.toLowerCase().includes('arte') ||
    courseTopic.toLowerCase().includes('dibujo') ||
    courseTopic.toLowerCase().includes('pintura');

  let questionTemplates: string[];
  let optionTemplates: string[][];
  let explanations: string[];

  if (isHealthyFood) {
    questionTemplates = [
      `¿Cuáles son las proteínas principales en ${moduleTitle}?`,
      `¿Cuál es el mejor método de cocción para ${moduleTitle}?`,
      `¿Qué vitaminas se conservan mejor en ${moduleTitle}?`,
      `¿Cuál es la temperatura ideal para cocinar ${moduleTitle}?`,
      `¿Qué nutrientes aporta principalmente ${moduleTitle}?`,
    ];
    optionTemplates = [
      [
        'Proteínas completas',
        'Proteínas incompletas',
        'Solo carbohidratos',
        'Solo grasas',
      ],
      ['Al vapor', 'Frito', 'Crudo', 'Quemado'],
      [
        'Vitaminas hidrosolubles',
        'Vitaminas liposolubles',
        'Solo minerales',
        'Solo fibra',
      ],
      ['180°C', '100°C', '300°C', '50°C'],
      ['Proteínas', 'Carbohidratos', 'Grasas saturadas', 'Azúcares'],
    ];
    explanations = [
      'Las proteínas completas contienen todos los aminoácidos esenciales.',
      'La cocción al vapor preserva mejor los nutrientes.',
      'Las vitaminas hidrosolubles se conservan mejor con este método.',
      'Esta temperatura es ideal para cocción saludable.',
      'Este nutriente es el principal aporte nutricional.',
    ];
  } else if (isProgramming) {
    questionTemplates = [
      `¿Qué patrón de diseño se aplica en ${moduleTitle}?`,
      `¿Cuál es la complejidad temporal de ${moduleTitle}?`,
      `¿Qué estructura de datos se usa en ${moduleTitle}?`,
      `¿Cuál es el principio SOLID aplicado en ${moduleTitle}?`,
      `¿Qué algoritmo se implementa en ${moduleTitle}?`,
    ];
    optionTemplates = [
      ['Singleton', 'Factory', 'Observer', 'Decorator'],
      ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      ['Array', 'Lista enlazada', 'Hash table', 'Stack'],
      [
        'Single Responsibility',
        'Open/Closed',
        'Liskov Substitution',
        'Interface Segregation',
      ],
      ['Búsqueda binaria', 'Ordenamiento burbuja', 'Recursión', 'Iteración'],
    ];
    explanations = [
      'Este patrón es el más apropiado para este caso de uso.',
      'Esta es la complejidad temporal correcta del algoritmo.',
      'Esta estructura de datos es la más eficiente para este problema.',
      'Este principio SOLID se aplica directamente en esta situación.',
      'Este algoritmo es el más eficiente para resolver el problema.',
    ];
  } else if (isArt) {
    questionTemplates = [
      `¿Qué técnica de color se usa en ${moduleTitle}?`,
      `¿Cuál es la regla de composición aplicada en ${moduleTitle}?`,
      `¿Qué material es más apropiado para ${moduleTitle}?`,
      `¿Cuál es el principio de perspectiva en ${moduleTitle}?`,
      `¿Qué estilo artístico se refleja en ${moduleTitle}?`,
    ];
    optionTemplates = [
      ['Complementarios', 'Análogos', 'Monocromáticos', 'Triádicos'],
      ['Regla de tercios', 'Simetría', 'Punto de fuga', 'Líneas guía'],
      ['Óleo', 'Acuarela', 'Carboncillo', 'Lápiz'],
      ['Punto de fuga', 'Escala de valores', 'Proporción áurea', 'Contraste'],
      ['Realismo', 'Impresionismo', 'Abstracto', 'Cubismo'],
    ];
    explanations = [
      'Esta técnica de color crea el efecto visual deseado.',
      'Esta regla de composición mejora la armonía visual.',
      'Este material es el más apropiado para la técnica.',
      'Este principio de perspectiva es fundamental en la composición.',
      'Este estilo artístico se refleja en las características visuales.',
    ];
  } else {
    // Fallback genérico pero más específico
    questionTemplates = [
      `¿Cuál es el método principal utilizado en ${moduleTitle}?`,
      `¿Qué característica específica define ${moduleTitle}?`,
      `¿Cuál es el proceso clave en ${moduleTitle}?`,
      `¿Qué elemento es fundamental en ${moduleTitle}?`,
      `¿Cuál es la técnica principal de ${moduleTitle}?`,
    ];
    optionTemplates = [
      [
        'Método principal',
        'Método secundario',
        'Método alternativo',
        'Método básico',
      ],
      [
        'Característica específica',
        'Característica general',
        'Característica opcional',
        'Característica básica',
      ],
      [
        'Proceso clave',
        'Proceso secundario',
        'Proceso alternativo',
        'Proceso básico',
      ],
      [
        'Elemento fundamental',
        'Elemento secundario',
        'Elemento opcional',
        'Elemento básico',
      ],
      [
        'Técnica principal',
        'Técnica secundaria',
        'Técnica alternativa',
        'Técnica básica',
      ],
    ];
    explanations = [
      'Este método es el más efectivo para lograr los objetivos.',
      'Esta característica es la que define específicamente el concepto.',
      'Este proceso es esencial para el funcionamiento correcto.',
      'Este elemento es fundamental para el éxito del método.',
      'Esta técnica es la más apropiada para la situación.',
    ];
  }

  const templateIndex = (questionNumber - 1) % questionTemplates.length;

  return {
    question: questionTemplates[templateIndex],
    options: optionTemplates[templateIndex],
    correctAnswer: 0,
    explanation: explanations[templateIndex],
  };
}

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

    // Get user info to check plan
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the course can be accessed by the user
    // Only allow access to courses that the user owns (either created by them or cloned from community)
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id, // User must own the course (own or cloned)
        deletedAt: null, // Not deleted
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course has metadata
    if (!course.title || !course.description) {
      return NextResponse.json(
        { error: 'Course metadata not ready' },
        { status: 400 }
      );
    }

    // Get existing modules with their chunks
    const existingModules = await db.module.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        chunks: true,
      },
      orderBy: {
        moduleOrder: 'asc',
      },
    });

    // Parse module list once at the beginning
    const moduleList = JSON.parse(course.moduleList);

    // Check if module 1 has content
    const module1 = existingModules.find(m => m.moduleOrder === 1);
    if (!module1 || module1.chunks.length === 0) {
      console.log(
        'Module 1 not ready yet - content is being generated in background'
      );
      return NextResponse.json(
        {
          error:
            'Module 1 content is still being generated. Please wait a moment and try again.',
          status: 'generating',
        },
        { status: 202 }
      );
    }

    // Check if we need to generate remaining modules in background
    const modulesToGenerate = existingModules.filter(
      module => module.chunks.length === 0 && module.moduleOrder > 1
    );

    if (modulesToGenerate.length > 0) {
      console.log(
        `🚀 Starting background generation for ${modulesToGenerate.length} remaining modules...`
      );

      // Generar módulos en background sin bloquear la respuesta
      generateRemainingModulesDirectly(courseId, course)
        .then(() => {
          console.log('🎉 Background module generation completed successfully');
        })
        .catch(error => {
          console.error('❌ Error generating remaining modules:', error);
        });
    }

    // Check if this is the first time starting this course
    const hasStartedBefore = await db.userProgress.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    // Only count the course if it's the first time starting
    if (!hasStartedBefore) {
      // Create UserProgress record to track that this course has been started
      await db.userProgress.create({
        data: {
          userId: session.user.id,
          courseId: courseId,
        },
      });

      console.log(
        `✅ Course ${courseId} started and counted for user ${session.user.id}`
      );
      console.log(
        `📊 UserProgress record created at: ${new Date().toISOString()}`
      );
    } else {
      console.log(
        `ℹ️ Course ${courseId} already started before, not counting again`
      );
    }

    // Course is ready to start - module 1 has content
    return NextResponse.json({
      success: true,
      message: 'Course started successfully',
      modulesReady: existingModules.filter(m => m.chunks.length > 0).length,
      totalModules: course.totalModules,
    });
  } catch (error) {
    console.error('Start course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateModulesInBackground(
  courseId: string,
  modulesToGenerate: any[],
  moduleList: string[],
  course: any
) {
  console.log(`🔄 Starting background generation for course ${courseId}`);

  try {
    // Import required modules
    const { simpleAI } = await import('@/lib/ai/simple');
    const { YouTubeService } = await import('@/lib/youtube');

    for (const module of modulesToGenerate) {
      const moduleTitle = moduleList[module.moduleOrder - 1];

      if (moduleTitle) {
        try {
          console.log(
            `📝 [BACKGROUND] Generating module ${module.moduleOrder}: ${moduleTitle}`
          );

          // Generate module content
          const moduleContentJson = await simpleAI.generateModuleContent(
            course.title || 'Course',
            moduleTitle,
            module.moduleOrder,
            course.totalModules,
            course.description || ''
          );
          // Since generateModuleContent already returns a structured object,
          // do not JSON.parse. Use it directly.
          const moduleContent = moduleContentJson;

          // Update module with generated content
          await db.module.update({
            where: { id: module.id },
            data: {
              title: moduleContent.title,
              description: moduleContent.description,
            },
          });

          // Create chunks with videos
          for (let j = 0; j < moduleContent.chunks.length; j++) {
            const chunk = moduleContent.chunks[j];
            const chunkOrder = j + 1;

            // Search for video if this is the second chunk
            let videoData = null;
            if (chunkOrder === 2) {
              try {
                const video = await YouTubeService.findVideoForChunk(
                  chunk.title,
                  chunk.content,
                  course.title || 'Course',
                  chunkOrder
                );
                if (video) {
                  videoData = JSON.stringify(video);
                  console.log(
                    `✅ [BACKGROUND] Video found for chunk: ${chunk.title}`
                  );
                }
              } catch (error) {
                console.error('[BACKGROUND] Error searching for video:', error);
              }
            }

            await db.chunk.create({
              data: {
                moduleId: module.id,
                chunkOrder: chunkOrder,
                title: chunk.title,
                content: chunk.content,
                videoData: videoData,
              },
            });
          }

          // Create quiz
          const quiz = await db.quiz.create({
            data: {
              moduleId: module.id,
              quizOrder: 1,
              title: moduleContent.quiz.title,
            },
          });

          // Create quiz questions
          for (const [
            index,
            question,
          ] of moduleContent.quiz.questions.entries()) {
            await db.quizQuestion.create({
              data: {
                quizId: quiz.id,
                questionOrder: index + 1,
                question: question.question,
                options: JSON.stringify(question.options),
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || null,
              },
            });
          }

          console.log(
            `✅ [BACKGROUND] Module ${module.moduleOrder} generated successfully`
          );

          // Small delay between modules to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(
            `❌ [BACKGROUND] Error generating module ${module.moduleOrder}:`,
            error
          );
        }
      }
    }

    console.log(
      `🎉 [BACKGROUND] All modules generated successfully for course ${courseId}`
    );
  } catch (error) {
    console.error(
      `❌ [BACKGROUND] Failed to generate modules for course ${courseId}:`,
      error
    );
  }
}

// Función para generar módulos restantes directamente usando el mismo sistema que Módulo 1
async function generateRemainingModulesDirectly(courseId: string, course: any) {
  try {
    console.log(
      '🚀 Starting direct generation for remaining modules using Module 1 system...'
    );

    // Obtener la lista de módulos del curso
    const moduleList = JSON.parse(course.moduleList || '[]');
    const remainingModules = moduleList.slice(1); // Módulos 2-5

    if (remainingModules.length === 0) {
      console.log('No modules to generate');
      return;
    }

    for (let i = 0; i < remainingModules.length; i++) {
      const moduleTitle = remainingModules[i];
      const moduleNumber = i + 2; // Módulos 2-5

      try {
        console.log(
          `📚 Generating Module ${moduleNumber}: ${moduleTitle} using Module 1 system`
        );
        console.log(`🔄 Progress: ${i + 1}/${remainingModules.length} modules`);

        // Usar el mismo sistema que Módulo 1: generar lecciones individuales completas
        const moduleResult = await generateCompleteLessonsForModule(
          moduleTitle,
          course.title || 'Course',
          course.userLevel || 'intermedio'
        );
        const moduleLessons = moduleResult.lessons;
        const moduleQuizQuestions = moduleResult.quizQuestions;

        console.log(
          `✅ Generated ${moduleLessons.length} lessons for Module ${moduleNumber}`
        );

        // Verificar si el módulo ya existe, si no, crearlo
        let module = await db.module.findFirst({
          where: {
            courseId: courseId,
            moduleOrder: moduleNumber,
          },
        });

        if (!module) {
          // Crear el módulo en la base de datos
          module = await db.module.create({
            data: {
              courseId: courseId,
              moduleOrder: moduleNumber,
              title: moduleTitle,
              description: `Módulo ${moduleNumber}: ${moduleTitle}`,
            },
          });
        } else {
          // Actualizar el módulo existente
          module = await db.module.update({
            where: { id: module.id },
            data: {
              title: moduleTitle,
              description: `Módulo ${moduleNumber}: ${moduleTitle}`,
            },
          });
        }

        // Crear las 5 lecciones del módulo usando el sistema robusto
        console.log(
          `📝 Creating ${moduleLessons.length} chunks for module ${moduleNumber}...`
        );
        for (let j = 0; j < moduleLessons.length; j++) {
          const lesson = moduleLessons[j];
          const lessonNumber = j + 1;
          console.log(`  📄 Creating chunk ${lessonNumber}: ${lesson.title}`);

          const miniDoc = {
            version: '1.0',
            locale: 'es',
            content_id: `module_${moduleNumber}_lesson_${lessonNumber}`,
            meta: {
              topic: lesson.title,
              audience: 'Estudiantes',
              level: course.userLevel as
                | 'beginner'
                | 'intermediate'
                | 'advanced',
              created_at: new Date().toISOString().split('T')[0],
            },
            blocks: lesson.blocks,
          };

          // Verificar si el chunk ya existe
          const existingChunk = await db.chunk.findFirst({
            where: {
              moduleId: module.id,
              chunkOrder: j + 1,
            },
          });

          if (!existingChunk) {
            await db.chunk.create({
              data: {
                moduleId: module.id,
                chunkOrder: j + 1,
                title: lesson.title,
                content: JSON.stringify(miniDoc),
                videoData: lesson.videoData || null, // Incluir videoData si existe
              },
            });
            console.log(`  ✅ Chunk ${lessonNumber} created`);
          } else {
            // Actualizar el chunk existente
            await db.chunk.update({
              where: { id: existingChunk.id },
              data: {
                title: lesson.title,
                content: JSON.stringify(miniDoc),
                videoData: lesson.videoData || null, // Incluir videoData si existe
              },
            });
            console.log(`  ✅ Chunk ${lessonNumber} updated`);
          }
        }

        // Crear o actualizar quiz del módulo
        let quiz = await db.quiz.findFirst({
          where: {
            moduleId: module.id,
            quizOrder: 1,
          },
        });

        if (!quiz) {
          quiz = await db.quiz.create({
            data: {
              moduleId: module.id,
              quizOrder: 1,
              title: `Quiz: ${moduleTitle}`,
            },
          });
        } else {
          quiz = await db.quiz.update({
            where: { id: quiz.id },
            data: {
              title: `Quiz: ${moduleTitle}`,
            },
          });
        }

        // Generar 5 preguntas de quiz específicas para este módulo
        console.log(`📝 Generating quiz questions for module: ${moduleTitle}`);

        // Obtener el contenido del módulo para generar preguntas específicas
        const moduleChunks = await db.chunk.findMany({
          where: { moduleId: module.id },
          orderBy: { chunkOrder: 'asc' },
        });

        const moduleContentText = moduleChunks
          .map(chunk => `${chunk.title}: ${chunk.content}`)
          .join('\n\n');

        // Generar preguntas usando IA
        const generatedQuizQuestions = await generateQuizQuestions(
          moduleTitle,
          moduleContentText,
          course.title || '',
          course.level || 'intermedio'
        );

        // Eliminar preguntas existentes
        await db.quizQuestion.deleteMany({
          where: { quizId: quiz.id },
        });

        // Crear las 5 preguntas del quiz
        for (let q = 0; q < generatedQuizQuestions.length; q++) {
          const question = generatedQuizQuestions[q];
          await db.quizQuestion.create({
            data: {
              quizId: quiz.id,
              questionOrder: q + 1,
              question: question.question,
              options: JSON.stringify(question.options),
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            },
          });
        }
        console.log(
          `✅ Created ${generatedQuizQuestions.length} quiz questions for module ${moduleNumber}`
        );

        console.log(`✅ Module ${moduleNumber} completed successfully`);

        // Pequeña pausa entre módulos para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error generating Module ${moduleNumber}:`, error);
        console.log(
          `⚠️ Skipping Module ${moduleNumber} and continuing with next module...`
        );
        // Continuar con el siguiente módulo en lugar de detener todo el proceso
        continue;
      }
    }

    console.log('🎉 All remaining modules generated successfully!');

    // Actualizar el estado del curso para indicar que todos los módulos están listos
    await db.course.update({
      where: { id: courseId },
      data: {
        status: 'READY',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Error in generateRemainingModulesDirectly:', error);
    // No lanzar el error para evitar que detenga el proceso
    console.log('⚠️ Continuing despite error in module generation');
  }
}

// Función para reparar JSON malformado
function repairMalformedJson(jsonString: string): string | null {
  try {
    // Intentar reparar problemas comunes de JSON malformado
    let repaired = jsonString;

    // 1. Limpiar caracteres de control problemáticos
    repaired = repaired.replace(/[\x00-\x1F\x7F]/g, '');

    // 2. Escapar caracteres problemáticos en strings
    repaired = repaired.replace(/\\(?!["\\/bfnrt])/g, '\\\\');

    // 3. Cerrar strings no terminados
    repaired = repaired.replace(/"([^"]*)$/gm, '"$1"');

    // 4. Cerrar arrays no terminados
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }

    // 5. Cerrar objetos no terminados
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }

    // 6. Agregar comas faltantes entre elementos de array
    repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
    repaired = repaired.replace(/}\s*\n\s*{/g, '},\n{');
    repaired = repaired.replace(/]\s*\n\s*\[/g, '],\n[');

    // 7. Agregar comas faltantes antes de cierre de array/objeto
    repaired = repaired.replace(/([^,}\]])\s*([}\]])/g, '$1,$2');

    // 8. Limpiar comas duplicadas
    repaired = repaired.replace(/,+/g, ',');
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // 9. Limpiar saltos de línea problemáticos en strings
    repaired = repaired.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');

    // Verificar que el JSON reparado sea válido
    JSON.parse(repaired);
    return repaired;
  } catch (error) {
    console.error('❌ JSON repair failed:', error);
    return null;
  }
}

// Función para generar contenido de módulo usando IA
async function generateModuleContentWithAI(
  moduleTitle: string,
  courseTopic: string,
  level: string
) {
  try {
    console.log(`🤖 Generating AI content for module: ${moduleTitle}`);

    const systemPrompt = ContractPromptBuilder.buildSystemPrompt('module');
    const userPrompt = ContractPromptBuilder.buildUserPrompt('module', {
      topic: `${courseTopic} - ${moduleTitle}`,
      level: level as 'beginner' | 'intermediate' | 'advanced',
      interests: [],
    });

    const aiResponse = await generateCourseMetadata(userPrompt, level, []);

    // Parsear y normalizar la respuesta
    let doc;
    try {
      doc = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('🔧 Attempting to repair JSON...');

      // Intentar reparar JSON malformado
      const repairedJson = repairMalformedJson(aiResponse);
      if (repairedJson) {
        try {
          doc = JSON.parse(repairedJson);
          console.log('✅ JSON repaired and parsed successfully');
        } catch (repairError) {
          console.error('❌ Repair failed:', repairError);
          // Intentar extraer JSON del markdown
          const jsonMatch =
            aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
            aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const repairedMatch = repairMalformedJson(
              jsonMatch[1] || jsonMatch[0]
            );
            doc = JSON.parse(repairedMatch || jsonMatch[1] || jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in AI response');
          }
        }
      } else {
        // Intentar extraer JSON del markdown
        const jsonMatch =
          aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
          aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const repairedMatch = repairMalformedJson(
            jsonMatch[1] || jsonMatch[0]
          );
          doc = JSON.parse(repairedMatch || jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      }
    }

    // Importar dependencias dinámicamente
    const { normalizeToContract } = await import('@/lib/content-normalizer');
    const { ContentContractValidator } = await import('@/lib/content-contract');

    // Normalizar y validar
    const normalizedDoc = normalizeToContract(doc);
    const validationResult =
      ContentContractValidator.validateDocument(normalizedDoc);

    if (!validationResult.isValid) {
      console.error('❌ Content validation failed:', validationResult.errors);
      throw new Error(
        `Invalid ContentDocument: ${validationResult.errors.join(', ')}`
      );
    }

    return {
      blocks: normalizedDoc.blocks,
      description:
        (
          normalizedDoc.blocks.find((b: any) => b.type === 'paragraph')
            ?.data as any
        )?.text?.slice(0, 300) || `Módulo sobre ${moduleTitle}`,
    };
  } catch (error) {
    console.error(
      `❌ Error generating AI content for module ${moduleTitle}:`,
      error
    );
    // Fallback: generar contenido básico
    return {
      blocks: [
        {
          id: `intro_${Date.now()}`,
          type: 'heading',
          data: { level: 1, text: moduleTitle },
        },
        {
          id: `content_${Date.now()}`,
          type: 'paragraph',
          data: {
            text: `En este módulo aprenderás sobre ${moduleTitle.toLowerCase()}. Este contenido se está generando automáticamente.`,
          },
        },
      ],
      description: `Módulo sobre ${moduleTitle}`,
    };
  }
}

// Función para dividir el contenido en lecciones dinámicas
function generateModuleLessonsFromContent(blocks: any[], moduleTitle: string) {
  const lessons = [];

  // Buscar headings H3 que representen lecciones específicas
  const h3Indices = blocks
    .map((b, i) => ({ block: b, idx: i }))
    .filter(
      item => item.block.type === 'heading' && item.block.data?.level === 3
    );

  // Si hay suficientes H3, usarlos como lecciones
  if (h3Indices.length >= 4) {
    for (let i = 0; i < h3Indices.length; i++) {
      const start = h3Indices[i].idx;
      const end = h3Indices[i + 1]?.idx || blocks.length;
      const lessonBlocks = blocks.slice(start, end);
      const title = h3Indices[i].block.data.text;
      lessons.push({
        title,
        blocks: ensureCompleteLessonStructure(lessonBlocks, title),
      });
    }
  } else {
    // Buscar otros patrones de división (H2 secundarios, listas largas, etc.)
    const divisionPoints = findNaturalDivisionPoints(blocks);

    if (divisionPoints.length >= 4) {
      for (let i = 0; i < divisionPoints.length; i++) {
        const start = divisionPoints[i];
        const end = divisionPoints[i + 1] || blocks.length;
        const lessonBlocks = blocks.slice(start, end);
        const title = extractLessonTitle(lessonBlocks, moduleTitle, i + 1);
        lessons.push({
          title,
          blocks: ensureCompleteLessonStructure(lessonBlocks, title),
        });
      }
    } else {
      // Fallback: dividir por tamaño equilibrado
      const size = Math.max(1, Math.ceil(blocks.length / 5));
      for (let i = 0; i < 5; i++) {
        const start = i * size;
        const end = Math.min(blocks.length, start + size);
        const lessonBlocks = blocks.slice(start, end);
        const title = extractLessonTitle(lessonBlocks, moduleTitle, i + 1);
        lessons.push({
          title,
          blocks: ensureCompleteLessonStructure(lessonBlocks, title),
        });
      }
    }
  }

  return lessons;
}

// Función para encontrar puntos naturales de división en el contenido
function findNaturalDivisionPoints(blocks: any[]): number[] {
  const points: number[] = [];

  // Buscar H2, H3, listas largas, código, etc.
  blocks.forEach((block, index) => {
    if (
      block.type === 'heading' &&
      (block.data?.level === 2 || block.data?.level === 3)
    ) {
      points.push(index);
    } else if (block.type === 'list' && block.data?.items?.length > 3) {
      points.push(index);
    } else if (block.type === 'code' && block.data?.snippet?.length > 100) {
      points.push(index);
    }
  });

  return points;
}

// Función para extraer títulos de lecciones del contenido
function extractLessonTitle(
  blocks: any[],
  moduleTitle: string,
  lessonNumber: number
) {
  // Buscar el primer heading en los bloques
  const heading = blocks.find(b => b.type === 'heading');
  if (heading && heading.data?.text) {
    return heading.data.text;
  }

  // Buscar párrafos que puedan ser títulos
  const paragraph = blocks.find(
    b => b.type === 'paragraph' && b.data?.text?.length < 100
  );
  if (paragraph && paragraph.data?.text) {
    return paragraph.data.text;
  }

  // Generar título basado en el contenido
  return generateDynamicLessonTitle(blocks, moduleTitle, lessonNumber);
}

// Función para generar títulos dinámicos basados en el contenido
function generateDynamicLessonTitle(
  blocks: any[],
  moduleTitle: string,
  lessonNumber: number
) {
  const keywords = extractKeywords(blocks);
  const moduleKeywords = moduleTitle.toLowerCase().split(' ').slice(0, 2);

  const lessonTemplates = [
    `Introducción a ${keywords[0] || moduleKeywords[0]}`,
    `Conceptos fundamentales de ${keywords[0] || moduleKeywords[0]}`,
    `Implementación práctica de ${keywords[0] || moduleKeywords[0]}`,
    `Casos de uso avanzados`,
    `Mejores prácticas y optimización`,
    `Aplicaciones en el mundo real`,
  ];

  return (
    lessonTemplates[lessonNumber - 1] ||
    `Lección ${lessonNumber}: ${moduleTitle}`
  );
}

// Función para extraer palabras clave del contenido
function extractKeywords(blocks: any[]): string[] {
  const keywords: string[] = [];
  const commonWords = [
    'el',
    'la',
    'de',
    'en',
    'y',
    'a',
    'que',
    'es',
    'con',
    'para',
    'por',
    'del',
    'las',
    'los',
    'un',
    'una',
  ];

  blocks.forEach(block => {
    if (block.type === 'paragraph' && block.data?.text) {
      const words = block.data.text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(
          (word: string) => word.length > 3 && !commonWords.includes(word)
        );
      keywords.push(...words.slice(0, 3));
    }
  });

  return [...new Set(keywords)].slice(0, 3);
}

// Función para asegurar estructura completa de lección
function ensureCompleteLessonStructure(blocks: any[], title: string) {
  // Implementación básica - puedes expandir esto según necesites
  return blocks;
}
