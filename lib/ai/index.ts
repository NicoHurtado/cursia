/**
 * Índice de exportaciones de AI
 * Facilita las importaciones desde otros archivos
 */

// Validación de contenido
export {
  ContentTopicValidator,
  type TopicValidationResult,
  type LessonTopicInfo,
} from '../content-topic-validator';

// Generación con validación
export {
  generateLessonsWithValidation,
  validateModuleUnitCount,
  type LessonGenerationResult,
  type LessonGenerationOptions,
} from './lesson-generator-with-validation';

// Funciones de AI base
export {
  askClaude,
  generateCourseMetadata,
  generateModuleContent,
} from './anthropic';

// Builders de prompts
export { ContractPromptBuilder } from './content-contract-prompts';

// Fallback
export { fallbackAI } from './fallback';

// Simple AI (compatible con código existente)
export { simpleAI, SimpleAI } from './simple';

/**
 * EJEMPLO DE USO:
 *
 * import { generateLessonsWithValidation, ContentTopicValidator } from '@/lib/ai';
 *
 * const result = await generateLessonsWithValidation({
 *   moduleTitle: 'Arrays en JavaScript',
 *   courseTopic: 'JavaScript para Principiantes',
 *   level: 'beginner',
 *   totalLessons: 5,
 *   maxAttempts: 2,
 *   interests: ['programación', 'web']
 * });
 *
 * if (result.validationResult.isValid) {
 *   console.log('✅ Lecciones válidas generadas');
 * }
 */
