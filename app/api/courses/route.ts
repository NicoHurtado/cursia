import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

import { askClaude, generateCourseMetadata } from '@/lib/ai/anthropic';
import { ContractPromptBuilder } from '@/lib/ai/content-contract-prompts';
import { authOptions } from '@/lib/auth';
import {
  ContentContractValidator,
  ContentDocument,
} from '@/lib/content-contract';
import { normalizeToContract } from '@/lib/content-normalizer';
import { contentStore } from '@/lib/content-store';
import { ContentValidator } from '@/lib/content-validator';
import { db } from '@/lib/db';
import {
  CourseCreateRequest,
  CourseCreateRequestSchema,
  CourseCreateResponse,
  CourseMetadataSchema,
  ModuleContentSchema,
} from '@/lib/dto/course';
import { safeJsonParseArray } from '@/lib/json-utils';
import { UserPlan, canCreateCourse } from '@/lib/plans';
import { YouTubeService } from '@/lib/youtube';
import {
  parseAIJsonRobust,
  repairContentDocument,
} from '@/lib/json-parser-robust';

// Enhanced rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 requests per minute per user

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all courses for the user (excluding deleted ones) - Optimized query
    const courses = await db.course.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null, // Exclude deleted courses
      },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        totalModules: true,
        isPublic: true,
        _count: {
          select: {
            modules: true,
          },
        },
        modules: {
          select: {
            id: true,
            chunks: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc', // Use updatedAt for better performance
      },
      take: 50, // Limit to 50 courses for better performance
    });

    // Get user progress for all courses to calculate real completion percentage
    const userProgresses = await db.userProgress.findMany({
      where: {
        userId: session.user.id,
        courseId: {
          in: courses.map(c => c.id),
        },
      },
      select: {
        courseId: true,
        completedChunks: true,
      },
    });

    // Create a map for quick lookup
    const progressMap = new Map();
    userProgresses.forEach(progress => {
      const completedChunks = safeJsonParseArray(progress.completedChunks);
      progressMap.set(progress.courseId, completedChunks);
    });

    // Map courses to response format
    const response = courses.map(course => {
      // Calculate total chunks across all modules
      const totalChunks = course.modules.reduce(
        (sum, module) => sum + module.chunks.length,
        0
      );

      // Get completed chunks for this course
      const completedChunks = progressMap.get(course.id) || [];

      // Calculate real completion percentage
      const completionPercentage =
        totalChunks > 0
          ? Math.round((completedChunks.length / totalChunks) * 100)
          : 0;

      return {
        id: course.id,
        courseId: course.courseId,
        title: course.title || 'Generating...',
        description:
          course.description ||
          'Course description will appear here once generated.',
        status: course.status.toLowerCase(),
        status_display: course.status,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        completedAt: course.completedAt?.toISOString() || null,
        totalModules: course.totalModules,
        completedModules: course._count.modules,
        isPublic: course.isPublic || false,
        completionPercentage,
        totalChunks,
        completedChunks: completedChunks.length,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Courses list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función para generar topics específicos del curso usando IA
async function generateSpecificCourseTopics(
  courseTopic: string,
  existingTopics: string[],
  level: string
): Promise<string[]> {
  try {
    console.log('🤖 Generating specific course topics using AI...');

    const systemPrompt = `Eres un experto en educación y diseño de cursos. Tu tarea es generar 5 conceptos clave específicos para un curso.

REGLAS IMPORTANTES:
- Cada topic debe ser un CONCEPTO CLAVE del tema (no una lección específica)
- Deben ser conceptos fundamentales que se aprenden en el curso
- Palabras o frases cortas (1-3 palabras máximo)
- Diferentes de los títulos de los módulos (que son más descriptivos)
- Relevantes y específicos al tema del curso
- En español

EJEMPLOS:
- Para "Comidas saludables": "Alimentos nutritivos", "Métodos de cocción", "Planificación de menús"
- Para "Programación": "POO", "Manejo de errores", "Estructuras de datos"
- Para "Marketing": "SEO", "Analytics", "Branding"

TEMA DEL CURSO: ${courseTopic}
NIVEL: ${level}

TOPICS EXISTENTES (si los hay): ${existingTopics.join(', ')}

Responde SOLO con un JSON válido que contenga un array de 5 strings con los conceptos clave:
{
  "topics": [
    "Concepto clave 1",
    "Concepto clave 2", 
    "Concepto clave 3",
    "Concepto clave 4",
    "Concepto clave 5"
  ]
}`;

    const userPrompt = `Genera 5 conceptos clave específicos para un curso sobre "${courseTopic}". 
    
Los conceptos deben ser:
- CONCEPTOS FUNDAMENTALES del tema (no lecciones específicas)
- Palabras o frases cortas (1-3 palabras máximo)
- Diferentes de los títulos de los módulos
- Relevantes al tema del curso
- En español

Responde SOLO con el JSON solicitado.`;

    const response = await askClaude({
      system: systemPrompt,
      user: userPrompt,
    });

    // Intentar parsear la respuesta JSON
    let topics: string[] = [];

    try {
      const jsonResponse = JSON.parse(response);
      if (jsonResponse.topics && Array.isArray(jsonResponse.topics)) {
        topics = jsonResponse.topics.slice(0, 5);
      }
    } catch (parseError) {
      console.error('❌ Error parsing topics JSON:', parseError);
      console.log('Raw response:', response);

      // Fallback: extraer topics de la respuesta de texto
      const lines = response.split('\n').filter((line: string) => line.trim());
      topics = lines
        .map((line: string) =>
          line
            .replace(/^\d+\.?\s*/, '')
            .replace(/^[-*]\s*/, '')
            .trim()
        )
        .filter((topic: string) => topic.length > 0 && topic.length <= 20)
        .slice(0, 5);
    }

    console.log('✅ Generated course topics:', topics);
    return topics;
  } catch (error) {
    console.error('❌ Error generating course topics:', error);

    // Fallback: generar topics básicos
    const fallbackTopics = [
      'Fundamentos',
      'Aplicaciones',
      'Técnicas',
      'Casos de uso',
      'Implementación',
    ];

    console.log('🔄 Using fallback course topics:', fallbackTopics);
    return fallbackTopics;
  }
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

⚠️ REGLA FUNDAMENTAL Y CRÍTICA:
LAS PREGUNTAS SOLO PUEDEN SER SOBRE CONTENIDO QUE SE ENSEÑÓ EXPLÍCITAMENTE EN ESTE MÓDULO.
SI UN CONCEPTO NO SE MENCIONÓ EN EL CONTENIDO, NO PUEDES PREGUNTAR SOBRE ÉL.

REGLAS CRÍTICAS:
- Genera exactamente 5 preguntas
- Cada pregunta debe tener 4 opciones de respuesta
- ⚠️ Las preguntas SOLO pueden ser sobre conceptos, técnicas, métodos o información que aparece TEXTUALMENTE en el contenido del módulo
- Lee DETENIDAMENTE el contenido del módulo antes de generar las preguntas
- NO inventes conceptos que no se enseñaron
- NO uses preguntas genéricas como "¿Cuál es el concepto principal?"
- Las preguntas deben verificar que el estudiante leyó y entendió el contenido específico de ESTE módulo
- Una opción debe ser claramente correcta, las otras 3 deben ser incorrectas pero plausibles
- Usa un lenguaje claro y profesional en español
- Las preguntas deben evaluar comprensión del tema al nivel del estudiante

⚠️ PROHIBIDO ABSOLUTAMENTE:
- NUNCA uses "Todas las anteriores" como opción
- NUNCA uses "Ninguna de las anteriores" como opción
- NUNCA uses "Todas son correctas" como opción
- NUNCA uses "Ninguna es correcta" como opción
- Cada opción debe ser una respuesta específica y concreta
- Solo UNA opción puede ser correcta, las otras 3 deben ser específicamente incorrectas

EJEMPLOS DE BUENAS PREGUNTAS (basadas en contenido real):
✅ SI el módulo explicó "las variables se declaran con let o const":
   "¿Qué palabras clave se usan para declarar variables en JavaScript moderno?"
   
✅ SI el módulo mostró "const nombre = 'Juan'":
   "¿Qué palabra clave se usa para declarar una variable que no cambiará?"

❌ MAL - NO preguntes sobre bubble sort si el módulo NO lo mencionó
❌ MAL - NO preguntes sobre conceptos avanzados si solo se enseñaron conceptos básicos
❌ MAL - NO inventes detalles técnicos que no se explicaron

CONTENIDO DEL MÓDULO: ${moduleContent}
TÍTULO DEL MÓDULO: ${moduleTitle}
TEMA DEL CURSO: ${courseTopic}
NIVEL: ${level}

⚠️ IMPORTANTE: Lee TODO el contenido del módulo antes de generar las preguntas. Solo pregunta sobre lo que se enseñó.

Responde SOLO con un JSON válido que contenga un array de 5 preguntas:
{
  "questions": [
    {
      "question": "Pregunta específica sobre contenido ENSEÑADO en el módulo",
      "options": ["Respuesta específica correcta", "Respuesta incorrecta pero plausible", "Otra respuesta incorrecta", "Cuarta respuesta incorrecta"],
      "correctAnswer": 0,
      "explanation": "Explicación específica de por qué la respuesta es correcta, basada en lo que se enseñó"
    }
  ]
}`;

    const userPrompt = `Genera 5 preguntas de quiz MUY ESPECÍFICAS para el módulo "${moduleTitle}" sobre "${courseTopic}".

⚠️ CRÍTICO: Las preguntas SOLO pueden ser sobre contenido que se enseñó EXPLÍCITAMENTE en este módulo.

PASOS OBLIGATORIOS:
1. Lee DETENIDAMENTE todo el contenido del módulo
2. Identifica los conceptos principales que se enseñaron
3. Crea preguntas SOLO sobre esos conceptos
4. NO inventes ni asumas conocimientos que no se enseñaron

IMPORTANTE: Las preguntas deben ser sobre:
- Conceptos específicos que se EXPLICARON en el módulo
- Técnicas, métodos o procesos que se MENCIONARON
- Ejemplos concretos que se MOSTRARON
- Definiciones que se DIERON
- Aplicaciones que se DESCRIBIERON

❌ NO preguntes sobre:
- Conceptos que NO se mencionaron
- Detalles técnicos que NO se explicaron
- Temas avanzados que NO se cubrieron
- Información que asumes pero NO se enseñó

❌ OPCIONES PROHIBIDAS:
- "Todas las anteriores"
- "Ninguna de las anteriores"
- "Todas son correctas"
- "Ninguna es correcta"
- Cualquier variación de estas opciones

✅ FORMATO CORRECTO DE OPCIONES:
Cada opción debe ser una respuesta específica y concreta. Ejemplo:
- Opción A: "Para declarar variables que no cambian de valor"
- Opción B: "Para declarar funciones constantes"
- Opción C: "Para crear objetos inmutables"
- Opción D: "Para definir números fijos"

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

// Función para generar títulos específicos de módulos usando IA
async function generateSpecificModuleTitles(
  courseTopic: string,
  existingTopics: string[],
  level: string
): Promise<string[]> {
  try {
    console.log('🤖 Generating specific module titles using AI...');

    const systemPrompt = `Eres un experto en educación y diseño de cursos. Tu tarea es generar 5 títulos específicos y descriptivos para los módulos de un curso, RESPETANDO EL NIVEL del estudiante y siguiendo principios pedagógicos sólidos.

REGLAS IMPORTANTES:
- Cada título debe ser específico y descriptivo del contenido del módulo
- NO uses títulos genéricos como "Tema 1", "Módulo 2", etc.
- Los títulos deben ser diferentes entre sí y cubrir aspectos únicos del tema
- Cada título debe ser de 3-8 palabras
- Los títulos deben seguir un orden lógico de progresión apropiado para el nivel
- Usa un lenguaje claro y profesional en español

PROGRESIÓN SEGÚN NIVEL:

🟢 NIVEL BEGINNER (Principiante ABSOLUTO):
- ⚠️ CRÍTICO: El Módulo 1 debe ser INTRODUCTORIO y CONTEXTUAL
- Módulo 1: SIEMPRE debe introducir el tema, explicar qué es, para qué sirve, contexto histórico, casos de uso
- Módulo 2: Conceptos fundamentales básicos (primer grupo de conceptos)
- Módulo 3: Conceptos fundamentales básicos (segundo grupo de conceptos)
- Módulo 4: Integración de conceptos básicos y práctica
- Módulo 5: Primeras aplicaciones prácticas simples
- NO incluir términos técnicos avanzados en los primeros módulos
- Progresión EXTREMADAMENTE gradual - cada módulo construye sobre el anterior

EJEMPLO "JAVASCRIPT PARA PRINCIPIANTES" BEGINNER: 
1. "Introducción a JavaScript y la Programación" (qué es, para qué sirve, contexto)
2. "Variables y Tipos de Datos Básicos" (números, texto, booleanos)
3. "Operadores y Expresiones Simples" (matemáticas básicas, comparaciones)
4. "Condicionales: Tomando Decisiones" (if, else)
5. "Bucles: Repitiendo Acciones" (for, while básicos)

EJEMPLO "COCINA SALUDABLE" BEGINNER:
1. "Introducción a la Cocina Saludable" (qué es, beneficios, principios básicos)
2. "Ingredientes Esenciales y Cómo Elegirlos" (frutas, verduras, proteínas)
3. "Técnicas de Cocción Básicas" (hervir, hornear, saltear)
4. "Preparación de Comidas Simples" (desayunos, almuerzos)
5. "Planificación de Menús Semanales" (organización, listas)

🔵 NIVEL INTERMEDIATE:
- Asume conocimientos básicos
- Progresión moderada con conceptos más complejos
- Puede combinar varios conceptos por módulo

🔴 NIVEL ADVANCED:
- Progresión rápida
- Conceptos complejos y especializados
- Temas avanzados y casos de uso profesionales

TEMA DEL CURSO: ${courseTopic}
⚠️ NIVEL: ${level.toUpperCase()}
${level === 'beginner' ? '\n⚠️ CRÍTICO: Este es nivel BEGINNER - El primer módulo DEBE ser introductorio (qué es, para qué sirve, contexto). Los siguientes módulos deben tener progresión EXTREMADAMENTE gradual, un concepto a la vez.' : ''}

TOPICS EXISTENTES (si los hay): ${existingTopics.join(', ')}

Responde SOLO con un JSON válido que contenga un array de 5 strings con los títulos de los módulos:
{
  "moduleTitles": [
    "Título específico del módulo 1",
    "Título específico del módulo 2", 
    "Título específico del módulo 3",
    "Título específico del módulo 4",
    "Título específico del módulo 5"
  ]
}`;

    const userPrompt = `Genera 5 títulos específicos y descriptivos para los módulos de un curso sobre "${courseTopic}" (nivel: ${level}). 

⚠️ NIVEL: ${level.toUpperCase()} - ${level === 'beginner' ? 'PROGRESIÓN MUY GRADUAL' : level === 'intermediate' ? 'PROGRESIÓN MODERADA' : 'PROGRESIÓN RÁPIDA'}

Los títulos deben ser:
- Específicos y descriptivos (no genéricos)
- Diferentes entre sí
- Ordenados con progresión apropiada para el nivel ${level}
${level === 'beginner' ? '- ⚠️ CRÍTICO: Progresión MUY gradual, conceptos básicos paso a paso\n- Cada módulo debe introducir UN GRUPO de conceptos relacionados\n- NO saltar de conceptos básicos a avanzados rápidamente' : ''}
- Relevantes al tema del curso
- En español

Responde SOLO con el JSON solicitado.`;

    const response = await askClaude({
      system: systemPrompt,
      user: userPrompt,
    });

    // Intentar parsear la respuesta JSON
    let moduleTitles: string[] = [];

    try {
      const jsonResponse = JSON.parse(response);
      if (
        jsonResponse.moduleTitles &&
        Array.isArray(jsonResponse.moduleTitles)
      ) {
        moduleTitles = jsonResponse.moduleTitles.slice(0, 5);
      }
    } catch (parseError) {
      console.error('❌ Error parsing module titles JSON:', parseError);
      console.log('Raw response:', response);

      // Fallback: extraer títulos de la respuesta de texto
      const lines = response.split('\n').filter((line: string) => line.trim());
      moduleTitles = lines
        .map((line: string) =>
          line
            .replace(/^\d+\.?\s*/, '')
            .replace(/^[-*]\s*/, '')
            .trim()
        )
        .filter((title: string) => title.length > 0)
        .slice(0, 5);
    }

    // Asegurar que tenemos exactamente 5 títulos
    while (moduleTitles.length < 5) {
      const fallbackTitle = `Aspecto ${moduleTitles.length + 1} de ${courseTopic}`;
      moduleTitles.push(fallbackTitle);
    }

    console.log('✅ Generated module titles:', moduleTitles);
    return moduleTitles;
  } catch (error) {
    console.error('❌ Error generating module titles:', error);

    // Fallback: generar títulos básicos
    const fallbackTitles = [
      `Fundamentos de ${courseTopic}`,
      `Aplicaciones prácticas de ${courseTopic}`,
      `Técnicas avanzadas de ${courseTopic}`,
      `Casos de uso de ${courseTopic}`,
      `Implementación de ${courseTopic}`,
    ];

    console.log('🔄 Using fallback module titles:', fallbackTitles);
    return fallbackTitles;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user plan and interests, check course creation limits
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, interests: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count courses started this month (courses with UserProgress created this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const coursesStartedThisMonth = await db.userProgress.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Check if user can create more courses based on their plan
    if (!canCreateCourse(user.plan as UserPlan, coursesStartedThisMonth)) {
      return NextResponse.json(
        {
          error: 'Límite de cursos alcanzado para tu plan actual.',
          plan: user.plan,
          coursesStarted: coursesStartedThisMonth,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Skip legacy rate limit for now (optional re-implement if needed)

    const body = await request.json();
    const validatedData = CourseCreateRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          fieldErrors: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { prompt, level } = validatedData.data;

    // Validate content for sensitive topics with fallback
    console.log('🔍 Validating content for sensitive topics...');
    try {
      const contentValidation = await ContentValidator.validatePrompt(prompt);

      if (!contentValidation.isSafe) {
        console.log('❌ Content blocked:', contentValidation.reason);
        return NextResponse.json(
          {
            error: 'Content blocked',
            reason: contentValidation.reason,
            category: contentValidation.category,
            message: ContentValidator.getErrorMessage(
              contentValidation.category || 'other_risks'
            ),
          },
          { status: 403 }
        );
      }

      console.log('✅ Content validation passed');
    } catch (validationError) {
      console.warn(
        '⚠️ Content validation failed due to technical issues, proceeding with course creation:',
        validationError
      );
      // Continue with course creation even if validation fails due to API issues
    }

    // Get user interests from profile
    const userInterests = safeJsonParseArray(user.interests);

    // Sanitize prompt (basic validation)
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum 2000 characters allowed.' },
        { status: 400 }
      );
    }

    // Generate course ID
    const courseId = `course-${uuidv4()}`;

    // Map Spanish level to English enum
    const levelMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      principiante: 'BEGINNER',
      intermedio: 'INTERMEDIATE',
      avanzado: 'ADVANCED',
    };

    // Create course in database
    const course = await db.course.create({
      data: {
        courseId,
        userId: session.user.id,
        userPrompt: prompt,
        userLevel: levelMap[level] || 'BEGINNER',
        userInterests: JSON.stringify(userInterests),
        status: 'GENERATING_METADATA',
      },
    });

    // Log generation start
    await db.generationLog.create({
      data: {
        courseId: course.id, // Use the actual course ID, not the courseId string
        action: 'metadata_start',
        message: 'Starting metadata generation',
      },
    });

    try {
      console.log('🔄 Starting course generation...');

      // Generar ContentDocument con Prompt Maestro
      const systemPrompt = ContractPromptBuilder.buildSystemPrompt('course');
      const userPrompt = ContractPromptBuilder.buildUserPrompt('course', {
        topic: prompt,
        level,
        interests: userInterests,
      });

      console.log('🤖 Calling Anthropic API...');
      const raw = await askClaude({ system: systemPrompt, user: userPrompt });
      try {
        console.log('📝 [AI][Course] Raw length:', raw?.length);
        console.log('📝 [AI][Course] Raw preview:', String(raw).slice(0, 600));
      } catch (_) {}

      let doc: ContentDocument;
      try {
        // Intentar parsear directamente primero
        doc = JSON.parse(raw);
        console.log('✅ ContentDocument parsed successfully');
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('🔧 Attempting to salvage JSON...');

        // Intentar reparar JSON malformado
        const repairedJson = repairMalformedJson(raw);
        if (repairedJson) {
          try {
            doc = JSON.parse(repairedJson);
            console.log('✅ ContentDocument repaired and parsed successfully');
          } catch (repairError) {
            console.error('❌ Repair failed:', repairError);
            doc = createFallbackContentDocument(prompt, level);
          }
        } else {
          // if model wrapped with markdown, try to salvage
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          if (start >= 0 && end > start) {
            try {
              const jsonSlice = raw.slice(start, end + 1);
              const repairedSlice = repairMalformedJson(jsonSlice);
              doc = JSON.parse(repairedSlice || jsonSlice);
              console.log('✅ ContentDocument salvaged from markdown');
            } catch (salvageError) {
              console.error('❌ Salvage failed:', salvageError);
              console.log('🆘 Creating fallback ContentDocument...');
              doc = createFallbackContentDocument(prompt, level);
            }
          } else {
            console.log('🆘 Creating fallback ContentDocument...');
            doc = createFallbackContentDocument(prompt, level);
          }
        }
      }

      // Función para reparar JSON malformado
      function repairMalformedJson(jsonString: string): string | null {
        try {
          // Intentar reparar problemas comunes de JSON malformado
          let repaired = jsonString;

          // 1. Limpiar caracteres de control problemáticos más agresivamente
          repaired = repaired.replace(/[\x00-\x1F\x7F]/g, '');

          // 2. Limpiar caracteres de control específicos que causan problemas
          repaired = repaired.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

          // 3. Escapar caracteres problemáticos en strings
          repaired = repaired.replace(/\\(?!["\\/bfnrt])/g, '\\\\');

          // 4. Limpiar texto adicional después del JSON
          const jsonStart = repaired.indexOf('{');
          const jsonEnd = repaired.lastIndexOf('}');
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            repaired = repaired.substring(jsonStart, jsonEnd + 1);
          }

          // 5. Cerrar strings no terminados
          repaired = repaired.replace(/"([^"]*)$/gm, '"$1"');

          // 6. Cerrar arrays no terminados
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;
          if (openBrackets > closeBrackets) {
            repaired += ']'.repeat(openBrackets - closeBrackets);
          }

          // 7. Cerrar objetos no terminados
          const openBraces = (repaired.match(/\{/g) || []).length;
          const closeBraces = (repaired.match(/\}/g) || []).length;
          if (openBraces > closeBraces) {
            repaired += '}'.repeat(openBraces - closeBraces);
          }

          // 8. Agregar comas faltantes entre elementos de array
          repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
          repaired = repaired.replace(/}\s*\n\s*{/g, '},\n{');
          repaired = repaired.replace(/]\s*\n\s*\[/g, '],\n[');

          // 9. Agregar comas faltantes antes de cierre de array/objeto
          repaired = repaired.replace(/([^,}\]])\s*([}\]])/g, '$1,$2');

          // 10. Limpiar comas duplicadas
          repaired = repaired.replace(/,+/g, ',');
          repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

          // 11. Limpiar saltos de línea problemáticos en strings
          repaired = repaired.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');

          // 12. Limpiar caracteres de escape problemáticos
          repaired = repaired.replace(/\\"/g, '"');
          repaired = repaired.replace(/\\n/g, ' ');
          repaired = repaired.replace(/\\t/g, ' ');
          repaired = repaired.replace(/\\r/g, ' ');

          // Verificar que el JSON reparado sea válido
          JSON.parse(repaired);
          return repaired;
        } catch (error) {
          console.error('❌ JSON repair failed:', error);
          return null;
        }
      }

      // Función para crear ContentDocument de fallback sustancial
      function createFallbackContentDocument(
        prompt: string,
        level: string
      ): ContentDocument {
        const timestamp = Date.now();
        return {
          version: '1.0',
          locale: 'es',
          content_id: `fallback-${timestamp}`,
          meta: {
            topic: prompt,
            audience: 'Estudiantes y profesionales',
            level: level as 'beginner' | 'intermediate' | 'advanced',
            created_at: new Date().toISOString().split('T')[0],
          },
          blocks: [
            {
              id: `intro_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: prompt },
            },
            {
              id: `intro_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `En este curso aprenderás sobre ${prompt}. Exploraremos los conceptos fundamentales, implementación práctica, ejemplos avanzados y aplicaciones reales para que puedas dominar completamente este tema.`,
              },
            },
            {
              id: `importance_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: '¿Por qué es importante?' },
            },
            {
              id: `importance_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Dominar ${prompt} es fundamental en el desarrollo de software moderno. Te permitirá crear aplicaciones más eficientes, escalables y mantenibles, además de abrirte oportunidades profesionales en empresas de tecnología líderes.`,
              },
            },
            {
              id: `benefits_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: [
                  'Mejora la eficiencia de tus aplicaciones',
                  'Facilita el mantenimiento del código',
                  'Permite escalabilidad en proyectos grandes',
                  'Abre oportunidades profesionales',
                  'Desarrolla pensamiento algorítmico',
                ],
              },
            },
            {
              id: `fundamentals_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Conceptos fundamentales' },
            },
            {
              id: `fundamentals_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Los conceptos fundamentales de ${prompt} incluyen principios teóricos sólidos, patrones de diseño reconocidos y mejores prácticas de la industria. Comprender estos fundamentos es crucial para aplicar correctamente las técnicas en proyectos reales.`,
              },
            },
            {
              id: `implementation_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Implementación práctica' },
            },
            {
              id: `implementation_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `La implementación práctica te permitirá aplicar los conceptos teóricos en código real. Trabajaremos con ejemplos progresivos que van desde casos básicos hasta implementaciones avanzadas y optimizadas.`,
              },
            },
            {
              id: `examples_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Ejemplos y casos de uso' },
            },
            {
              id: `examples_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Exploraremos ejemplos reales de ${prompt} utilizados en aplicaciones como redes sociales, sistemas de recomendación, motores de búsqueda y plataformas de e-commerce. Cada ejemplo incluye código funcional y explicaciones detalladas.`,
              },
            },
            {
              id: `best_practices_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Mejores prácticas' },
            },
            {
              id: `best_practices_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Aprenderás las mejores prácticas de la industria para implementar ${prompt} de manera eficiente y mantenible. Incluye patrones de diseño, optimización de rendimiento y técnicas de debugging.`,
              },
            },
            {
              id: `tip_${timestamp}`,
              type: 'callout',
              data: {
                kind: 'tip',
                text: `La práctica constante es clave para dominar ${prompt}. Te recomendamos implementar los ejemplos y experimentar con variaciones para consolidar tu aprendizaje.`,
              },
            },
            {
              id: `conclusion_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Conclusión' },
            },
            {
              id: `conclusion_p_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Al completar este curso, tendrás una comprensión sólida de ${prompt} y podrás aplicarlo en proyectos profesionales. El conocimiento adquirido te preparará para enfrentar desafíos complejos en el desarrollo de software.`,
              },
            },
            {
              id: `course_topics_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: [
                  'Conceptos fundamentales',
                  'Implementación práctica',
                  'Ejemplos avanzados',
                  'Aplicaciones reales',
                  'Mejores prácticas',
                ],
              },
            },
          ],
        };
      }

      // Normalize permissive variants to the strict contract
      console.log('🔧 Normalizing ContentDocument...');
      doc = normalizeToContract(doc);

      console.log('✅ Validating ContentDocument...');
      const validation = ContentContractValidator.validateDocument(doc);
      if (!validation.isValid) {
        console.error(
          '❌ ContentDocument validation errors:',
          validation.errors
        );
        try {
          console.error(
            '📦 ContentDocument received:',
            JSON.stringify(doc).slice(0, 2000)
          );
        } catch (_) {}
        await db.course.update({
          where: { courseId },
          data: { status: 'FAILED' },
        });
        return NextResponse.json(
          { error: 'Invalid ContentDocument', errors: validation.errors },
          { status: 422 }
        );
      }
      console.log('✅ ContentDocument validation passed');

      // Guardar en memoria y vincular a curso
      contentStore.save(doc);
      contentStore.linkCourse(course.id, doc.content_id);

      // Derivar metadata mínima y módulo 1 + chunks desde ContentDocument
      const blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
      const firstParagraph = String(
        (blocks.find(b => b.type === 'paragraph') as any)?.data?.text ||
          doc.meta.topic ||
          ''
      ).slice(0, 500);

      // Extraer topics del ContentDocument (bloque especial course_topics)
      let courseTopics: string[] = [];
      const topicsBlock = blocks.find(
        b => b.id === 'course_topics' && b.type === 'list'
      );
      if (
        topicsBlock &&
        topicsBlock.type === 'list' &&
        'items' in topicsBlock.data
      ) {
        courseTopics = topicsBlock.data.items.slice(0, 5); // Máximo 5 topics
      }

      // Siempre generar topics específicos como conceptos clave (no lecciones)
      if (courseTopics.length < 5) {
        const specificTopics = await generateSpecificCourseTopics(
          doc.meta.topic,
          courseTopics,
          level
        );
        courseTopics = [...courseTopics, ...specificTopics].slice(0, 5);
      }

      // Extraer títulos de módulos a partir de headings H2/H3 únicos
      const headingTexts: string[] = [];
      const seen = new Set<string>();
      for (const b of blocks) {
        if (b.type === 'heading') {
          const lvl = (b as any).data?.level;
          const txt = String((b as any).data?.text || '').trim();
          if ((lvl === 2 || lvl === 3) && txt) {
            const key = txt.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              headingTexts.push(txt);
            }
          }
        }
      }

      // Generar 5 títulos de módulos específicos usando IA
      const totalModules = 5;
      const lessonsPerModule = 5;

      // Generar títulos específicos de módulos usando IA
      const moduleTopics = await generateSpecificModuleTitles(
        doc.meta.topic,
        courseTopics,
        level
      );

      console.log('📚 Module topics generated:', moduleTopics);

      // Crear estructura de módulos con títulos específicos
      const orderedModules: {
        title: string;
        lessons: { title: string; blocks: any[]; videoData?: string | null }[];
        quizQuestions?: any[];
      }[] = moduleTopics.map((topic, index) => ({
        title: topic,
        lessons: [],
        quizQuestions: [],
      }));

      function sanitizeTitle(input: string | undefined): string {
        const txt = String(input || '').trim();
        // Quitar prefijos genéricos como "Módulo 1", "Modulo 1", etc.
        const cleaned = txt.replace(/^m[oó]dulo\s+\d+\s*:?/i, '').trim();
        return cleaned || txt;
      }

      // Usar los títulos específicos de los módulos
      const moduleTitles: string[] = orderedModules.map((m, i) => m.title);

      // Función para generar títulos específicos de lecciones para cada módulo
      async function generateSpecificLessonTitles(
        moduleTitle: string,
        courseTopic: string,
        level: string,
        moduleNumber: number = 1
      ): Promise<string[]> {
        try {
          console.log('🤖 Generating specific lesson titles using AI...');

          // Detectar si es un módulo introductorio
          const isIntroductoryModule =
            moduleNumber === 1 || // El primer módulo SIEMPRE es introductorio
            moduleTitle.toLowerCase().includes('introducción') ||
            moduleTitle.toLowerCase().includes('introduccion') ||
            moduleTitle.toLowerCase().includes('fundamentos');

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

          let userPrompt = `Genera 5 títulos de lecciones específicas y únicas para el módulo "${moduleTitle}" del curso sobre "${courseTopic}" (nivel: ${level}).

IMPORTANTE:
- Los títulos deben ser específicos del tema del módulo
- Deben ser accionables y concretos
- No uses plantillas genéricas
- Cada lección debe abordar un subtema distinto
- Los títulos deben reflejar el contenido específico que se enseñará

MÓDULO: ${moduleTitle}
CURSO: ${courseTopic}
NIVEL: ${level}`;

          // Agregar instrucciones especiales para módulos introductorios
          if (isIntroductoryModule) {
            userPrompt += `

⚠️ ESTE ES UN MÓDULO INTRODUCTORIO - INSTRUCCIONES ESPECIALES:

Este módulo debe ser 100% INTRODUCTORIO y CONTEXTUAL. NO debe incluir contenido técnico avanzado.

GENERA TÍTULOS DE LECCIONES QUE CUBRAN:
1. ¿Qué es ${courseTopic}? (Definición simple y clara)
2. ¿Para qué sirve ${courseTopic}? (Aplicaciones y utilidad)
3. Historia breve y contexto de ${courseTopic}
4. Casos de éxito y ejemplos reales de ${courseTopic}
5. Preparación inicial y primeros pasos conceptuales

❌ NO INCLUYAS EN LOS TÍTULOS:
- Sintaxis técnica detallada
- Código o comandos específicos
- Conceptos avanzados
- Terminología compleja sin explicar
- Ejercicios técnicos profundos

✅ ENFOQUE: Motivar, contextualizar y preparar mentalmente al estudiante para el aprendizaje.

EJEMPLO PARA "Introducción a JavaScript":
- "¿Qué es JavaScript y Por Qué es el Lenguaje de la Web?"
- "Aplicaciones Reales de JavaScript en el Mundo Actual"
- "Historia y Evolución de JavaScript: De 1995 a Hoy"
- "Casos de Éxito: Empresas que Usan JavaScript"
- "Preparando tu Mentalidad para Aprender a Programar"`;
          }

          userPrompt += `

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
        if (
          moduleLower.includes('manipulación') ||
          moduleLower.includes('datos')
        ) {
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

      // Función para generar lecciones completas e individuales usando IA
      async function generateCompleteLessonsForModule(
        moduleTitle: string,
        courseTopic: string,
        level: string,
        moduleNumber: number = 1
      ) {
        const lessons = [];
        // Generate specific lesson titles for this module
        const lessonTitles = await generateSpecificLessonTitles(
          moduleTitle,
          courseTopic,
          level,
          moduleNumber
        );

        console.log(
          `🎯 Generating 5 complete lessons for module: ${moduleTitle}`
        );

        for (let i = 0; i < lessonTitles.length; i++) {
          const lessonTitle = lessonTitles[i];
          const lessonNumber = i + 1;

          try {
            console.log(
              `📚 Generating lesson ${lessonNumber}/5: ${lessonTitle}`
            );

            // Generar lección completa usando IA
            const systemPrompt =
              ContractPromptBuilder.buildSystemPrompt('chunk');
            const userPrompt = ContractPromptBuilder.buildUserPrompt('chunk', {
              topic: courseTopic,
              level: level,
              interests: [],
              moduleTitle: moduleTitle,
              moduleOrder: moduleNumber,
              lessonTitle: lessonTitle,
              lessonNumber: lessonNumber,
              totalLessons: 5,
            });

            const aiResponse = await generateCourseMetadata(
              userPrompt,
              level,
              []
            );

            // Parsear y normalizar la respuesta con parser robusto
            let lessonDoc;
            try {
              console.log('🔧 Parsing AI response with robust parser...');
              lessonDoc = parseAIJsonRobust(aiResponse);

              // Reparar documento si es necesario
              lessonDoc = repairContentDocument(lessonDoc);

              console.log('✅ JSON parsed and repaired successfully');
            } catch (parseError) {
              console.error('❌ JSON parse error for lesson:', parseError);
              console.log(
                '🔄 Retrying lesson generation with stricter JSON instructions...'
              );

              // RETRY: Intentar una vez más con instrucciones más estrictas
              try {
                const retryPrompt = ContractPromptBuilder.buildUserPrompt(
                  'chunk',
                  {
                    topic: courseTopic,
                    level: level as 'beginner' | 'intermediate' | 'advanced',
                    interests: [],
                    moduleTitle: moduleTitle,
                    moduleOrder: moduleNumber,
                    lessonTitle: lessonTitle,
                    lessonNumber: lessonNumber,
                    totalLessons: 5,
                  }
                );

                const stricterPrompt = `${retryPrompt}

⚠️ CRÍTICO - FORMATO JSON ESTRICTO:
- Verifica que TODAS las comillas estén cerradas
- Verifica que TODAS las comas estén presentes
- Verifica que TODOS los corchetes [] y llaves {} estén balanceados
- NO incluyas saltos de línea dentro de strings
- USA comillas dobles " no simples '
- Después de CADA propiedad debe haber una coma, excepto la última

Revisa el JSON ANTES de responder. Debe ser 100% válido.`;

                const retryResponse = await generateCourseMetadata(
                  stricterPrompt,
                  level,
                  []
                );

                console.log('🔧 Parsing retry response...');
                lessonDoc = parseAIJsonRobust(retryResponse);
                lessonDoc = repairContentDocument(lessonDoc);
                console.log('✅ Retry successful!');
              } catch (retryError) {
                console.error('❌ Retry also failed:', retryError);
                console.error(
                  'AI Response preview:',
                  aiResponse.substring(0, 500)
                );
                throw new Error(
                  `No valid JSON found after retry: ${parseError instanceof Error ? parseError.message : String(parseError)}`
                );
              }
            }

            // Normalizar y limpiar bloques vacíos
            const normalizedDoc = normalizeToContract(lessonDoc);

            // Filtrar bloques vacíos o inválidos
            normalizedDoc.blocks = normalizedDoc.blocks.filter((block: any) => {
              if (block.type === 'paragraph') {
                return (
                  block.data &&
                  block.data.text &&
                  block.data.text.trim().length > 0
                );
              }
              if (block.type === 'heading') {
                return (
                  block.data &&
                  block.data.text &&
                  block.data.text.trim().length > 0
                );
              }
              if (block.type === 'list') {
                return (
                  block.data && block.data.items && block.data.items.length > 0
                );
              }
              // Mantener otros tipos de bloques
              return true;
            });

            const validationResult =
              ContentContractValidator.validateDocument(normalizedDoc);

            if (!validationResult.isValid) {
              console.error(
                '❌ Content validation failed for lesson:',
                validationResult.errors
              );
              throw new Error(
                `Invalid ContentDocument: ${validationResult.errors.join(', ')}`
              );
            }

            // Buscar video para la segunda lección (Fundamentos)
            let videoData = null;
            if (lessonNumber === 2) {
              try {
                console.log(
                  `🎥 Searching for video for lesson 2: ${lessonTitle}`
                );
                // Crear una consulta de búsqueda específica del módulo
                const moduleSpecificQuery = `${moduleTitle} ${lessonTitle}`;

                const video = await YouTubeService.findVideoForChunk(
                  moduleSpecificQuery,
                  JSON.stringify(normalizedDoc.blocks),
                  courseTopic,
                  lessonNumber
                );
                if (video) {
                  videoData = JSON.stringify(video);
                  console.log(`✅ Video found for lesson 2: ${video.title}`);
                } else {
                  console.log(`⚠️ No video found for lesson 2: ${lessonTitle}`);
                }
              } catch (videoError) {
                console.error(
                  `❌ Error searching for video for lesson 2:`,
                  videoError
                );
                // No lanzar error, continuar sin video
              }
            }

            lessons.push({
              title: lessonTitle,
              blocks: normalizedDoc.blocks,
              contentDocument: normalizedDoc,
              videoData: videoData,
            });

            console.log(
              `✅ Lesson ${lessonNumber} generated successfully with ${normalizedDoc.blocks.length} blocks${videoData ? ' and video' : ''}`
            );

            // Pequeña pausa entre lecciones para no sobrecargar la IA
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`❌ Error generating lesson ${lessonNumber}:`, error);
            // Fallback: mostrar error claro en lugar de contenido genérico
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `Error generando lección "${lessonTitle}": ${errorMessage}. Por favor, intenta crear el curso nuevamente.`
            );
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
          } else if (
            block.type === 'code' &&
            block.data?.snippet?.length > 100
          ) {
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

      // Función para generar lecciones placeholder para módulos 2-5
      function generatePlaceholderLessons(moduleTitle: string) {
        const lessons = [];
        for (let i = 0; i < 5; i++) {
          const lessonNumber = i + 1;
          const title = generateDescriptiveLessonTitle(
            [],
            moduleTitle,
            lessonNumber
          );
          lessons.push({
            title,
            blocks: [
              {
                id: `placeholder_${i}`,
                type: 'paragraph',
                data: {
                  text: `Esta lección se está generando. Contenido sobre ${title.toLowerCase()} de ${moduleTitle.toLowerCase()}.`,
                },
              },
            ],
          });
        }
        return lessons;
      }

      // Dividir en módulos (H2) y lecciones (H3 o agrupación equilibrada)
      function divideIntoModulesAndLessons(
        allBlocks: any[],
        total: number,
        perModule: number
      ) {
        type Lesson = { title: string; blocks: any[] };
        type Mod = { title: string; blocks: any[]; lessons: Lesson[] };
        const modules: Mod[] = [];

        // Detectar H2 como inicio de módulo
        const h2Indices: { idx: number; text: string }[] = [];
        allBlocks.forEach((b, i) => {
          if (b.type === 'heading' && b.data?.level === 2) {
            h2Indices.push({ idx: i, text: String(b.data.text || '').trim() });
          }
        });

        if (h2Indices.length === 0) {
          // Fallback: crear módulos por tamaño
          const size = Math.max(1, Math.ceil(allBlocks.length / total));
          for (let m = 0; m < total; m++) {
            const start = m * size;
            const end = Math.min(allBlocks.length, start + size);
            const blk = allBlocks.slice(start, end);
            const title = String(
              (blk.find((b: any) => b.type === 'heading') as any)?.data?.text ||
                `Módulo ${m + 1}`
            ).trim();
            modules.push({ title, blocks: blk, lessons: [] });
          }
        } else {
          // Particionar por H2
          for (let m = 0; m < Math.min(total, h2Indices.length); m++) {
            const start = h2Indices[m].idx;
            const end = h2Indices[m + 1]
              ? h2Indices[m + 1].idx
              : allBlocks.length;
            const blk = allBlocks.slice(start, end);
            modules.push({
              title: h2Indices[m].text,
              blocks: blk,
              lessons: [],
            });
          }
          // Si faltan módulos, completar por tamaño
          for (let m = modules.length; m < total; m++) {
            modules.push({ title: `Módulo ${m + 1}`, blocks: [], lessons: [] });
          }
        }

        // Dentro de cada módulo, dividir por H3 y completar hasta perModule
        for (const mod of modules) {
          const h3s: { idx: number; text: string }[] = [];
          mod.blocks.forEach((b: any, i: number) => {
            if (b.type === 'heading' && b.data?.level === 3) {
              h3s.push({ idx: i, text: String(b.data.text || '').trim() });
            }
          });

          const lessons: Lesson[] = [];
          if (h3s.length > 0) {
            for (let i = 0; i < h3s.length && lessons.length < perModule; i++) {
              const start = h3s[i].idx;
              const end = h3s[i + 1] ? h3s[i + 1].idx : mod.blocks.length;
              const lb = mod.blocks.slice(start, end);
              lessons.push({
                title: h3s[i].text,
                blocks: ensureCompleteLessonStructure(lb, h3s[i].text),
              });
            }
          }

          // Si no hay suficientes H3, dividir por tamaño equilibrado
          if (lessons.length < perModule) {
            const remaining = perModule - lessons.length;
            const available =
              lessons.length === 0
                ? mod.blocks
                : mod.blocks.slice(h3s[h3s.length - 1]?.idx || 0);
            const size = Math.max(1, Math.ceil(available.length / remaining));
            for (let i = 0; i < remaining; i++) {
              const start = i * size;
              const end = Math.min(available.length, start + size);
              const lb = available.slice(start, end);
              // Siempre usar títulos descriptivos, independientemente del contenido
              const lessonNumber = lessons.length + 1;
              const descriptiveTitle = generateDescriptiveLessonTitle(
                lb,
                sanitizeTitle(mod.title),
                lessonNumber
              );
              lessons.push({
                title: descriptiveTitle,
                blocks: ensureCompleteLessonStructure(
                  generateCompleteLessonContent(
                    descriptiveTitle,
                    sanitizeTitle(mod.title)
                  ),
                  descriptiveTitle
                ),
              });
              if (lessons.length >= perModule) break;
            }
          }

          mod.lessons = lessons.slice(0, perModule);
        }

        // Asegurar longitud exacta
        return modules.slice(0, total);
      }

      // Función para asegurar estructura completa de lección
      function ensureCompleteLessonStructure(blocks: any[], title: string) {
        let structuredBlocks = [...blocks];

        // Eliminar headings duplicados con el mismo título dentro de la lección (excepto el primero)
        const normalizedTitle = title.trim().toLowerCase();
        let seenTitleHeading = false;
        structuredBlocks = structuredBlocks.filter(block => {
          if (block.type === 'heading') {
            const txt = String(block.data?.text || '')
              .trim()
              .toLowerCase();
            if (txt === normalizedTitle) {
              if (seenTitleHeading) {
                return false; // descartar duplicados
              }
              seenTitleHeading = true;
            }
          }
          return true;
        });

        // Si la lección está vacía o solo tiene un título, generar contenido completo
        if (structuredBlocks.length <= 1) {
          structuredBlocks = generateCompleteLessonContent(title);
        } else {
          // Verificar si tiene introducción (párrafo después del título)
          const hasIntro = structuredBlocks.some(
            (block, index) =>
              index > 0 &&
              block.type === 'paragraph' &&
              structuredBlocks[index - 1].type === 'heading'
          );

          if (!hasIntro && structuredBlocks.length > 1) {
            // Agregar párrafo introductorio si no existe
            const introBlock = {
              id: `intro_${Date.now()}`,
              type: 'paragraph',
              data: {
                text: `En esta lección exploraremos ${title.toLowerCase()}. Aprenderemos los conceptos fundamentales y veremos ejemplos prácticos de implementación.`,
              },
            };
            structuredBlocks.splice(1, 0, introBlock);
          }

          // Verificar si tiene conclusión
          const hasConclusion = structuredBlocks.some(
            block =>
              block.type === 'heading' &&
              (block.data?.text?.toLowerCase().includes('conclusión') ||
                block.data?.text?.toLowerCase().includes('resumen'))
          );

          if (!hasConclusion) {
            // Agregar conclusión si no existe
            const conclusionBlock = {
              id: `conclusion_${Date.now()}`,
              type: 'heading',
              data: {
                level: 2,
                text: `Resumen de ${title}`,
              },
            };
            const summaryBlock = {
              id: `summary_${Date.now()}`,
              type: 'paragraph',
              data: {
                text: `Hemos explorado los conceptos fundamentales de ${title.toLowerCase()}. Estos conocimientos te permitirán aplicar estas estructuras de manera efectiva en tus proyectos de programación.`,
              },
            };
            structuredBlocks.push(conclusionBlock, summaryBlock);
          }
        }

        return structuredBlocks;
      }

      // Función para generar títulos descriptivos de lecciones
      function generateDescriptiveLessonTitle(
        blocks: any[],
        moduleTitle: string,
        lessonNumber: number
      ) {
        // Títulos específicos para cada lección
        const lessonTitles = [
          '¿Para qué es necesario?',
          'Fundamentos',
          'Estructuras básicas',
          'Casos de uso y ejemplos',
          'Conclusión',
        ];

        return lessonTitles[lessonNumber - 1] || `Lección ${lessonNumber}`;
      }

      // Función para generar contenido completo de lección cuando está vacía
      function generateCompleteLessonContent(
        title: string,
        moduleTitle: string = ''
      ) {
        const timestamp = Date.now();

        // Contenido específico según el tipo de lección
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
            {
              id: `use_cases_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Casos de aplicación' },
            },
            {
              id: `use_cases_list_${timestamp}`,
              type: 'list',
              data: {
                style: 'numbered',
                items: [
                  'Desarrollo de aplicaciones web',
                  'Análisis de datos',
                  'Algoritmos de búsqueda',
                  'Sistemas de recomendación',
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
            {
              id: `principles_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Principios clave' },
            },
            {
              id: `principles_list_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: [
                  'Organización lógica de datos',
                  'Operaciones de acceso eficiente',
                  'Gestión de memoria optimizada',
                  'Algoritmos de manipulación',
                ],
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
            {
              id: `operations_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Operaciones principales' },
            },
            {
              id: `operations_list_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: [
                  'Crear estructura',
                  'Agregar elementos',
                  'Eliminar elementos',
                  'Buscar elementos',
                  'Modificar elementos',
                ],
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
            {
              id: `example2_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Ejemplo 2: Caso avanzado' },
            },
            {
              id: `code2_${timestamp}`,
              type: 'code',
              data: {
                language: 'python',
                snippet: `# Caso de uso avanzado\nclass GestorDatos:\n    def __init__(self):\n        self.estructura = {}\n    \n    def agregar_usuario(self, id, datos):\n        self.estructura[id] = datos\n    \n    def buscar_usuario(self, id):\n        return self.estructura.get(id, None)\n\n# Implementación\ngestor = GestorDatos()\ngestor.agregar_usuario(1, {'nombre': 'Juan', 'edad': 25})\nusuario = gestor.buscar_usuario(1)\nprint(usuario)`,
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
            {
              id: `next_steps_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Próximos pasos' },
            },
            {
              id: `next_steps_paragraph_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Ahora puedes aplicar estos conceptos en tus propios proyectos. Te recomendamos practicar con ejercicios adicionales y explorar variaciones más avanzadas de estas estructuras.`,
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

      // Función para generar contenido de módulo usando IA
      async function generateModuleContentWithAI(
        moduleTitle: string,
        courseTopic: string,
        level: string
      ) {
        try {
          console.log(`🤖 Generating AI content for module: ${moduleTitle}`);

          const systemPrompt =
            ContractPromptBuilder.buildSystemPrompt('module');
          const userPrompt = ContractPromptBuilder.buildUserPrompt('module', {
            topic: `${courseTopic} - ${moduleTitle}`,
            level: level as 'beginner' | 'intermediate' | 'advanced',
            interests: [],
          });

          const aiResponse = await generateCourseMetadata(
            userPrompt,
            level,
            []
          );

          // Parsear y normalizar la respuesta
          let doc;
          try {
            doc = JSON.parse(aiResponse);
          } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            // Intentar extraer JSON del markdown
            const jsonMatch =
              aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
              aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              doc = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
              throw new Error('No valid JSON found in AI response');
            }
          }

          // Normalizar y validar
          const normalizedDoc = normalizeToContract(doc);
          const validationResult =
            ContentContractValidator.validateDocument(normalizedDoc);

          if (!validationResult.isValid) {
            console.error(
              '❌ Content validation failed:',
              validationResult.errors
            );
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

      // Función para generar módulos restantes en background
      async function generateRemainingModules(
        courseId: number,
        moduleTitles: string[],
        courseTopic: string,
        level: string
      ) {
        console.log(
          '🚀 Starting background generation for remaining modules...'
        );

        for (let i = 0; i < moduleTitles.length; i++) {
          const moduleTitle = moduleTitles[i];
          const moduleNumber = i + 2; // Módulos 2-5

          try {
            console.log(`📚 Generating Module ${moduleNumber}: ${moduleTitle}`);

            // Generar contenido específico para este módulo usando la IA
            const moduleContent = await generateModuleContent(
              moduleTitle,
              courseTopic,
              level
            );

            // Verificar si el módulo ya existe, si no, crearlo
            let module = await db.module.findFirst({
              where: {
                courseId: courseId as any,
                moduleOrder: moduleNumber,
              },
            });

            if (!module) {
              // Crear el módulo en la base de datos
              module = await db.module.create({
                data: {
                  courseId: courseId as any,
                  moduleOrder: moduleNumber,
                  title: moduleTitle,
                  description: moduleContent.description,
                },
              });
            } else {
              // Actualizar el módulo existente
              module = await db.module.update({
                where: { id: module.id },
                data: {
                  title: moduleTitle,
                  description: moduleContent.description,
                },
              });
            }

            // Generar contenido específico para este módulo usando la IA
            const aiModuleContent = await generateModuleContentWithAI(
              moduleTitle,
              courseTopic,
              level
            );

            // Generar lecciones completas e individuales para el módulo
            const moduleResult = await generateCompleteLessonsForModule(
              moduleTitle,
              courseTopic,
              level,
              1 // Módulo 1
            );
            const moduleLessons = moduleResult.lessons;
            const quizQuestions = moduleResult.quizQuestions;

            // Crear las lecciones del módulo (dinámicas, no fijas)
            for (let j = 0; j < moduleLessons.length; j++) {
              const lesson = moduleLessons[j];
              const lessonNumber = j + 1;

              const miniDoc = {
                version: '1.0',
                locale: 'es',
                content_id: `module_${moduleNumber}_lesson_${lessonNumber}`,
                meta: {
                  topic: lesson.title,
                  audience: 'Estudiantes',
                  level: level as 'beginner' | 'intermediate' | 'advanced',
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
                    videoData: lesson.videoData || null,
                  },
                });
              } else {
                // Actualizar el chunk existente
                await db.chunk.update({
                  where: { id: existingChunk.id },
                  data: {
                    title: lesson.title,
                    content: JSON.stringify(miniDoc),
                  },
                });
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

            // Crear las 5 preguntas del quiz
            if (quizQuestions && quizQuestions.length > 0) {
              // Eliminar preguntas existentes
              await db.quizQuestion.deleteMany({
                where: { quizId: quiz.id },
              });

              // Crear las nuevas preguntas
              for (let q = 0; q < quizQuestions.length; q++) {
                const question = quizQuestions[q];
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
                `✅ Created ${quizQuestions.length} quiz questions for module ${moduleNumber}`
              );
            } else {
              // Fallback: crear una pregunta básica
              const existingQuestion = await db.quizQuestion.findFirst({
                where: {
                  quizId: quiz.id,
                  questionOrder: 1,
                },
              });

              if (!existingQuestion) {
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
              }
            }

            console.log(`✅ Module ${moduleNumber} completed successfully`);

            // Pequeña pausa entre módulos para no sobrecargar
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`❌ Error generating Module ${moduleNumber}:`, error);
          }
        }

        console.log('🎉 All remaining modules generated successfully!');
      }

      // Función para generar contenido específico de un módulo
      async function generateModuleContent(
        moduleTitle: string,
        courseTopic: string,
        level: string
      ) {
        // Por ahora, generar contenido sintético. En el futuro se puede integrar con IA
        return {
          description: `Módulo sobre ${moduleTitle.toLowerCase()}. Aprenderás los conceptos fundamentales y verás ejemplos prácticos de implementación.`,
        };
      }

      // Función para generar contenido específico según el módulo
      function generateModuleSpecificContent(
        lessonTitle: string,
        moduleTitle: string,
        moduleNumber: number
      ) {
        const timestamp = Date.now();

        // Extraer el tema principal del título del módulo
        const mainTopic = moduleTitle.split(':')[0].trim().toLowerCase();

        let blocks: any[] = [];

        if (lessonTitle === '¿Para qué es necesario?') {
          blocks = [
            {
              id: `heading_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: lessonTitle },
            },
            {
              id: `intro_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `En esta lección entenderemos por qué ${mainTopic} es fundamental en programación y cuáles son sus ventajas principales. Comenzaremos explorando el contexto histórico y la evolución de este concepto en el desarrollo de software moderno.`,
              },
            },
            {
              id: `context_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `El desarrollo de software ha evolucionado significativamente, y ${mainTopic} se ha convertido en una herramienta esencial para crear aplicaciones robustas, escalables y mantenibles. Su importancia radica en la capacidad de resolver problemas complejos de manera eficiente y elegante.`,
              },
            },
            {
              id: `importance_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Importancia en el desarrollo moderno' },
            },
            {
              id: `benefits_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: getModuleSpecificBenefits(mainTopic),
              },
            },
            {
              id: `real_world_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Aplicaciones en el mundo real' },
            },
            {
              id: `real_world_paragraph_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Las aplicaciones de ${mainTopic} se extienden más allá del código. Empresas como Google, Facebook, Amazon y Netflix utilizan estos conceptos para manejar millones de usuarios y procesar cantidades masivas de datos en tiempo real.`,
              },
            },
            {
              id: `use_cases_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Casos de aplicación específicos' },
            },
            {
              id: `use_cases_list_${timestamp}`,
              type: 'list',
              data: {
                style: 'numbered',
                items: getModuleSpecificUseCases(mainTopic),
              },
            },
            {
              id: `callout_${timestamp}`,
              type: 'callout',
              data: {
                kind: 'tip',
                text: `Recuerda que dominar ${mainTopic} no solo mejora tu código, sino que también te prepara para trabajar en proyectos de gran escala y equipos de desarrollo profesionales.`,
              },
            },
            {
              id: `conclusion_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `En resumen, ${mainTopic} es fundamental porque proporciona las herramientas necesarias para crear software de calidad profesional. Su dominio te permitirá abordar problemas complejos con confianza y eficiencia.`,
              },
            },
          ];
        } else if (lessonTitle === 'Fundamentos') {
          blocks = [
            {
              id: `heading_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: lessonTitle },
            },
            {
              id: `intro_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Exploraremos los conceptos teóricos fundamentales de ${mainTopic} y sus principios básicos. Esta lección sienta las bases conceptuales necesarias para comprender completamente cómo funciona ${mainTopic} y por qué es tan importante en el desarrollo de software.`,
              },
            },
            {
              id: `theory_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Conceptos teóricos fundamentales' },
            },
            {
              id: `theory_paragraph_${timestamp}`,
              type: 'paragraph',
              data: { text: getModuleSpecificTheory(mainTopic) },
            },
            {
              id: `deep_concept_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Para entender completamente ${mainTopic}, es crucial comprender su arquitectura interna y cómo interactúa con otros componentes del sistema. Esta comprensión profunda te permitirá tomar decisiones informadas y optimizar el rendimiento de tus aplicaciones.`,
              },
            },
            {
              id: `principles_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Principios clave y mejores prácticas' },
            },
            {
              id: `principles_list_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: getModuleSpecificPrinciples(mainTopic),
              },
            },
            {
              id: `implementation_details_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Detalles de implementación' },
            },
            {
              id: `implementation_paragraph_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `La implementación correcta de ${mainTopic} requiere atención a los detalles. Cada decisión de diseño tiene implicaciones en el rendimiento, la mantenibilidad y la escalabilidad de tu código.`,
              },
            },
            {
              id: `warning_${timestamp}`,
              type: 'callout',
              data: {
                kind: 'warning',
                text: `Es importante no saltarse los fundamentos. Una comprensión sólida de estos conceptos básicos es esencial para evitar errores comunes y construir código robusto.`,
              },
            },
            {
              id: `conclusion_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Los fundamentos de ${mainTopic} son la base sobre la cual construirás aplicaciones más complejas. Dominar estos conceptos te dará la confianza necesaria para enfrentar desafíos más avanzados.`,
              },
            },
          ];
        } else if (lessonTitle === 'Estructuras básicas') {
          blocks = [
            {
              id: `heading_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: lessonTitle },
            },
            {
              id: `intro_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Aprenderemos las estructuras básicas de ${mainTopic} y cómo implementarlas en Python.`,
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
                snippet: getModuleSpecificCode(mainTopic),
              },
            },
            {
              id: `operations_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Operaciones principales' },
            },
            {
              id: `operations_list_${timestamp}`,
              type: 'list',
              data: {
                style: 'bulleted',
                items: getModuleSpecificOperations(mainTopic),
              },
            },
          ];
        } else if (lessonTitle === 'Casos de uso y ejemplos') {
          blocks = [
            {
              id: `heading_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: lessonTitle },
            },
            {
              id: `intro_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Veremos ejemplos prácticos de ${mainTopic} en situaciones reales de programación.`,
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
                snippet: getModuleSpecificExample1(mainTopic),
              },
            },
            {
              id: `example2_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Ejemplo 2: Caso avanzado' },
            },
            {
              id: `code2_${timestamp}`,
              type: 'code',
              data: {
                language: 'python',
                snippet: getModuleSpecificExample2(mainTopic),
              },
            },
          ];
        } else if (lessonTitle === 'Conclusión') {
          blocks = [
            {
              id: `heading_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: lessonTitle },
            },
            {
              id: `intro_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `Hemos completado el estudio de ${mainTopic}. Resumamos los puntos clave aprendidos.`,
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
                items: getModuleSpecificSummary(mainTopic),
              },
            },
            {
              id: `next_steps_${timestamp}`,
              type: 'heading',
              data: { level: 2, text: 'Próximos pasos' },
            },
            {
              id: `next_steps_paragraph_${timestamp}`,
              type: 'paragraph',
              data: { text: getModuleSpecificNextSteps(mainTopic) },
            },
          ];
        } else {
          // Fallback genérico
          blocks = [
            {
              id: `heading_${timestamp}`,
              type: 'heading',
              data: { level: 1, text: lessonTitle },
            },
            {
              id: `intro_${timestamp}`,
              type: 'paragraph',
              data: {
                text: `En esta lección exploraremos ${lessonTitle.toLowerCase()}. Aprenderemos los conceptos fundamentales y veremos ejemplos prácticos.`,
              },
            },
          ];
        }

        return blocks;
      }

      // Funciones auxiliares para generar contenido específico por módulo
      function getModuleSpecificBenefits(topic: string): string[] {
        const benefitsMap: { [key: string]: string[] } = {
          listas: [
            'Permite almacenar múltiples elementos de diferentes tipos',
            'Facilita la manipulación dinámica de datos',
            'Optimiza el acceso secuencial a elementos',
            'Permite operaciones de inserción y eliminación eficientes',
          ],
          tuplas: [
            'Garantiza inmutabilidad de los datos',
            'Mejora el rendimiento en operaciones de lectura',
            'Facilita el uso como claves en diccionarios',
            'Reduce el uso de memoria comparado con listas',
          ],
          diccionarios: [
            'Permite acceso rápido por clave en tiempo constante',
            'Facilita la organización de datos estructurados',
            'Optimiza las búsquedas y actualizaciones',
            'Permite mapeo eficiente entre claves y valores',
          ],
          conjuntos: [
            'Garantiza elementos únicos automáticamente',
            'Optimiza operaciones de unión e intersección',
            'Facilita la eliminación de duplicados',
            'Mejora el rendimiento en búsquedas de pertenencia',
          ],
          'tema 4': [
            'Proporciona estructuras de datos avanzadas',
            'Facilita la resolución de problemas complejos',
            'Optimiza el rendimiento en algoritmos específicos',
            'Permite implementaciones más eficientes',
          ],
        };
        return (
          benefitsMap[topic] || [
            'Mejora la eficiencia del código',
            'Facilita el mantenimiento',
            'Optimiza el uso de memoria',
            'Permite escalabilidad',
          ]
        );
      }

      function getModuleSpecificUseCases(topic: string): string[] {
        const useCasesMap: { [key: string]: string[] } = {
          listas: [
            'Almacenamiento de datos dinámicos',
            'Implementación de pilas y colas',
            'Procesamiento de secuencias de datos',
            'Algoritmos de ordenamiento',
          ],
          tuplas: [
            'Coordenadas geográficas (lat, lng)',
            'Configuraciones inmutables',
            'Claves compuestas en diccionarios',
            'Retorno de múltiples valores de funciones',
          ],
          diccionarios: [
            'Bases de datos en memoria',
            'Caché de resultados computados',
            'Mapeo de configuraciones',
            'Índices de búsqueda rápida',
          ],
          conjuntos: [
            'Eliminación de duplicados',
            'Operaciones de conjuntos matemáticos',
            'Filtrado de elementos únicos',
            'Verificación de pertenencia',
          ],
          'tema 4': [
            'Estructuras de datos personalizadas',
            'Algoritmos de optimización',
            'Sistemas de gestión de datos',
            'Implementaciones de alto rendimiento',
          ],
        };
        return (
          useCasesMap[topic] || [
            'Desarrollo de aplicaciones web',
            'Análisis de datos',
            'Algoritmos de búsqueda',
            'Sistemas de recomendación',
          ]
        );
      }

      function getModuleSpecificTheory(topic: string): string {
        const theoryMap: { [key: string]: string } = {
          listas:
            'Las listas en Python son estructuras de datos dinámicas que permiten almacenar elementos de diferentes tipos en una secuencia ordenada. Se implementan como arrays dinámicos que pueden crecer o reducirse según sea necesario.',
          tuplas:
            'Las tuplas son estructuras de datos inmutables que almacenan una secuencia ordenada de elementos. Una vez creadas, no pueden modificarse, lo que las hace ideales para datos que no cambiarán durante la ejecución del programa.',
          diccionarios:
            'Los diccionarios implementan el concepto de tabla hash, permitiendo almacenar pares clave-valor con acceso en tiempo constante O(1). Utilizan funciones hash para mapear claves a posiciones en memoria.',
          conjuntos:
            'Los conjuntos implementan la teoría matemática de conjuntos, almacenando elementos únicos sin orden específico. Utilizan tablas hash internamente para garantizar unicidad y operaciones eficientes.',
          'tema 4':
            'Este módulo explora estructuras de datos avanzadas que combinan múltiples conceptos para resolver problemas complejos de manera eficiente.',
        };
        return (
          theoryMap[topic] ||
          `Los fundamentos de ${topic} se basan en principios matemáticos y computacionales que permiten organizar y manipular datos de manera eficiente.`
        );
      }

      function getModuleSpecificPrinciples(topic: string): string[] {
        const principlesMap: { [key: string]: string[] } = {
          listas: [
            'Acceso secuencial a elementos',
            'Inserción y eliminación dinámicas',
            'Almacenamiento contiguo en memoria',
            'Operaciones de indexación eficientes',
          ],
          tuplas: [
            'Inmutabilidad garantizada',
            'Acceso por índice',
            'Uso eficiente de memoria',
            'Habilidad para ser claves de diccionario',
          ],
          diccionarios: [
            'Acceso por clave en tiempo constante',
            'Almacenamiento de pares clave-valor',
            'Eliminación de claves duplicadas',
            'Iteración eficiente sobre elementos',
          ],
          conjuntos: [
            'Elementos únicos automáticamente',
            'Operaciones de conjuntos matemáticos',
            'Búsqueda de pertenencia eficiente',
            'Eliminación automática de duplicados',
          ],
          'tema 4': [
            'Combinación de múltiples estructuras',
            'Optimización para casos específicos',
            'Balance entre memoria y rendimiento',
            'Implementaciones personalizadas',
          ],
        };
        return (
          principlesMap[topic] || [
            'Organización lógica de datos',
            'Operaciones de acceso eficiente',
            'Gestión de memoria optimizada',
            'Algoritmos de manipulación',
          ]
        );
      }

      function getModuleSpecificCode(topic: string): string {
        const codeMap: { [key: string]: string } = {
          listas: `# Estructura básica de listas
mi_lista = [1, 2, 3, 4, 5]

# Agregar elementos
mi_lista.append(6)
mi_lista.insert(0, 0)

# Acceder a elementos
primer_elemento = mi_lista[0]
ultimo_elemento = mi_lista[-1]

# Iterar sobre la lista
for elemento in mi_lista:
    print(elemento)`,
          tuplas: `# Estructura básica de tuplas
mi_tupla = (1, 2, 3, 4, 5)

# Acceder a elementos
primer_elemento = mi_tupla[0]
ultimo_elemento = mi_tupla[-1]

# Desempaquetar tupla
a, b, c, d, e = mi_tupla

# Tupla como clave de diccionario
coordenadas = {(0, 0): 'origen', (1, 1): 'esquina'}`,
          diccionarios: `# Estructura básica de diccionarios
mi_diccionario = {'nombre': 'Juan', 'edad': 25, 'ciudad': 'Madrid'}

# Agregar/modificar elementos
mi_diccionario['profesion'] = 'Programador'
mi_diccionario['edad'] = 26

# Acceder a valores
nombre = mi_diccionario['nombre']
edad = mi_diccionario.get('edad', 0)

# Iterar sobre el diccionario
for clave, valor in mi_diccionario.items():
    print(f'{clave}: {valor}')`,
          conjuntos: `# Estructura básica de conjuntos
mi_conjunto = {1, 2, 3, 4, 5}

# Agregar elementos
mi_conjunto.add(6)
mi_conjunto.update([7, 8, 9])

# Operaciones de conjuntos
otro_conjunto = {4, 5, 6, 7, 8}
union = mi_conjunto | otro_conjunto
interseccion = mi_conjunto & otro_conjunto

# Verificar pertenencia
if 3 in mi_conjunto:
    print('3 está en el conjunto')`,
          'tema 4': `# Estructura básica avanzada
class EstructuraAvanzada:
    def __init__(self):
        self.datos = {}
        self.contador = 0
    
    def agregar(self, clave, valor):
        self.datos[clave] = valor
        self.contador += 1
    
    def obtener(self, clave):
        return self.datos.get(clave, None)
    
    def eliminar(self, clave):
        if clave in self.datos:
            del self.datos[clave]
            self.contador -= 1`,
        };
        return (
          codeMap[topic] ||
          `# Estructura básica de ${topic}
class EstructuraBasica:
    def __init__(self):
        self.datos = []
    
    def agregar(self, elemento):
        self.datos.append(elemento)
    
    def obtener(self, indice):
        return self.datos[indice]`
        );
      }

      function getModuleSpecificOperations(topic: string): string[] {
        const operationsMap: { [key: string]: string[] } = {
          listas: [
            'append() - Agregar al final',
            'insert() - Insertar en posición específica',
            'remove() - Eliminar elemento',
            'pop() - Eliminar y retornar elemento',
            'index() - Encontrar posición de elemento',
          ],
          tuplas: [
            'Acceso por índice',
            'Desempaquetado de valores',
            'Concatenación con +',
            'Repetición con *',
            'Verificación de pertenencia con in',
          ],
          diccionarios: [
            'get() - Obtener valor por clave',
            'update() - Actualizar múltiples pares',
            'pop() - Eliminar y retornar valor',
            'keys() - Obtener todas las claves',
            'values() - Obtener todos los valores',
          ],
          conjuntos: [
            'add() - Agregar elemento único',
            'remove() - Eliminar elemento',
            'union() - Unión de conjuntos',
            'intersection() - Intersección',
            'difference() - Diferencia entre conjuntos',
          ],
          'tema 4': [
            'Operaciones personalizadas',
            'Métodos de optimización',
            'Algoritmos específicos',
            'Validaciones avanzadas',
            'Integración con otras estructuras',
          ],
        };
        return (
          operationsMap[topic] || [
            'Crear estructura',
            'Agregar elementos',
            'Eliminar elementos',
            'Buscar elementos',
            'Modificar elementos',
          ]
        );
      }

      function getModuleSpecificExample1(topic: string): string {
        const example1Map: { [key: string]: string } = {
          listas: `# Ejemplo: Lista de compras
compras = ['pan', 'leche', 'huevos']
print(f'Lista inicial: {compras}')

# Agregar más items
compras.append('queso')
compras.insert(1, 'mantequilla')
print(f'Después de agregar: {compras}')

# Mostrar cada item
for i, item in enumerate(compras, 1):
    print(f'{i}. {item}')`,
          tuplas: `# Ejemplo: Coordenadas GPS
ubicacion = (40.4168, -3.7038)  # Madrid
print(f'Coordenadas: {ubicacion}')

# Desempaquetar
latitud, longitud = ubicacion
print(f'Latitud: {latitud}, Longitud: {longitud}')

# Usar como clave en diccionario
ciudades = {ubicacion: 'Madrid', (41.9028, 12.4964): 'Roma'}
print(f'Ciudad en {ubicacion}: {ciudades[ubicacion]}')`,
          diccionarios: `# Ejemplo: Base de datos de estudiantes
estudiantes = {
    '001': {'nombre': 'Ana', 'edad': 20, 'curso': 'Python'},
    '002': {'nombre': 'Luis', 'edad': 22, 'curso': 'Java'}
}

# Agregar nuevo estudiante
estudiantes['003'] = {'nombre': 'María', 'edad': 21, 'curso': 'Python'}

# Buscar estudiante
id_buscado = '002'
if id_buscado in estudiantes:
    estudiante = estudiantes[id_buscado]
    print(f'Estudiante encontrado: {estudiante["nombre"]}')`,
          conjuntos: `# Ejemplo: Eliminar duplicados de una lista
numeros = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
print(f'Lista con duplicados: {numeros}')

# Convertir a conjunto para eliminar duplicados
numeros_unicos = set(numeros)
print(f'Números únicos: {sorted(numeros_unicos)}')

# Operaciones de conjuntos
pares = {2, 4, 6, 8, 10}
impares = {1, 3, 5, 7, 9}
todos = pares | impares
print(f'Todos los números: {sorted(todos)}')`,
          'tema 4': `# Ejemplo: Estructura de datos personalizada
class ColaPrioridad:
    def __init__(self):
        self.elementos = []
    
    def encolar(self, item, prioridad):
        self.elementos.append((prioridad, item))
        self.elementos.sort(reverse=True)
    
    def desencolar(self):
        if self.elementos:
            return self.elementos.pop(0)[1]
        return None

# Uso
cola = ColaPrioridad()
cola.encolar('tarea_urgente', 3)
cola.encolar('tarea_normal', 1)
print(f'Siguiente tarea: {cola.desencolar()}')`,
        };
        return (
          example1Map[topic] ||
          `# Ejemplo práctico de ${topic}
def procesar_datos(datos):
    resultado = []
    for item in datos:
        if item > 0:
            resultado.append(item * 2)
    return resultado

# Uso
datos = [1, 2, 3, 4, 5]
resultado = procesar_datos(datos)
print(resultado)  # [2, 4, 6, 8, 10]`
        );
      }

      function getModuleSpecificExample2(topic: string): string {
        const example2Map: { [key: string]: string } = {
          listas: `# Ejemplo avanzado: Sistema de inventario
class Inventario:
    def __init__(self):
        self.productos = []
    
    def agregar_producto(self, nombre, precio, stock):
        self.productos.append({
            'nombre': nombre,
            'precio': precio,
            'stock': stock
        })
    
    def buscar_producto(self, nombre):
        for producto in self.productos:
            if producto['nombre'] == nombre:
                return producto
        return None
    
    def actualizar_stock(self, nombre, nuevo_stock):
        producto = self.buscar_producto(nombre)
        if producto:
            producto['stock'] = nuevo_stock

# Uso
inventario = Inventario()
inventario.agregar_producto('Laptop', 999.99, 10)
inventario.agregar_producto('Mouse', 25.50, 50)
print(inventario.buscar_producto('Laptop'))`,
          tuplas: `# Ejemplo avanzado: Sistema de coordenadas 3D
class Punto3D:
    def __init__(self, x, y, z):
        self.coordenadas = (x, y, z)
    
    def distancia_origen(self):
        x, y, z = self.coordenadas
        return (x**2 + y**2 + z**2)**0.5
    
    def distancia_a(self, otro_punto):
        x1, y1, z1 = self.coordenadas
        x2, y2, z2 = otro_punto.coordenadas
        return ((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2)**0.5

# Uso
punto1 = Punto3D(1, 2, 3)
punto2 = Punto3D(4, 5, 6)
print(f'Distancia al origen: {punto1.distancia_origen():.2f}')
print(f'Distancia entre puntos: {punto1.distancia_a(punto2):.2f}')`,
          diccionarios: `# Ejemplo avanzado: Sistema de caché
class Cache:
    def __init__(self, max_size=100):
        self.cache = {}
        self.max_size = max_size
        self.access_order = []
    
    def get(self, key):
        if key in self.cache:
            # Mover al final (más reciente)
            self.access_order.remove(key)
            self.access_order.append(key)
            return self.cache[key]
        return None
    
    def set(self, key, value):
        if len(self.cache) >= self.max_size:
            # Eliminar el menos reciente
            oldest = self.access_order.pop(0)
            del self.cache[oldest]
        
        self.cache[key] = value
        self.access_order.append(key)

# Uso
cache = Cache(max_size=3)
cache.set('user:1', {'nombre': 'Ana'})
cache.set('user:2', {'nombre': 'Luis'})
print(cache.get('user:1'))`,
          conjuntos: `# Ejemplo avanzado: Sistema de recomendaciones
class SistemaRecomendaciones:
    def __init__(self):
        self.usuarios_intereses = {}
        self.productos_categorias = {}
    
    def agregar_intereses_usuario(self, usuario, intereses):
        self.usuarios_intereses[usuario] = set(intereses)
    
    def agregar_categorias_producto(self, producto, categorias):
        self.productos_categorias[producto] = set(categorias)
    
    def recomendar_productos(self, usuario):
        if usuario not in self.usuarios_intereses:
            return []
        
        intereses_usuario = self.usuarios_intereses[usuario]
        recomendaciones = []
        
        for producto, categorias in self.productos_categorias.items():
            if intereses_usuario & categorias:  # Intersección
                recomendaciones.append(producto)
        
        return recomendaciones

# Uso
sistema = SistemaRecomendaciones()
sistema.agregar_intereses_usuario('Ana', ['tecnologia', 'deportes'])
sistema.agregar_categorias_producto('iPhone', ['tecnologia', 'comunicacion'])
print(sistema.recomendar_productos('Ana'))`,
          'tema 4': `# Ejemplo avanzado: Árbol binario de búsqueda
class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

class ArbolBinario:
    def __init__(self):
        self.raiz = None
    
    def insertar(self, valor):
        self.raiz = self._insertar_recursivo(self.raiz, valor)
    
    def _insertar_recursivo(self, nodo, valor):
        if nodo is None:
            return Nodo(valor)
        
        if valor < nodo.valor:
            nodo.izquierda = self._insertar_recursivo(nodo.izquierda, valor)
        else:
            nodo.derecha = self._insertar_recursivo(nodo.derecha, valor)
        
        return nodo
    
    def buscar(self, valor):
        return self._buscar_recursivo(self.raiz, valor)
    
    def _buscar_recursivo(self, nodo, valor):
        if nodo is None or nodo.valor == valor:
            return nodo
        if valor < nodo.valor:
            return self._buscar_recursivo(nodo.izquierda, valor)
        return self._buscar_recursivo(nodo.derecha, valor)

# Uso
arbol = ArbolBinario()
for valor in [5, 3, 7, 1, 9]:
    arbol.insertar(valor)
print(arbol.buscar(3) is not None)`,
        };
        return (
          example2Map[topic] ||
          `# Caso de uso avanzado
class GestorDatos:
    def __init__(self):
        self.estructura = {}
    
    def agregar_usuario(self, id, datos):
        self.estructura[id] = datos
    
    def buscar_usuario(self, id):
        return self.estructura.get(id, None)

# Implementación
gestor = GestorDatos()
gestor.agregar_usuario(1, {'nombre': 'Juan', 'edad': 25})
usuario = gestor.buscar_usuario(1)
print(usuario)`
        );
      }

      function getModuleSpecificSummary(topic: string): string[] {
        const summaryMap: { [key: string]: string[] } = {
          listas: [
            'Entendimos la flexibilidad de las listas para almacenar datos dinámicos',
            'Aprendimos las operaciones básicas de inserción, eliminación y acceso',
            'Implementamos estructuras de datos lineales eficientes',
            'Vimos casos de uso prácticos en sistemas reales',
          ],
          tuplas: [
            'Entendimos la importancia de la inmutabilidad en programación',
            'Aprendimos a usar tuplas como claves en diccionarios',
            'Implementamos estructuras de datos fijas y eficientes',
            'Vimos aplicaciones en coordenadas y configuraciones',
          ],
          diccionarios: [
            'Entendimos el poder del acceso por clave en tiempo constante',
            'Aprendimos a organizar datos estructurados eficientemente',
            'Implementamos sistemas de caché y bases de datos simples',
            'Vimos aplicaciones en sistemas de recomendaciones',
          ],
          conjuntos: [
            'Entendimos la importancia de la unicidad en los datos',
            'Aprendimos operaciones matemáticas de conjuntos',
            'Implementamos sistemas de filtrado y eliminación de duplicados',
            'Vimos aplicaciones en sistemas de recomendaciones avanzados',
          ],
          'tema 4': [
            'Entendimos la importancia de estructuras de datos personalizadas',
            'Aprendimos a combinar múltiples conceptos para resolver problemas',
            'Implementamos soluciones optimizadas para casos específicos',
            'Vimos aplicaciones en sistemas de alto rendimiento',
          ],
        };
        return (
          summaryMap[topic] || [
            'Entendimos la importancia de la estructura',
            'Aprendimos los fundamentos teóricos',
            'Implementamos estructuras básicas',
            'Vimos casos de uso prácticos',
          ]
        );
      }

      function getModuleSpecificNextSteps(topic: string): string {
        const nextStepsMap: { [key: string]: string } = {
          listas:
            'Ahora puedes explorar algoritmos de ordenamiento como quicksort y mergesort, implementar pilas y colas usando listas, y estudiar la complejidad temporal de las operaciones.',
          tuplas:
            'Te recomendamos estudiar namedtuples para estructuras de datos más legibles, explorar el desempaquetado avanzado, y ver cómo se usan en frameworks como Django.',
          diccionarios:
            'Puedes profundizar en defaultdict y Counter de collections, estudiar JSON y serialización, y explorar bases de datos NoSQL que usan conceptos similares.',
          conjuntos:
            'Te sugerimos estudiar frozenset para conjuntos inmutables, explorar operaciones de conjuntos más complejas, y ver aplicaciones en teoría de grafos.',
          'tema 4':
            'Puedes explorar estructuras de datos más avanzadas como árboles, grafos, y tablas hash personalizadas, y estudiar algoritmos de optimización.',
        };
        return (
          nextStepsMap[topic] ||
          `Ahora puedes aplicar estos conceptos en tus propios proyectos. Te recomendamos practicar con ejercicios adicionales y explorar variaciones más avanzadas de estas estructuras.`
        );
      }

      console.log('🏗️ Creating modules...');

      // Crear los 5 módulos inmediatamente, pero solo con contenido en el módulo 1
      for (let i = 0; i < totalModules; i++) {
        try {
          console.log(`📚 Creating module ${i + 1}: ${moduleTitles[i]}`);

          const mod = orderedModules[i];
          const isFirstModule = i === 0;

          if (isFirstModule) {
            // Módulo 1: Generar lecciones completas e individuales usando IA
            console.log(
              '🎯 Generating complete individual lessons for Module 1...'
            );

            // Generar 5 lecciones completas e individuales para el módulo 1
            const module1Result = await generateCompleteLessonsForModule(
              moduleTitles[i],
              doc.meta.topic,
              level,
              1 // Módulo 1
            );
            mod.lessons = module1Result.lessons;
            mod.quizQuestions = module1Result.quizQuestions;
          } else {
            // Módulos 2-5: Crear con títulos pero sin contenido (se generará al iniciar curso)
            console.log(
              `📝 Creating module ${i + 1} with title only (content will be generated on course start)...`
            );
            mod.lessons = []; // Sin lecciones por ahora
          }

          const lessonBlocks = mod.lessons[0]?.blocks || [];
          const p = lessonBlocks.find((b: any) => b.type === 'paragraph');
          const desc = String((p as any)?.data?.text || firstParagraph).slice(
            0,
            300
          );

          console.log(
            `💾 Creating module in database: ${moduleTitles[i] || `Módulo ${i + 1}`}`
          );
          const module = await db.module.create({
            data: {
              courseId: course.id,
              moduleOrder: i + 1,
              title: moduleTitles[i] || `Módulo ${i + 1}`,
              description: desc,
            },
          });
          console.log(`✅ Module ${i + 1} created with ID: ${module.id}`);

          // Solo crear chunks para el módulo 1 (con contenido completo)
          if (isFirstModule) {
            console.log(
              `📝 Creating ${mod.lessons.length} chunks for module ${i + 1}...`
            );
            for (let j = 0; j < mod.lessons.length; j++) {
              try {
                const lesson = mod?.lessons?.[j];
                const lb = lesson?.blocks || [];
                const miniDoc = {
                  version: doc.version,
                  locale: doc.locale,
                  content_id: `${doc.content_id}_m${i + 1}_l${j + 1}`,
                  meta: {
                    ...doc.meta,
                    topic:
                      lesson?.title || `${moduleTitles[i]} - Lección ${j + 1}`,
                  },
                  blocks: lb,
                };

                console.log(
                  `  📄 Creating chunk ${j + 1}: ${lesson?.title || `Lección ${j + 1}`}`
                );
                await db.chunk.create({
                  data: {
                    moduleId: module.id,
                    chunkOrder: j + 1,
                    title: lesson?.title || `Lección ${j + 1}`,
                    content: JSON.stringify(miniDoc),
                    videoData: lesson?.videoData || null,
                  },
                });
                console.log(`  ✅ Chunk ${j + 1} created`);
              } catch (chunkError) {
                console.error(
                  `❌ Error creating chunk ${j + 1} for module ${i + 1}:`,
                  chunkError
                );
                throw chunkError;
              }
            }
          } else {
            console.log(
              `⏳ Skipping chunks for module ${i + 1} (will be generated on course start)`
            );
          }

          // Solo crear quiz para el módulo 1
          if (isFirstModule) {
            console.log(`❓ Creating quiz for module ${i + 1}...`);
            const quiz = await db.quiz.create({
              data: {
                moduleId: module.id,
                quizOrder: 1,
                title: `Quiz: ${moduleTitles[i]}`,
              },
            });

            // Crear las 5 preguntas del quiz
            if (mod.quizQuestions && mod.quizQuestions.length > 0) {
              for (let q = 0; q < mod.quizQuestions.length; q++) {
                const question = mod.quizQuestions[q];
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
                `✅ Created ${mod.quizQuestions.length} quiz questions for module ${i + 1}`
              );
            } else {
              // Fallback: crear una pregunta básica
              await db.quizQuestion.create({
                data: {
                  quizId: quiz.id,
                  questionOrder: 1,
                  question:
                    'Autoevaluación: ¿Cuál fue el concepto principal de esta lección?',
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
            }
            console.log(`✅ Quiz for module ${i + 1} created`);
          } else {
            console.log(
              `⏳ Skipping quiz for module ${i + 1} (will be generated on course start)`
            );
          }

          console.log(`✅ Module ${i + 1} completed successfully`);
        } catch (moduleError) {
          console.error(`❌ Error creating module ${i + 1}:`, moduleError);
          throw moduleError;
        }
      }

      console.log('📝 Updating course status to READY...');
      // Actualizar curso a READY con título/desc básicos, módulos y lista
      await db.course.update({
        where: { courseId },
        data: {
          status: 'READY',
          title: doc.meta.topic,
          description: firstParagraph,
          totalModules: totalModules,
          moduleList: JSON.stringify(moduleTitles),
          topics: JSON.stringify(courseTopics.slice(0, 5)),
          language: doc.locale,
        },
      });
      console.log('✅ Course status updated to READY');

      // Los módulos 2-5 se generarán solo cuando el usuario inicie el curso
      console.log(
        '📝 Modules 2-5 will be generated when user starts the course'
      );

      await db.generationLog.create({
        data: {
          courseId: course.id,
          action: 'content_ready',
          message: 'ContentDocument generated and stored',
        },
      });
      console.log('✅ Generation log created');

      const response: CourseCreateResponse = {
        id: course.id,
        status: 'ready',
        title: doc.meta.topic,
        message: 'Curso creado con ContentDocument listo para renderizar',
      };

      console.log('🎉 Course creation completed successfully!');
      return NextResponse.json(response);
    } catch (error) {
      console.error('💥 Course generation failed:', error);

      // Log detailed error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        courseId: course.id,
      });

      // Log error and update status
      await db.generationLog.create({
        data: {
          courseId: course.id,
          action: 'generation_error',
          message: `Generation failed: ${errorMessage}`,
          details: JSON.stringify({ error: errorMessage, stack: errorStack }),
        },
      });

      await db.course.update({
        where: { courseId },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        {
          error: 'Course generation failed. Please try again.',
          details: errorMessage,
          courseId: course.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
