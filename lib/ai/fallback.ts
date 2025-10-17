/**
 * Fallback AI System - No external API dependencies
 * Generates basic course content when Anthropic API is unavailable
 * Uses Content Contract for consistent structure
 */

import { ContentDocument, ContentContractUtils } from '@/lib/content-contract';

export class FallbackAI {
  /**
   * Generate course metadata using Content Contract
   */
  public async generateCourseMetadata(
    prompt: string,
    level: string,
    interests: string[]
  ): Promise<string> {
    console.log('🔄 Using fallback AI for course metadata generation...');

    const courseTitle = this.generateCourseTitle(prompt);
    const levelTyped = level.toLowerCase() as
      | 'beginner'
      | 'intermediate'
      | 'advanced';

    // Create Content Document following the contract
    const document: ContentDocument = {
      version: '1.0.0',
      locale: 'es',
      content_id: `fallback-${Date.now()}`,
      meta: {
        topic: courseTitle,
        audience: 'Estudiantes',
        level: levelTyped,
        created_at: new Date().toISOString(),
      },
      blocks: [
        ContentContractUtils.createHeading('Información del Curso', 1),
        ContentContractUtils.createParagraph(
          `Curso de ${courseTitle} diseñado para nivel ${level}. Este curso te ayudará a aprender los conceptos fundamentales y aplicaciones prácticas de manera estructurada y progresiva.`
        ),
        ContentContractUtils.createHeading('Prerequisitos', 2),
        ContentContractUtils.createList(
          'bulleted',
          this.generatePrerequisites(level)
        ),
        ContentContractUtils.createHeading('Módulos del Curso', 2),
        ContentContractUtils.createList(
          'numbered',
          this.generateModuleList(courseTitle)
        ),
        ContentContractUtils.createHeading('Objetivos de Aprendizaje', 2),
        ContentContractUtils.createList('bulleted', [
          'Comprender los conceptos fundamentales',
          'Aplicar conocimientos en proyectos prácticos',
          'Desarrollar habilidades profesionales',
          'Prepararse para niveles avanzados',
        ]),
        ContentContractUtils.createCallout(
          'info',
          'Duración Estimada',
          'Este curso está diseñado para completarse en 5-7 horas de estudio y práctica.'
        ),
      ],
    };

    return JSON.stringify(document, null, 2);
  }

  /**
   * Generate module content using Content Contract
   */
  public async generateModuleContent(
    courseTitle: string,
    moduleTitle: string,
    moduleOrder: number,
    totalModules: number,
    courseDescription: string,
    previousModules?: Array<{title: string, topics: string[], description: string}>,
    courseOutline?: string[]
  ): Promise<string> {
    console.log(
      `🔄 Using fallback AI for module ${moduleOrder} content generation...`
    );

    // Create Content Document following the contract
    const document: ContentDocument = {
      version: '1.0.0',
      locale: 'es',
      content_id: `fallback-${Date.now()}`,
      meta: {
        topic: moduleTitle,
        audience: 'Estudiantes',
        level: 'beginner', // Default level for fallback
        created_at: new Date().toISOString(),
      },
      blocks: [
        ContentContractUtils.createHeading(moduleTitle, 1),
        ContentContractUtils.createParagraph(
          `Módulo ${moduleOrder} de ${totalModules}: ${moduleTitle}. En este módulo aprenderás los conceptos fundamentales y aplicaciones prácticas de manera estructurada.`
        ),
        ...this.generateModuleBlocks(moduleTitle, moduleOrder),
      ],
    };

    return JSON.stringify(document, null, 2);
  }

  /**
   * Generate course title
   */
  private generateCourseTitle(prompt: string): string {
    // Try to extract a more specific title from prompt
    const words = prompt.split(' ').slice(0, 8); // Take first 8 words
    const cleanWords = words.filter(
      word =>
        word.length > 3 &&
        ![
          'curso',
          'course',
          'aprender',
          'learn',
          'sobre',
          'about',
          'de',
          'the',
          'un',
          'a',
        ].includes(word.toLowerCase())
    );

    if (cleanWords.length > 0) {
      return cleanWords.join(' ');
    }

    return `Curso de Programación`;
  }

  /**
   * Generate module blocks using Content Contract
   */
  private generateModuleBlocks(
    moduleTitle: string,
    moduleOrder: number
  ): any[] {
    const blocks = [
      ContentContractUtils.createHeading('Introducción', 2),
      ContentContractUtils.createParagraph(
        'En este módulo exploraremos los conceptos fundamentales y aplicaciones prácticas.'
      ),

      ContentContractUtils.createHeading('¿Por qué es importante?', 2),
      ContentContractUtils.createParagraph(
        'Este tema es esencial porque te proporciona las bases necesarias para entender conceptos más avanzados.'
      ),

      ContentContractUtils.createHeading('Características Principales', 2),
      ContentContractUtils.createList('bulleted', [
        'Proporciona una base sólida',
        'Facilita el aprendizaje avanzado',
        'Es aplicable en múltiples contextos',
        'Permite resolver problemas complejos',
      ]),

      ContentContractUtils.createHeading('Ejemplo Práctico', 2),
      ContentContractUtils.createParagraph(
        'Veamos cómo estos conceptos se aplican en situaciones reales:'
      ),
      ContentContractUtils.createCode(
        'python',
        `# Ejemplo básico
def ejemplo_fundamental():
    print("Este es un ejemplo práctico")
    return "resultado exitoso"

# Usar la función
resultado = ejemplo_fundamental()
print(resultado)`
      ),

      ContentContractUtils.createCallout(
        'tip',
        'Consejo Práctico',
        'Dedica tiempo suficiente a entender estos conceptos antes de continuar con temas más avanzados.'
      ),

      ContentContractUtils.createHeading('Puntos Clave', 2),
      ContentContractUtils.createList('numbered', [
        'Comprender los conceptos fundamentales',
        'Practicar con ejemplos reales',
        'Aplicar los conocimientos aprendidos',
        'Prepararse para el siguiente nivel',
      ]),

      ContentContractUtils.createHeading('Quiz del Módulo', 2),
      ContentContractUtils.createCallout(
        'info',
        'Evaluación',
        'Responde las siguientes preguntas para evaluar tu comprensión del módulo.'
      ),
      ContentContractUtils.createTable(
        ['Pregunta', 'Opciones', 'Respuesta Correcta'],
        [
          [
            '¿Cuál es el objetivo principal?',
            'A) Aprender conceptos avanzados\nB) Comprender fundamentos\nC) Completar proyectos\nD) Dominar técnicas',
            'B',
          ],
          [
            '¿Por qué son importantes los fundamentos?',
            'A) Son fáciles\nB) Proporcionan base sólida\nC) Son opcionales\nD) Son teóricos',
            'B',
          ],
        ]
      ),

      ContentContractUtils.createParagraph(
        'Has completado exitosamente este módulo y estás preparado para continuar con el siguiente nivel.'
      ),
    ];

    return blocks;
  }

  /**
   * Generate prerequisites based on level
   */
  private generatePrerequisites(level: string): string[] {
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return ['Motivación para aprender', 'Disposición para practicar'];
      case 'intermediate':
      case 'intermedio':
        return [
          'Conocimientos básicos del tema',
          'Experiencia previa recomendada',
        ];
      case 'advanced':
      case 'avanzado':
        return [
          'Conocimientos sólidos del tema',
          'Experiencia práctica previa',
        ];
      default:
        return ['Motivación para aprender'];
    }
  }

  /**
   * Generate module list
   */
  private generateModuleList(courseTitle: string): string[] {
    const lowerTitle = courseTitle.toLowerCase();

    if (lowerTitle.includes('python')) {
      return [
        'Introducción a Python',
        'Variables y Estructuras de Datos',
        'Funciones y Módulos',
        'Programación Orientada a Objetos',
        'Proyecto Final',
      ];
    }

    if (lowerTitle.includes('javascript')) {
      return [
        'Introducción a JavaScript',
        'Sintaxis y Funciones',
        'DOM y Eventos',
        'Programación Asíncrona',
        'Proyecto Final',
      ];
    }

    return [
      'Introducción y Conceptos Fundamentales',
      'Fundamentos y Principios Básicos',
      'Aplicaciones Prácticas',
      'Conceptos Avanzados',
      'Proyecto Final y Consolidación',
    ];
  }
}

// Export singleton instance
export const fallbackAI = new FallbackAI();
