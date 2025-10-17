/**
 * Generador de Lecciones con Validación de Temas
 * Garantiza que no haya repeticiones y que el contenido sea profundo
 */

import { askClaude } from './anthropic';
import { ContractPromptBuilder } from './content-contract-prompts';
import {
  ContentDocument,
  ContentContractValidator,
} from '@/lib/content-contract';
import { ContentTopicValidator } from '@/lib/content-topic-validator';

export interface LessonGenerationResult {
  lessons: ContentDocument[];
  validationResult: any;
  attemptsMade: number;
  regenerated: boolean;
}

export interface LessonGenerationOptions {
  moduleTitle: string;
  courseTopic: string;
  level: string;
  totalLessons?: number;
  maxAttempts?: number;
  interests?: string[];
}

/**
 * Genera lecciones con validación automática de temas
 * Si detecta repeticiones, regenera con instrucciones más específicas
 */
export async function generateLessonsWithValidation(
  options: LessonGenerationOptions
): Promise<LessonGenerationResult> {
  const {
    moduleTitle,
    courseTopic,
    level,
    totalLessons = 5,
    maxAttempts = 2,
    interests = [],
  } = options;

  console.log(`🎓 Generando ${totalLessons} lecciones para: ${moduleTitle}`);
  console.log(`   Curso: ${courseTopic}`);
  console.log(`   Nivel: ${level}`);
  console.log(`   Intentos máximos: ${maxAttempts}`);

  let lessons: ContentDocument[] = [];
  let validationResult: any = null;
  let attemptsMade = 0;
  let regenerated = false;

  // Intentar generar lecciones hasta que pasen la validación o se alcance el máximo de intentos
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptsMade = attempt;
    console.log(`\n🔄 Intento ${attempt}/${maxAttempts}`);

    try {
      // Generar las lecciones
      lessons = await generateLessonsInternal(
        moduleTitle,
        courseTopic,
        level,
        totalLessons,
        interests,
        attempt > 1 ? lessons : [] // Pasar lecciones anteriores para evitar repetir temas
      );

      console.log(`✅ ${lessons.length} lecciones generadas`);

      // Validar las lecciones
      validationResult = ContentTopicValidator.validateModuleLessons(
        lessons,
        moduleTitle
      );

      if (validationResult.isValid) {
        console.log(`✅ Validación exitosa en intento ${attempt}`);
        break;
      } else {
        console.log(`⚠️ Validación falló en intento ${attempt}:`);
        console.log(`   - Repeticiones: ${validationResult.hasRepetitions}`);
        console.log(
          `   - Temas repetidos: ${validationResult.repeatedTopics.length}`
        );
        console.log(
          `   - Necesita más profundidad: ${validationResult.needsMoreDepth}`
        );

        if (attempt < maxAttempts) {
          console.log(`🔄 Regenerando lecciones con mejores instrucciones...`);
          regenerated = true;

          // Pequeña pausa antes de regenerar
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log(
            `⚠️ Máximo de intentos alcanzado. Usando último conjunto generado.`
          );
        }
      }
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}:`, error);

      if (attempt === maxAttempts) {
        throw error;
      }

      // Pausa antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return {
    lessons,
    validationResult,
    attemptsMade,
    regenerated,
  };
}

/**
 * Generación interna de lecciones con awareness de temas existentes
 */
async function generateLessonsInternal(
  moduleTitle: string,
  courseTopic: string,
  level: string,
  totalLessons: number,
  interests: string[],
  previousLessons: ContentDocument[]
): Promise<ContentDocument[]> {
  const lessons: ContentDocument[] = [];

  // Extraer temas ya cubiertos en intentos anteriores
  const existingTopics: string[] = [];
  if (previousLessons.length > 0) {
    previousLessons.forEach(lesson => {
      const blocks = lesson.blocks || [];
      blocks.forEach(block => {
        if (block.type === 'heading' && (block.data as any)?.level === 2) {
          const topic = (block.data as any)?.text || '';
          if (topic && !existingTopics.includes(topic)) {
            existingTopics.push(topic);
          }
        }
      });
    });
  }

  // Generar títulos de lecciones específicos y progresivos
  const lessonTitles = generateProgressiveLessonTitles(
    moduleTitle,
    courseTopic,
    totalLessons
  );

  console.log(`📝 Títulos de lecciones generados:`);
  lessonTitles.forEach((title, i) => {
    console.log(`   ${i + 1}. ${title}`);
  });

  // Generar cada lección
  for (let i = 0; i < lessonTitles.length; i++) {
    const lessonTitle = lessonTitles[i];
    const lessonNumber = i + 1;

    console.log(
      `\n📖 Generando lección ${lessonNumber}/${totalLessons}: ${lessonTitle}`
    );

    // Temas a evitar: existingTopics + temas de lecciones ya generadas en este intento
    const topicsToAvoid = [...existingTopics];
    lessons.forEach(lesson => {
      const blocks = lesson.blocks || [];
      blocks.forEach(block => {
        if (block.type === 'heading' && (block.data as any)?.level === 2) {
          const topic = (block.data as any)?.text || '';
          if (topic && !topicsToAvoid.includes(topic)) {
            topicsToAvoid.push(topic);
          }
        }
      });
    });

    const lessonDoc = await generateSingleLesson(
      lessonTitle,
      courseTopic,
      level,
      lessonNumber,
      totalLessons,
      interests,
      topicsToAvoid
    );

    lessons.push(lessonDoc);
    console.log(`✅ Lección ${lessonNumber} generada`);

    // Pequeña pausa entre lecciones para no sobrecargar la API
    if (i < lessonTitles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  return lessons;
}

/**
 * Genera una sola lección con awareness de temas a evitar
 */
async function generateSingleLesson(
  lessonTitle: string,
  courseTopic: string,
  level: string,
  lessonNumber: number,
  totalLessons: number,
  interests: string[],
  existingTopics: string[]
): Promise<ContentDocument> {
  const systemPrompt = ContractPromptBuilder.buildSystemPrompt('chunk');
  const userPrompt = ContractPromptBuilder.buildUserPrompt('chunk', {
    topic: courseTopic,
    level,
    interests,
    lessonTitle,
    lessonNumber,
    totalLessons,
    existingTopics, // Pasar temas existentes para evitar repeticiones
  });

  const response = await askClaude({
    system: systemPrompt,
    user: userPrompt,
  });

  // Parsear respuesta
  let lessonDoc: ContentDocument;

  try {
    // Limpiar respuesta
    let cleaned = response.trim();

    // Extraer JSON si está envuelto en markdown
    const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1];
    }

    // Buscar entre marcadores si existen
    const startMarker = '<<<JSON>>>';
    const endMarker = '<<<END>>>';
    const startIdx = cleaned.indexOf(startMarker);
    const endIdx = cleaned.indexOf(endMarker);
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx + startMarker.length, endIdx).trim();
    }

    // Parsear
    lessonDoc = JSON.parse(cleaned);

    // Validar contrato
    const validation = ContentContractValidator.validateDocument(lessonDoc);
    if (!validation.isValid) {
      throw new Error(
        `Validación de contrato falló: ${validation.errors.join(', ')}`
      );
    }
  } catch (error) {
    console.error(`❌ Error parseando lección ${lessonNumber}:`, error);
    throw error;
  }

  return lessonDoc;
}

/**
 * Genera títulos de lecciones progresivos y específicos
 */
function generateProgressiveLessonTitles(
  moduleTitle: string,
  courseTopic: string,
  totalLessons: number
): string[] {
  // Patrones de progresión según el tipo de curso
  const isProgramming =
    courseTopic.toLowerCase().includes('programación') ||
    courseTopic.toLowerCase().includes('código') ||
    courseTopic.toLowerCase().includes('desarrollo');

  const isCooking =
    courseTopic.toLowerCase().includes('comida') ||
    courseTopic.toLowerCase().includes('cocina') ||
    courseTopic.toLowerCase().includes('receta');

  const isFitness =
    courseTopic.toLowerCase().includes('fitness') ||
    courseTopic.toLowerCase().includes('ejercicio') ||
    courseTopic.toLowerCase().includes('entrenamiento');

  let lessonPatterns: string[] = [];

  if (isProgramming) {
    lessonPatterns = [
      `Fundamentos de ${moduleTitle}`,
      `Conceptos Clave de ${moduleTitle}`,
      `Aplicaciones Prácticas de ${moduleTitle}`,
      `Técnicas Avanzadas de ${moduleTitle}`,
      `Mejores Prácticas y Optimización de ${moduleTitle}`,
    ];
  } else if (isCooking) {
    lessonPatterns = [
      `Introducción a ${moduleTitle}`,
      `Ingredientes y Preparación en ${moduleTitle}`,
      `Técnicas de Cocción para ${moduleTitle}`,
      `Variaciones y Recetas de ${moduleTitle}`,
      `Presentación y Servicio de ${moduleTitle}`,
    ];
  } else if (isFitness) {
    lessonPatterns = [
      `Principios Básicos de ${moduleTitle}`,
      `Técnica y Forma en ${moduleTitle}`,
      `Rutinas y Progresión en ${moduleTitle}`,
      `Variaciones y Adaptaciones de ${moduleTitle}`,
      `Programación Avanzada de ${moduleTitle}`,
    ];
  } else {
    // Patrón genérico pero específico
    lessonPatterns = [
      `Introducción y Conceptos de ${moduleTitle}`,
      `Profundización en ${moduleTitle}`,
      `Aplicación Práctica de ${moduleTitle}`,
      `Técnicas Avanzadas de ${moduleTitle}`,
      `Dominio y Maestría de ${moduleTitle}`,
    ];
  }

  // Retornar solo el número de lecciones solicitadas
  return lessonPatterns.slice(0, totalLessons);
}

/**
 * Valida el conteo de unidades según la complejidad
 */
export function validateModuleUnitCount(
  moduleTitle: string,
  unitCount: number,
  courseLevel: string
): { isValid: boolean; suggestedCount: number; reason: string } {
  return ContentTopicValidator.validateUnitCount(
    moduleTitle,
    unitCount,
    courseLevel
  );
}
