/**
 * EJEMPLO DE INTEGRACIÓN
 * Cómo usar el sistema de validación en tu generación de cursos
 * 
 * Copia y adapta este código en tu archivo de API de generación de módulos
 */

import { generateLessonsWithValidation } from './lesson-generator-with-validation';
import { ContentTopicValidator } from '@/lib/content-topic-validator';
import { ContentDocument } from '@/lib/content-contract';

/**
 * EJEMPLO 1: Generar un módulo completo con validación automática
 */
export async function generateModuleWithValidation(
  moduleTitle: string,
  courseTopic: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  interests: string[]
) {
  console.log(`\n🎓 === GENERANDO MÓDULO: ${moduleTitle} ===\n`);

  // PASO 1: Validar número apropiado de unidades según complejidad del tema
  console.log(`📊 Validando número de unidades...`);
  const unitValidation = ContentTopicValidator.validateUnitCount(
    moduleTitle,
    5, // Número por defecto
    level
  );

  console.log(`   ${unitValidation.isValid ? '✅' : '⚠️'} Validación de unidades:`);
  console.log(`      - Sugerido: ${unitValidation.suggestedCount} unidades`);
  console.log(`      - Razón: ${unitValidation.reason}`);

  const totalLessons = unitValidation.suggestedCount;

  // PASO 2: Generar lecciones con validación automática
  console.log(`\n📚 Generando ${totalLessons} lecciones con validación...`);
  const result = await generateLessonsWithValidation({
    moduleTitle,
    courseTopic,
    level,
    totalLessons,
    maxAttempts: 2, // Intentará hasta 2 veces si detecta problemas
    interests,
  });

  // PASO 3: Revisar resultado de validación
  console.log(`\n📋 Resultado de validación:`);
  console.log(`   - Lecciones generadas: ${result.lessons.length}`);
  console.log(`   - Intentos realizados: ${result.attemptsMade}`);
  console.log(`   - Se regeneró: ${result.regenerated ? 'SÍ' : 'NO'}`);
  console.log(`   - Es válido: ${result.validationResult.isValid ? 'SÍ' : 'NO'}`);

  if (result.validationResult.hasRepetitions) {
    console.log(`\n⚠️ Se detectaron ${result.validationResult.repeatedTopics.length} tema(s) repetido(s):`);
    result.validationResult.repeatedTopics.forEach((topic: string) => {
      console.log(`      - "${topic}"`);
    });
  }

  if (result.validationResult.needsMoreDepth) {
    console.log(`\n⚠️ El contenido es superficial (profundidad: ${result.validationResult.depth})`);
  }

  if (result.validationResult.suggestions.length > 0) {
    console.log(`\n💡 Sugerencias de mejora:`);
    result.validationResult.suggestions.forEach((suggestion: string, i: number) => {
      console.log(`   ${i + 1}. ${suggestion}`);
    });
  }

  // PASO 4: Retornar resultado
  console.log(`\n✅ Módulo generado exitosamente\n`);
  return {
    lessons: result.lessons,
    validation: result.validationResult,
    metadata: {
      totalLessons,
      attemptsMade: result.attemptsMade,
      regenerated: result.regenerated,
    },
  };
}

/**
 * EJEMPLO 2: Validar contenido existente de un módulo
 */
export async function validateExistingModule(
  lessons: ContentDocument[],
  moduleTitle: string
): Promise<{
  isValid: boolean;
  report: string;
  needsRegeneration: boolean;
}> {
  console.log(`\n🔍 === VALIDANDO MÓDULO EXISTENTE: ${moduleTitle} ===\n`);

  // Validar las lecciones
  const validation = ContentTopicValidator.validateModuleLessons(
    lessons,
    moduleTitle
  );

  // Generar reporte
  let report = `Validación del Módulo: ${moduleTitle}\n`;
  report += `=====================================\n\n`;
  report += `Total de lecciones: ${lessons.length}\n`;
  report += `Temas únicos detectados: ${validation.topics.length}\n`;
  report += `Profundidad: ${validation.depth}\n`;
  report += `Estado: ${validation.isValid ? 'VÁLIDO ✅' : 'NECESITA MEJORA ⚠️'}\n\n`;

  if (validation.hasRepetitions) {
    report += `🔄 TEMAS REPETIDOS (${validation.repeatedTopics.length}):\n`;
    validation.repeatedTopics.forEach((topic) => {
      report += `   - "${topic}"\n`;
    });
    report += `\n`;
  }

  if (validation.needsMoreDepth) {
    report += `📉 CONTENIDO SUPERFICIAL\n`;
    report += `   El contenido necesita más profundidad.\n`;
    report += `   Profundidad actual: ${validation.depth}\n\n`;
  }

  if (validation.suggestions.length > 0) {
    report += `💡 SUGERENCIAS DE MEJORA:\n`;
    validation.suggestions.forEach((suggestion, i) => {
      report += `   ${i + 1}. ${suggestion}\n`;
    });
    report += `\n`;
  }

  console.log(report);

  return {
    isValid: validation.isValid,
    report,
    needsRegeneration: !validation.isValid,
  };
}

/**
 * EJEMPLO 3: Uso en tu API endpoint existente
 * 
 * Reemplaza tu código de generación actual con esto:
 */
export async function generateModuleForAPI(
  courseId: string,
  moduleTitle: string,
  courseTopic: string,
  level: string,
  interests: string[],
  db: any // Tu instancia de Prisma
) {
  try {
    console.log(`\n🚀 Iniciando generación de módulo: ${moduleTitle}`);

    // 1. Generar módulo con validación
    const result = await generateModuleWithValidation(
      moduleTitle,
      courseTopic,
      level as 'beginner' | 'intermediate' | 'advanced',
      interests
    );

    // 2. Crear módulo en base de datos
    const module = await db.module.create({
      data: {
        courseId,
        moduleOrder: 1, // Ajusta según sea necesario
        title: moduleTitle,
        description: `Módulo sobre ${moduleTitle}. Incluye ${result.lessons.length} lecciones completas con contenido validado.`,
      },
    });

    console.log(`✅ Módulo creado en DB con ID: ${module.id}`);

    // 3. Guardar lecciones (chunks) en base de datos
    for (let i = 0; i < result.lessons.length; i++) {
      const lesson = result.lessons[i];

      await db.chunk.create({
        data: {
          moduleId: module.id,
          chunkOrder: i + 1,
          title: lesson.meta.topic,
          content: JSON.stringify(lesson),
          videoData: null,
        },
      });

      console.log(`   ✅ Lección ${i + 1} guardada: ${lesson.meta.topic}`);
    }

    // 4. Crear quiz del módulo (tu lógica existente aquí)
    // ...

    console.log(`\n✅ Módulo completado exitosamente`);
    if (result.metadata.regenerated) {
      console.log(
        `   ℹ️ Se regeneró el contenido en ${result.metadata.attemptsMade} intentos para asegurar calidad`
      );
    }

    return {
      success: true,
      moduleId: module.id,
      lessonsCount: result.lessons.length,
      validationPassed: result.validation.isValid,
    };
  } catch (error) {
    console.error(`❌ Error generando módulo:`, error);
    throw error;
  }
}

/**
 * EJEMPLO 4: Validación post-generación (opcional)
 * 
 * Si quieres validar después de que el contenido ya está en la base de datos:
 */
export async function validateModuleInDatabase(moduleId: string, db: any) {
  console.log(`\n🔍 Validando módulo en base de datos: ${moduleId}`);

  // 1. Obtener módulo y sus chunks
  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      chunks: {
        orderBy: { chunkOrder: 'asc' },
      },
    },
  });

  if (!module) {
    throw new Error(`Módulo no encontrado: ${moduleId}`);
  }

  // 2. Parsear chunks a ContentDocument
  const lessons: ContentDocument[] = module.chunks.map((chunk: any) => {
    try {
      return JSON.parse(chunk.content) as ContentDocument;
    } catch (error) {
      console.error(`Error parseando chunk ${chunk.id}:`, error);
      throw error;
    }
  });

  // 3. Validar
  const validationResult = await validateExistingModule(lessons, module.title);

  // 4. Si no es válido, puedes regenerar
  if (validationResult.needsRegeneration) {
    console.log(`\n⚠️ El módulo necesita ser regenerado`);
    console.log(`   ¿Deseas regenerar automáticamente? (Implementa tu lógica aquí)`);
  }

  return validationResult;
}

/**
 * EJEMPLO 5: Configuración personalizada
 */
export const validationConfig = {
  // Configuración estricta (producción)
  strict: {
    maxAttempts: 3, // Más intentos para asegurar calidad
    minBlocksPerLesson: 12, // Mínimo de bloques por lección
    minSubtopicsPerTopic: 3, // Mínimo de subtemas por tema
    allowRepetitions: false, // No permitir ninguna repetición
  },

  // Configuración flexible (desarrollo/testing)
  flexible: {
    maxAttempts: 1, // Un solo intento
    minBlocksPerLesson: 8, // Menos estricto
    minSubtopicsPerTopic: 2, // Menos estricto
    allowRepetitions: true, // Permitir algunas repeticiones
  },

  // Configuración balanceada (recomendada)
  balanced: {
    maxAttempts: 2, // Balance entre calidad y tiempo
    minBlocksPerLesson: 10, // Balance
    minSubtopicsPerTopic: 3, // Balance
    allowRepetitions: false, // No repeticiones
  },
};

/**
 * USO RECOMENDADO EN TU API:
 * 
 * 1. En tu archivo: app/api/courses/[id]/generate-module/route.ts
 * 
 * import { generateModuleForAPI } from '@/lib/ai/integration-example';
 * 
 * export async function POST(request: NextRequest, { params }) {
 *   const { moduleTitle, courseTopic, level, interests } = await request.json();
 *   const courseId = params.id;
 *   
 *   const result = await generateModuleForAPI(
 *     courseId,
 *     moduleTitle,
 *     courseTopic,
 *     level,
 *     interests,
 *     db
 *   );
 *   
 *   return NextResponse.json(result);
 * }
 */

