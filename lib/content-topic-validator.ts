/**
 * Validador de Contenido Temático para Cursia
 * Detecta temas repetidos entre lecciones y verifica profundidad temática
 */

import { ContentDocument } from './content-contract';

export interface TopicValidationResult {
  isValid: boolean;
  hasRepetitions: boolean;
  repeatedTopics: string[];
  suggestions: string[];
  topics: string[];
  depth: 'shallow' | 'moderate' | 'deep';
  needsMoreDepth: boolean;
}

export interface LessonTopicInfo {
  lessonTitle: string;
  lessonNumber: number;
  mainTopics: string[];
  subtopics: string[];
  keywords: string[];
}

export class ContentTopicValidator {
  /**
   * Valida que no haya repetición de temas entre lecciones del mismo módulo
   */
  public static validateModuleLessons(
    lessons: ContentDocument[],
    moduleTitle: string
  ): TopicValidationResult {
    console.log(`🔍 Validando temas del módulo: ${moduleTitle}`);
    console.log(`📚 Total de lecciones a validar: ${lessons.length}`);

    // Extraer información de cada lección
    const lessonsInfo: LessonTopicInfo[] = lessons.map((lesson, index) =>
      this.extractLessonTopics(lesson, index + 1)
    );

    // Detectar repeticiones
    const repetitions = this.detectTopicRepetitions(lessonsInfo);

    // Validar profundidad
    const depthAnalysis = this.analyzeContentDepth(lessonsInfo);

    // Generar sugerencias
    const suggestions = this.generateSuggestions(
      repetitions,
      depthAnalysis,
      moduleTitle
    );

    const isValid = repetitions.repeatedTopics.length === 0 && !depthAnalysis.needsMoreDepth;

    console.log(`✅ Validación completada:`);
    console.log(`   - Temas únicos: ${repetitions.allTopics.length}`);
    console.log(`   - Repeticiones: ${repetitions.repeatedTopics.length}`);
    console.log(`   - Profundidad: ${depthAnalysis.depth}`);
    console.log(`   - Es válido: ${isValid ? 'SÍ' : 'NO'}`);

    return {
      isValid,
      hasRepetitions: repetitions.repeatedTopics.length > 0,
      repeatedTopics: repetitions.repeatedTopics,
      suggestions,
      topics: repetitions.allTopics,
      depth: depthAnalysis.depth,
      needsMoreDepth: depthAnalysis.needsMoreDepth,
    };
  }

  /**
   * Extrae los temas principales de una lección
   */
  private static extractLessonTopics(
    lesson: ContentDocument,
    lessonNumber: number
  ): LessonTopicInfo {
    const blocks = lesson.blocks || [];
    const lessonTitle = lesson.meta.topic || `Lección ${lessonNumber}`;

    // Extraer headings de nivel 2 (temas principales)
    const mainTopics = blocks
      .filter(
        (block) =>
          block.type === 'heading' &&
          (block.data as any)?.level === 2
      )
      .map((block) => this.normalizeTopicText((block.data as any)?.text || ''))
      .filter((topic) => topic.length > 0);

    // Extraer headings de nivel 3 (subtemas)
    const subtopics = blocks
      .filter(
        (block) =>
          block.type === 'heading' &&
          (block.data as any)?.level === 3
      )
      .map((block) => this.normalizeTopicText((block.data as any)?.text || ''))
      .filter((topic) => topic.length > 0);

    // Extraer keywords de párrafos y listas
    const keywords = this.extractKeywords(blocks);

    console.log(`📄 Lección ${lessonNumber}: ${lessonTitle}`);
    console.log(`   - Temas principales: ${mainTopics.length}`);
    console.log(`   - Subtemas: ${subtopics.length}`);
    console.log(`   - Keywords: ${keywords.length}`);

    return {
      lessonTitle,
      lessonNumber,
      mainTopics,
      subtopics,
      keywords,
    };
  }

  /**
   * Detecta repeticiones de temas entre lecciones
   */
  private static detectTopicRepetitions(
    lessonsInfo: LessonTopicInfo[]
  ): { repeatedTopics: string[]; allTopics: string[] } {
    // Combinar todos los temas principales
    const allMainTopics = lessonsInfo.flatMap((lesson) => lesson.mainTopics);
    
    // Contar frecuencia de cada tema
    const topicFrequency = new Map<string, number>();
    const topicLessons = new Map<string, number[]>();

    allMainTopics.forEach((topic, index) => {
      const lessonIndex = Math.floor(index / (allMainTopics.length / lessonsInfo.length));
      
      const currentCount = topicFrequency.get(topic) || 0;
      topicFrequency.set(topic, currentCount + 1);

      const lessons = topicLessons.get(topic) || [];
      if (!lessons.includes(lessonIndex)) {
        lessons.push(lessonIndex);
      }
      topicLessons.set(topic, lessons);
    });

    // Identificar temas repetidos (aparecen en más de una lección)
    const repeatedTopics: string[] = [];
    topicFrequency.forEach((count, topic) => {
      const lessons = topicLessons.get(topic) || [];
      if (lessons.length > 1) {
        repeatedTopics.push(topic);
        console.log(`⚠️ Tema repetido: "${topic}" en lecciones ${lessons.map(l => l + 1).join(', ')}`);
      }
    });

    // Obtener lista de temas únicos
    const allTopics = Array.from(new Set(allMainTopics));

    return { repeatedTopics, allTopics };
  }

  /**
   * Analiza la profundidad del contenido
   */
  private static analyzeContentDepth(
    lessonsInfo: LessonTopicInfo[]
  ): { depth: 'shallow' | 'moderate' | 'deep'; needsMoreDepth: boolean } {
    // Calcular promedio de subtemas por tema principal
    let totalMainTopics = 0;
    let totalSubtopics = 0;
    let totalBlocks = 0;

    lessonsInfo.forEach((lesson) => {
      totalMainTopics += lesson.mainTopics.length;
      totalSubtopics += lesson.subtopics.length;
      totalBlocks += lesson.mainTopics.length + lesson.subtopics.length;
    });

    const avgSubtopicsPerMainTopic =
      totalMainTopics > 0 ? totalSubtopics / totalMainTopics : 0;
    const avgBlocksPerLesson =
      lessonsInfo.length > 0 ? totalBlocks / lessonsInfo.length : 0;

    console.log(`📊 Análisis de profundidad:`);
    console.log(`   - Promedio de subtemas por tema: ${avgSubtopicsPerMainTopic.toFixed(2)}`);
    console.log(`   - Promedio de bloques por lección: ${avgBlocksPerLesson.toFixed(2)}`);

    let depth: 'shallow' | 'moderate' | 'deep' = 'shallow';
    let needsMoreDepth = false;

    if (avgSubtopicsPerMainTopic >= 3 && avgBlocksPerLesson >= 6) {
      depth = 'deep';
      needsMoreDepth = false;
    } else if (avgSubtopicsPerMainTopic >= 2 && avgBlocksPerLesson >= 4) {
      depth = 'moderate';
      needsMoreDepth = false;
    } else {
      depth = 'shallow';
      needsMoreDepth = true;
      console.log(`⚠️ Contenido superficial detectado`);
    }

    return { depth, needsMoreDepth };
  }

  /**
   * Extrae keywords importantes de los bloques de contenido
   */
  private static extractKeywords(blocks: any[]): string[] {
    const keywords: string[] = [];

    // Palabras comunes a ignorar
    const stopWords = new Set([
      'el',
      'la',
      'de',
      'que',
      'y',
      'a',
      'en',
      'un',
      'una',
      'por',
      'para',
      'con',
      'es',
      'del',
      'las',
      'los',
      'se',
      'al',
      'como',
      'más',
      'esta',
      'este',
      'son',
      'su',
      'sus',
      'o',
      'pero',
      'si',
      'no',
      'también',
      'muy',
    ]);

    blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        const text = (block.data as any)?.text || '';
        const words = text
          .toLowerCase()
          .split(/\s+/)
          .filter(
            (word) =>
              word.length > 4 && !stopWords.has(word) && /^[a-záéíóúñ]+$/.test(word)
          );
        keywords.push(...words);
      }
    });

    // Contar frecuencia y retornar las 10 más comunes
    const frequency = new Map<string, number>();
    keywords.forEach((word) => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    const topKeywords = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return topKeywords;
  }

  /**
   * Normaliza el texto de un tema para comparación
   */
  private static normalizeTopicText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[¿?¡!.,:;""'']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Genera sugerencias para mejorar el contenido
   */
  private static generateSuggestions(
    repetitions: { repeatedTopics: string[]; allTopics: string[] },
    depthAnalysis: { depth: string; needsMoreDepth: boolean },
    moduleTitle: string
  ): string[] {
    const suggestions: string[] = [];

    // Sugerencias por repeticiones
    if (repetitions.repeatedTopics.length > 0) {
      suggestions.push(
        `Detecté ${repetitions.repeatedTopics.length} tema(s) repetido(s). Cada lección debe abordar un aspecto único de "${moduleTitle}".`
      );
      
      repetitions.repeatedTopics.forEach((topic) => {
        suggestions.push(
          `El tema "${topic}" se repite. Profundiza en un aspecto específico en cada lección en lugar de repetir el mismo tema.`
        );
      });

      suggestions.push(
        'Reorganiza las lecciones para que cada una explore un aspecto diferente y progresivo del módulo.'
      );
    }

    // Sugerencias por profundidad
    if (depthAnalysis.needsMoreDepth) {
      suggestions.push(
        `El contenido es demasiado superficial. Cada lección debe tener al menos 3-4 secciones (H3) que profundicen en el tema principal.`
      );
      suggestions.push(
        `Agrega más ejemplos prácticos, casos de uso y ejercicios para cada tema en lugar de solo explicar conceptos brevemente.`
      );
      suggestions.push(
        `Cada lección debe ser autónoma y completa. No saltes rápidamente a un tema nuevo, profundiza en el tema actual.`
      );
    }

    // Sugerencias generales si hay pocos temas únicos
    if (repetitions.allTopics.length < 4) {
      suggestions.push(
        `Solo detecté ${repetitions.allTopics.length} tema(s) único(s) en este módulo. Para un módulo completo sobre "${moduleTitle}", necesitas al menos 4-5 temas únicos.`
      );
      suggestions.push(
        'Divide el módulo en aspectos más específicos: fundamentos, conceptos avanzados, aplicaciones prácticas, casos de uso, mejores prácticas.'
      );
    }

    return suggestions;
  }

  /**
   * Valida el número apropiado de unidades según la complejidad del tema
   */
  public static validateUnitCount(
    moduleTitle: string,
    unitCount: number,
    courseLevel: string
  ): { isValid: boolean; suggestedCount: number; reason: string } {
    // Palabras clave que indican temas complejos
    const complexKeywords = [
      'avanzado',
      'arquitectura',
      'optimización',
      'seguridad',
      'escalabilidad',
      'algoritmos',
      'estructuras de datos',
      'machine learning',
      'inteligencia artificial',
      'bases de datos',
      'sistemas distribuidos',
      'microservicios',
    ];

    // Palabras clave que indican temas básicos
    const simpleKeywords = [
      'introducción',
      'básico',
      'fundamentos',
      'primeros pasos',
      'qué es',
      'conceptos básicos',
      'iniciación',
      'empezando',
    ];

    const lowerTitle = moduleTitle.toLowerCase();
    const isComplex = complexKeywords.some((keyword) =>
      lowerTitle.includes(keyword)
    );
    const isSimple = simpleKeywords.some((keyword) =>
      lowerTitle.includes(keyword)
    );
    const isAdvancedLevel = courseLevel === 'advanced';

    let suggestedCount = 5; // Por defecto
    let reason = '';

    if (isSimple && !isAdvancedLevel) {
      suggestedCount = 3;
      reason =
        'Este es un tema introductorio. 3-4 unidades son suficientes para cubrir los conceptos básicos sin abrumar al estudiante.';
    } else if (isComplex || isAdvancedLevel) {
      suggestedCount = 5;
      reason =
        'Este es un tema complejo que requiere profundidad. 5 unidades permitirán explorar el tema de manera completa.';
    } else {
      suggestedCount = 4;
      reason =
        'Este tema tiene complejidad moderada. 4-5 unidades proporcionarán una cobertura equilibrada.';
    }

    const isValid = Math.abs(unitCount - suggestedCount) <= 1;

    if (!isValid) {
      console.log(`⚠️ Conteo de unidades no ideal para "${moduleTitle}"`);
      console.log(`   - Actual: ${unitCount} unidades`);
      console.log(`   - Sugerido: ${suggestedCount} unidades`);
      console.log(`   - Razón: ${reason}`);
    }

    return {
      isValid,
      suggestedCount,
      reason,
    };
  }

  /**
   * Valida que las lecciones sigan una progresión lógica
   */
  public static validateLessonProgression(
    lessons: LessonTopicInfo[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verificar que hay suficientes lecciones
    if (lessons.length < 3) {
      issues.push(
        `Solo hay ${lessons.length} lección(es). Un módulo debe tener al menos 3-5 lecciones para profundizar en el tema.`
      );
    }

    // Verificar que cada lección tenga temas únicos
    const allTopics = lessons.flatMap((lesson) => lesson.mainTopics);
    const uniqueTopics = new Set(allTopics);

    if (uniqueTopics.size < lessons.length) {
      issues.push(
        `Hay ${lessons.length} lecciones pero solo ${uniqueTopics.size} tema(s) único(s). Cada lección debe abordar un aspecto diferente.`
      );
    }

    // Verificar que las lecciones tengan suficiente contenido
    lessons.forEach((lesson) => {
      const totalTopics = lesson.mainTopics.length + lesson.subtopics.length;
      if (totalTopics < 3) {
        issues.push(
          `La lección "${lesson.lessonTitle}" tiene solo ${totalTopics} sección(es). Necesita al menos 3-4 secciones para ser completa.`
        );
      }
    });

    const isValid = issues.length === 0;
    return { isValid, issues };
  }
}

