/**
 * Sistema de validación de calidad para contenido generado por IA
 * Asegura que todo el contenido cumpla con estándares premium
 */

export interface QualityMetrics {
  contentDepth: number;
  technicalAccuracy: number;
  practicalValue: number;
  structureQuality: number;
  overallScore: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: QualityMetrics;
  issues: string[];
  recommendations: string[];
}

export class ContentQualityValidator {
  private static readonly MIN_CHUNK_LENGTH = 1200;
  private static readonly MIN_QUIZ_QUESTIONS = 7;
  private static readonly MIN_CHUNKS = 6;
  private static readonly MIN_OVERALL_SCORE = 90; // Aumentamos el estándar mínimo
  private static readonly MIN_PRACTICAL_EXAMPLES = 2; // Mínimo de ejemplos prácticos por módulo

  /**
   * Valida la calidad completa de un módulo generado
   */
  static validateModuleContent(
    content: any,
    moduleTitle: string
  ): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validar estructura básica
    if (
      !content.title ||
      !content.description ||
      !content.chunks ||
      !content.quiz
    ) {
      issues.push(
        'Estructura de módulo incompleta - faltan campos obligatorios'
      );
      return {
        isValid: false,
        score: this.getZeroScore(),
        issues,
        recommendations,
      };
    }

    // Validar chunks
    const chunkValidation = this.validateChunks(content.chunks, moduleTitle);
    issues.push(...chunkValidation.issues);
    recommendations.push(...chunkValidation.recommendations);

    // Validar quiz
    const quizValidation = this.validateQuiz(content.quiz, moduleTitle);
    issues.push(...quizValidation.issues);
    recommendations.push(...quizValidation.recommendations);

    // Validar descripción del módulo
    const descriptionValidation = this.validateDescription(
      content.description,
      moduleTitle
    );
    issues.push(...descriptionValidation.issues);
    recommendations.push(...descriptionValidation.recommendations);

    // Validar ejemplos prácticos
    const practicalValidation = this.validatePracticalContent(
      content.chunks,
      moduleTitle
    );
    issues.push(...practicalValidation.issues);
    recommendations.push(...practicalValidation.recommendations);

    // Validar estructura de markdown
    const markdownValidation = this.validateMarkdownStructure(content.chunks);
    issues.push(...markdownValidation.issues);
    recommendations.push(...markdownValidation.recommendations);

    // Calcular métricas de calidad
    const score = this.calculateQualityScore(content, moduleTitle);

    const isValid =
      issues.length === 0 && score.overallScore >= this.MIN_OVERALL_SCORE;

    return {
      isValid,
      score,
      issues,
      recommendations,
    };
  }

  /**
   * Valida la calidad de los chunks de contenido
   */
  private static validateChunks(
    chunks: any[],
    moduleTitle: string
  ): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!chunks || chunks.length < this.MIN_CHUNKS) {
      issues.push(
        `Insuficientes chunks de contenido: ${chunks?.length || 0}/${this.MIN_CHUNKS} requeridos`
      );
      return { issues, recommendations };
    }

    chunks.forEach((chunk, index) => {
      if (!chunk.title || !chunk.content) {
        issues.push(`Chunk ${index + 1}: Estructura incompleta`);
        return;
      }

      // Validar longitud mínima
      if (chunk.content.length < this.MIN_CHUNK_LENGTH) {
        issues.push(
          `Chunk ${index + 1}: Contenido muy corto (${chunk.content.length}/${this.MIN_CHUNK_LENGTH} caracteres)`
        );
      }

      // Validar que no sea contenido genérico
      if (this.isGenericContent(chunk.content, moduleTitle)) {
        issues.push(
          `Chunk ${index + 1}: Contiene contenido genérico no específico al tema`
        );
      }

      // Validar estructura Markdown
      if (!this.hasProperMarkdownStructure(chunk.content)) {
        issues.push(`Chunk ${index + 1}: Estructura Markdown deficiente`);
        recommendations.push(
          `Chunk ${index + 1}: Mejorar estructura con títulos, listas y formato apropiado`
        );
      }

      // Validar contenido técnico específico
      if (!this.hasSpecificTechnicalContent(chunk.content, moduleTitle)) {
        issues.push(
          `Chunk ${index + 1}: Falta contenido técnico específico del tema`
        );
        recommendations.push(
          `Chunk ${index + 1}: Incluir ejemplos de código, herramientas específicas y casos de uso reales`
        );
      }
    });

    return { issues, recommendations };
  }

  /**
   * Valida la calidad del quiz
   */
  private static validateQuiz(
    quiz: any,
    moduleTitle: string
  ): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!quiz.questions || quiz.questions.length < this.MIN_QUIZ_QUESTIONS) {
      issues.push(
        `Quiz insuficiente: ${quiz.questions?.length || 0}/${this.MIN_QUIZ_QUESTIONS} preguntas requeridas`
      );
      return { issues, recommendations };
    }

    quiz.questions.forEach((question: any, index: number) => {
      if (!question.question || !question.options || !question.explanation) {
        issues.push(`Pregunta ${index + 1}: Estructura incompleta`);
        return;
      }

      if (question.options.length !== 4) {
        issues.push(`Pregunta ${index + 1}: Debe tener exactamente 4 opciones`);
      }

      if (
        typeof question.correctAnswer !== 'number' ||
        question.correctAnswer < 0 ||
        question.correctAnswer > 3
      ) {
        issues.push(`Pregunta ${index + 1}: Respuesta correcta inválida`);
      }

      // Validar que no sean preguntas obvias
      if (this.isObviousQuestion(question.question, question.options)) {
        issues.push(
          `Pregunta ${index + 1}: Pregunta demasiado obvia o trivial`
        );
        recommendations.push(
          `Pregunta ${index + 1}: Crear pregunta más desafiante que evalúe comprensión profunda`
        );
      }

      // Validar explicación de calidad
      if (question.explanation.length < 100) {
        issues.push(`Pregunta ${index + 1}: Explicación muy corta`);
        recommendations.push(
          `Pregunta ${index + 1}: Expandir explicación con conceptos adicionales`
        );
      }
    });

    return { issues, recommendations };
  }

  /**
   * Valida la descripción del módulo
   */
  private static validateDescription(
    description: string,
    moduleTitle: string
  ): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!description || description.length < 150) {
      issues.push('Descripción del módulo muy corta o inexistente');
      return { issues, recommendations };
    }

    if (description.length > 500) {
      recommendations.push(
        'Descripción muy larga - considerar ser más conciso'
      );
    }

    if (this.isGenericContent(description, moduleTitle)) {
      issues.push('Descripción contiene contenido genérico no específico');
      recommendations.push(
        'Hacer la descripción más específica al tema del módulo'
      );
    }

    return { issues, recommendations };
  }

  /**
   * Detecta contenido genérico no específico
   */
  private static isGenericContent(
    content: string,
    moduleTitle: string
  ): boolean {
    const genericPhrases = [
      'conceptos fundamentales',
      'es importante entender',
      'en este módulo aprenderás',
      'imagina que quieres',
      'es como intentar',
      'antes de poder',
      'de la misma manera',
    ];

    const genericCount = genericPhrases.filter(phrase =>
      content.toLowerCase().includes(phrase)
    ).length;

    // Si más del 30% del contenido son frases genéricas, es problemático
    return genericCount > 2;
  }

  /**
   * Verifica estructura Markdown apropiada
   */
  private static hasProperMarkdownStructure(content: string): boolean {
    const hasHeaders = /^##\s+/.test(content);
    const hasSubheaders = /^###\s+/.test(content);
    const hasLists = /^[•\-\*]\s+/m.test(content) || /^\d+\.\s+/m.test(content);
    const hasEmphasis = /\*\*[^*]+\*\*/.test(content);

    return hasHeaders && (hasSubheaders || hasLists) && hasEmphasis;
  }

  /**
   * Verifica contenido técnico específico
   */
  private static hasSpecificTechnicalContent(
    content: string,
    moduleTitle: string
  ): boolean {
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    const hasInlineCode = /`[^`]+`/.test(content);
    const hasSpecificTerms = content
      .toLowerCase()
      .includes(moduleTitle.toLowerCase());

    // Para contenido técnico, debe tener al menos código o términos específicos
    return hasCodeBlocks || hasInlineCode || hasSpecificTerms;
  }

  /**
   * Detecta preguntas obvias o triviales
   */
  private static isObviousQuestion(
    question: string,
    options: string[]
  ): boolean {
    const obviousPatterns = [
      /¿cuál es el concepto más importante/i,
      /¿qué tipo de práctica es más efectiva/i,
      /¿cuál es el siguiente paso/i,
      /¿qué característica hace/i,
    ];

    return obviousPatterns.some(pattern => pattern.test(question));
  }

  /**
   * Calcula métricas de calidad
   */
  private static calculateQualityScore(
    content: any,
    moduleTitle: string
  ): QualityMetrics {
    let contentDepth = 0;
    let technicalAccuracy = 0;
    let practicalValue = 0;
    let structureQuality = 0;

    // Evaluar profundidad de contenido
    const avgChunkLength =
      content.chunks.reduce(
        (sum: number, chunk: any) => sum + chunk.content.length,
        0
      ) / content.chunks.length;
    contentDepth = Math.min(
      100,
      (avgChunkLength / this.MIN_CHUNK_LENGTH) * 100
    );

    // Evaluar precisión técnica (basado en estructura y especificidad)
    const hasCode = content.chunks.some((chunk: any) =>
      /```[\s\S]*?```/.test(chunk.content)
    );
    const hasSpecificTerms = content.chunks.some((chunk: any) =>
      chunk.content.toLowerCase().includes(moduleTitle.toLowerCase())
    );
    technicalAccuracy = (hasCode ? 50 : 0) + (hasSpecificTerms ? 50 : 0);

    // Evaluar valor práctico
    const hasExamples = content.chunks.some((chunk: any) =>
      /ejemplo|implementación|práctica|proyecto/i.test(chunk.content)
    );
    const hasTools = content.chunks.some((chunk: any) =>
      /herramienta|comando|configuración/i.test(chunk.content)
    );
    practicalValue = (hasExamples ? 50 : 0) + (hasTools ? 50 : 0);

    // Evaluar calidad de estructura
    const hasProperMarkdown = content.chunks.every((chunk: any) =>
      this.hasProperMarkdownStructure(chunk.content)
    );
    const hasGoodQuiz =
      content.quiz.questions.length >= this.MIN_QUIZ_QUESTIONS;
    structureQuality = (hasProperMarkdown ? 50 : 0) + (hasGoodQuiz ? 50 : 0);

    const overallScore =
      (contentDepth + technicalAccuracy + practicalValue + structureQuality) /
      4;

    return {
      contentDepth,
      technicalAccuracy,
      practicalValue,
      structureQuality,
      overallScore,
    };
  }

  /**
   * Valida que el contenido tenga suficientes ejemplos prácticos
   */
  private static validatePracticalContent(
    chunks: any[],
    moduleTitle: string
  ): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    let practicalExamples = 0;
    let codeBlocks = 0;
    let realWorldCases = 0;

    chunks.forEach((chunk, index) => {
      const content = chunk.content.toLowerCase();

      // Contar ejemplos prácticos
      if (
        /ejemplo|implementación|práctica|proyecto|caso de uso/i.test(
          chunk.content
        )
      ) {
        practicalExamples++;
      }

      // Contar bloques de código
      if (/```[\s\S]*?```/.test(chunk.content)) {
        codeBlocks++;
      }

      // Contar casos del mundo real
      if (
        /industria|profesional|empresa|producción|real/i.test(chunk.content)
      ) {
        realWorldCases++;
      }

      // Validar que cada chunk tenga al menos un elemento práctico
      if (
        !/ejemplo|implementación|práctica|```|caso|herramienta/i.test(
          chunk.content
        )
      ) {
        issues.push(
          `Chunk ${index + 1} carece de contenido práctico (ejemplos, código o casos de uso)`
        );
        recommendations.push(
          `Agregar ejemplos prácticos o código funcional al chunk "${chunk.title}"`
        );
      }
    });

    if (practicalExamples < this.MIN_PRACTICAL_EXAMPLES) {
      issues.push(
        `Insuficientes ejemplos prácticos (${practicalExamples}/${this.MIN_PRACTICAL_EXAMPLES})`
      );
      recommendations.push(
        'Incluir más ejemplos prácticos y casos de uso reales'
      );
    }

    if (codeBlocks < 2) {
      issues.push('Módulo carece de suficientes ejemplos de código');
      recommendations.push(
        'Incluir más bloques de código funcional y ejemplos'
      );
    }

    return { issues, recommendations };
  }

  /**
   * Valida la estructura de markdown para renderizado perfecto
   */
  private static validateMarkdownStructure(chunks: any[]): {
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    chunks.forEach((chunk, index) => {
      const content = chunk.content;

      // Validar títulos malformados
      if (/#{1,6}[^\s]/.test(content)) {
        issues.push(`Chunk ${index + 1}: Títulos sin espacio después de #`);
      }

      // Validar listas malformadas
      if (/^[\s]*-[^\s]/m.test(content)) {
        issues.push(`Chunk ${index + 1}: Listas sin espacio después de -`);
      }

      // Validar bloques de código sin lenguaje
      if (/```\n[^`]/.test(content)) {
        issues.push(
          `Chunk ${index + 1}: Bloques de código sin lenguaje especificado`
        );
      }

      // Validar concatenaciones problemáticas
      if (/[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(content)) {
        issues.push(`Chunk ${index + 1}: Texto concatenado detectado`);
        recommendations.push(
          `Revisar y separar palabras pegadas en "${chunk.title}"`
        );
      }

      // Validar estructura jerárquica
      if (!content.includes('##') && !content.includes('###')) {
        issues.push(
          `Chunk ${index + 1}: Falta estructura jerárquica con subtítulos`
        );
        recommendations.push(
          `Agregar subtítulos (### ) para organizar mejor el contenido`
        );
      }

      // Validar párrafos muy largos
      const paragraphs = content.split('\n\n');
      paragraphs.forEach((paragraph: string) => {
        if (paragraph.length > 800 && !paragraph.includes('```')) {
          issues.push(
            `Chunk ${index + 1}: Párrafo excesivamente largo detectado`
          );
          recommendations.push(
            'Dividir párrafos largos en secciones más cortas'
          );
        }
      });
    });

    return { issues, recommendations };
  }

  /**
   * Retorna métricas de calidad cero
   */
  private static getZeroScore(): QualityMetrics {
    return {
      contentDepth: 0,
      technicalAccuracy: 0,
      practicalValue: 0,
      structureQuality: 0,
      overallScore: 0,
    };
  }
}
