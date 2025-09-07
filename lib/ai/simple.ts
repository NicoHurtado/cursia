import { generateCourseMetadata, generateModuleContent } from './anthropic';
import { CourseMetadataSchema, ModuleContentSchema } from '@/lib/dto/course';

/**
 * Simple AI System - No Redis, Direct Calls Only
 * Perfect for development and small-scale production
 */

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Simple rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 requests per minute per user

export class SimpleAI {
  // Course Metadata Generation
  public async generateCourseMetadata(
    prompt: string,
    level: string,
    interests: string[]
  ): Promise<any> {
    const cacheKey = `course-metadata:${JSON.stringify({ prompt, level, interests })}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached course metadata');
      return cached;
    }

    console.log('🚀 Generating course metadata...');

    try {
      const metadataJson = await generateCourseMetadata(
        prompt,
        level,
        interests
      );
      // Clean the JSON string to remove control characters
      const cleanedJson = this.cleanJsonString(metadataJson);
      const metadata = this.parseJsonWithFallback(
        cleanedJson,
        CourseMetadataSchema
      );

      // Cache the result
      this.setCache(cacheKey, metadata);

      return metadata;
    } catch (error) {
      console.error('Course metadata generation failed:', error);
      throw new Error(`Failed to generate course metadata: ${error}`);
    }
  }

  // Module Content Generation
  public async generateModuleContent(
    courseTitle: string,
    moduleTitle: string,
    moduleOrder: number,
    totalModules: number,
    courseDescription: string
  ): Promise<any> {
    const cacheKey = `module-content:${JSON.stringify({
      courseTitle,
      moduleTitle,
      moduleOrder,
      totalModules,
      courseDescription,
    })}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached module content');
      return cached;
    }

    console.log(`🚀 Generating module content: ${moduleTitle}...`);

    try {
      const moduleJson = await generateModuleContent(
        courseTitle,
        moduleTitle,
        moduleOrder,
        totalModules,
        courseDescription
      );

      // Clean the JSON string to remove control characters
      const cleanedJson = this.cleanJsonString(moduleJson);

      let moduleContent;
      try {
        moduleContent = this.parseJsonWithFallback(
          cleanedJson,
          ModuleContentSchema,
          moduleTitle
        );
      } catch (error) {
        console.warn('Schema validation failed, attempting to fix:', error);

        // Try to fix the module content with fallback parsing
        const rawContent = this.parseJsonWithFallback(
          cleanedJson,
          null,
          moduleTitle
        );

        // Ensure we have a proper quiz structure
        if (!rawContent.quiz) {
          rawContent.quiz = {
            title: `Quiz: ${moduleTitle}`,
            questions: [],
          };
        }

        if (
          !rawContent.quiz.questions ||
          rawContent.quiz.questions.length < 5
        ) {
          console.warn(
            `Only ${rawContent.quiz.questions?.length || 0} questions generated, adding fallback questions`
          );

          // Add high-quality fallback questions
          const fallbackQuestions = [
            {
              question: `¿Cuál es el concepto más importante que se enseña en "${moduleTitle}"?`,
              options: [
                'Un concepto fundamental del tema',
                'Una técnica avanzada',
                'Una herramienta auxiliar',
                'Un concepto opcional',
              ],
              correctAnswer: 0,
              explanation:
                'Este módulo se enfoca en enseñar los conceptos fundamentales que son la base para el aprendizaje posterior.',
            },
            {
              question: `¿Qué tipo de práctica es más efectiva para dominar "${moduleTitle}"?`,
              options: [
                'Ejercicios prácticos y proyectos',
                'Solo lectura teórica',
                'Memorización de conceptos',
                'Ver videos pasivamente',
              ],
              correctAnswer: 0,
              explanation:
                'La práctica activa con ejercicios y proyectos es la forma más efectiva de consolidar el aprendizaje.',
            },
            {
              question: `¿Cuál es el siguiente paso lógico después de completar este módulo?`,
              options: [
                'Aplicar los conceptos en un proyecto',
                'Repetir el mismo contenido',
                'Saltar al siguiente tema sin práctica',
                'Olvidar lo aprendido',
              ],
              correctAnswer: 0,
              explanation:
                'La aplicación práctica de los conceptos aprendidos es crucial para el aprendizaje efectivo.',
            },
            {
              question: `¿Qué característica hace que este módulo sea educativo?`,
              options: [
                'Explicaciones claras y ejemplos prácticos',
                'Contenido superficial',
                'Información desactualizada',
                'Falta de estructura',
              ],
              correctAnswer: 0,
              explanation:
                'Un módulo educativo efectivo combina explicaciones claras con ejemplos prácticos aplicables.',
            },
            {
              question: `¿Cómo se puede verificar que se ha comprendido el contenido de "${moduleTitle}"?`,
              options: [
                'Completando ejercicios y explicando conceptos',
                'Memorizando definiciones',
                'Copiando código sin entender',
                'Saltando las prácticas',
              ],
              correctAnswer: 0,
              explanation:
                'La verdadera comprensión se demuestra aplicando los conceptos y explicándolos con tus propias palabras.',
            },
          ];

          const currentQuestions = rawContent.quiz.questions || [];
          const neededQuestions = Math.max(0, 5 - currentQuestions.length);
          rawContent.quiz.questions = [
            ...currentQuestions,
            ...fallbackQuestions.slice(0, neededQuestions),
          ];
        }

        // Try parsing again
        moduleContent = ModuleContentSchema.parse(rawContent);
      }

      // Cache the result
      this.setCache(cacheKey, moduleContent);

      return moduleContent;
    } catch (error) {
      console.error('Module content generation failed:', error);
      throw new Error(`Failed to generate module content: ${error}`);
    }
  }

  // Rate Limiting
  public checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimit.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (userLimit.count >= RATE_LIMIT_MAX) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  public getRateLimitInfo(userId: string): {
    remaining: number;
    resetTime: number;
    limit: number;
  } {
    const userLimit = rateLimit.get(userId);
    const now = Date.now();

    if (!userLimit || now > userLimit.resetTime) {
      return {
        remaining: RATE_LIMIT_MAX,
        resetTime: now + RATE_LIMIT_WINDOW,
        limit: RATE_LIMIT_MAX,
      };
    }

    return {
      remaining: Math.max(0, RATE_LIMIT_MAX - userLimit.count),
      resetTime: userLimit.resetTime,
      limit: RATE_LIMIT_MAX,
    };
  }

  // Cache Management
  private getFromCache(key: string): any | null {
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    cache.set(key, {
      data,
      expires: Date.now() + CACHE_TTL,
    });
  }

  // JSON Cleaning
  private cleanJsonString(jsonString: string): string {
    try {
      // Remove any leading/trailing whitespace
      let cleaned = jsonString.trim();

      // Remove any markdown code blocks if present
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

      // Remove any text before the first { and after the last }
      const startIndex = cleaned.indexOf('{');
      const lastIndex = cleaned.lastIndexOf('}');

      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, lastIndex + 1);
      }

      // More aggressive cleaning for problematic characters
      cleaned = cleaned
        // Remove all control characters except those that are valid in JSON strings
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Fix common issues with backslashes
        .replace(/\\b/g, '') // Remove word boundaries
        .replace(/\\\b/g, '') // Remove escaped backspaces
        .replace(/\b/g, '') // Remove any remaining word boundaries
        // Fix line endings
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n')
        // Fix other whitespace
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/\v/g, '\\v');

      // Try to fix common JSON issues
      cleaned = this.fixCommonJsonIssues(cleaned);

      return cleaned;
    } catch (error) {
      console.warn('Error cleaning JSON string:', error);
      return jsonString; // Return original if cleaning fails
    }
  }

  // Fix common JSON formatting issues
  private fixCommonJsonIssues(jsonString: string): string {
    try {
      // Fix trailing commas
      let fixed = jsonString.replace(/,(\s*[}\]])/g, '$1');

      // Fix unescaped quotes in strings (basic attempt)
      fixed = fixed.replace(
        /([^\\])"([^"]*)"([^\\])/g,
        (match, before, content, after) => {
          // Only fix if it looks like an unescaped quote in a string value
          if (before === ':' || before === '[' || before === ',') {
            return `${before}"${content.replace(/"/g, '\\"')}"${after}`;
          }
          return match;
        }
      );

      // Ensure proper escaping of backslashes
      fixed = fixed.replace(/\\(?!["\\/bfnrt])/g, '\\\\');

      return fixed;
    } catch (error) {
      console.warn('Error fixing JSON issues:', error);
      return jsonString;
    }
  }

  // Fix unterminated strings in JSON
  private fixUnterminatedStrings(jsonString: string): string {
    try {
      let fixed = jsonString;

      // Find unterminated strings and try to close them
      // Look for patterns like: "content without closing quote
      const unterminatedStringRegex = /"([^"]*?)(?=\s*[,}\]])/g;
      fixed = fixed.replace(unterminatedStringRegex, (match, content) => {
        // If the content doesn't end with a quote, add one
        if (!content.endsWith('"')) {
          return `"${content.replace(/"/g, '\\"')}"`;
        }
        return match;
      });

      // Fix strings that might have been broken by newlines
      const brokenStringRegex = /"([^"]*?)\n([^"]*?)"/g;
      fixed = fixed.replace(brokenStringRegex, (match, part1, part2) => {
        return `"${part1}\\n${part2}"`;
      });

      // Fix strings that end abruptly without quotes
      const abruptEndRegex = /"([^"]*?)(?=\s*[,}\]])/g;
      fixed = fixed.replace(abruptEndRegex, (match, content) => {
        // If we're at the end of a string value, make sure it's properly closed
        if (content && !content.endsWith('"')) {
          return `"${content.replace(/"/g, '\\"')}"`;
        }
        return match;
      });

      return fixed;
    } catch (error) {
      console.warn('Error fixing unterminated strings:', error);
      return jsonString;
    }
  }

  // Fix property names without quotes
  private fixPropertyNames(jsonString: string): string {
    try {
      let fixed = jsonString;

      // Fix property names without quotes (e.g., title: "value" -> "title": "value")
      const unquotedPropertyRegex = /(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g;
      fixed = fixed.replace(unquotedPropertyRegex, '$1"$2":');

      return fixed;
    } catch (error) {
      console.warn('Error fixing property names:', error);
      return jsonString;
    }
  }

  // Generate fallback content when all parsing strategies fail
  private generateFallbackContent(moduleTitle: string): any {
    console.log('Generating fallback content for module:', moduleTitle);

    return {
      title: moduleTitle,
      description: `Este módulo te introduce a los conceptos fundamentales de ${moduleTitle}. Aprenderás no solo qué son estos conceptos, sino por qué son importantes y cómo se aplican en situaciones reales.`,
      chunks: [
        {
          title: '¿Por qué es importante este tema?',
          content: `## ¿Por qué necesitas aprender ${moduleTitle}?

### El problema que resuelve

Imagina que quieres construir una casa. Antes de empezar a colocar ladrillos, necesitas entender conceptos básicos como qué es una base sólida, cómo funciona la gravedad, y por qué algunos materiales son mejores que otros.

De la misma manera, **${moduleTitle}** son los conceptos fundamentales que necesitas entender antes de poder crear programas más complejos. Sin estos conocimientos básicos, es como intentar construir una casa sin entender cómo funciona la gravedad.

### ¿Qué aprenderás realmente?

En este módulo no solo memorizarás definiciones. Aprenderás:

- **El "por qué"** detrás de cada concepto
- **Cómo se relaciona** con lo que ya sabes
- **Cuándo y dónde** lo usarás en proyectos reales
- **Qué problemas** te ayudará a resolver

### Una analogía simple

Piensa en ${moduleTitle} como el alfabeto de un idioma. Antes de poder escribir poesía, necesitas conocer las letras. Antes de poder crear aplicaciones complejas, necesitas dominar estos conceptos fundamentales.

> **Reflexión**: ¿Qué tipo de proyectos te gustaría crear algún día? Estos conceptos básicos son el primer paso hacia ese objetivo.`,
        },
        {
          title: 'Los conceptos fundamentales',
          content: `## Entendiendo los conceptos básicos

### ¿Qué son realmente estos conceptos?

Ahora que entiendes por qué son importantes, vamos a explorar qué son exactamente estos conceptos fundamentales. Pero no te preocupes, no vamos a usar jerga técnica complicada.

### Una explicación simple

Piensa en ${moduleTitle} como las reglas básicas de un juego. Antes de poder jugar fútbol, necesitas entender que:
- El objetivo es meter el balón en la portería
- No puedes usar las manos (excepto el portero)
- Hay límites en el campo

De la misma manera, estos conceptos son las "reglas básicas" que necesitas entender antes de poder crear programas.

### ¿Por qué es importante entender esto?

Sin entender estos conceptos fundamentales, es como intentar:
- Cocinar sin saber qué es el fuego
- Conducir sin saber qué es un volante
- Leer sin saber qué son las letras

### Conceptos clave que aprenderás

1. **La base**: Los conceptos más simples pero más importantes
2. **La conexión**: Cómo se relacionan entre sí
3. **La aplicación**: Cuándo y cómo usarlos
4. **La práctica**: Ejercicios para consolidar tu comprensión

> **Pregunta para reflexionar**: ¿Has aprendido alguna habilidad nueva recientemente? ¿Recuerdas cómo empezaste con los conceptos más básicos?`,
        },
        {
          title: 'Cómo se aplican en la vida real',
          content: `## Aplicaciones en el mundo real

### ¿Dónde verás estos conceptos?

Ahora que entiendes qué son estos conceptos, es importante ver cómo se usan en situaciones reales. Esto te ayudará a entender por qué son tan importantes.

### Ejemplos del mundo real

**En aplicaciones web**: Cuando visitas una página web, estos conceptos están trabajando detrás de escena para mostrarte el contenido correcto.

**En aplicaciones móviles**: Cuando usas tu teléfono, estos conceptos ayudan a que la aplicación funcione de manera fluida.

**En videojuegos**: Los juegos que te gustan usan estos conceptos para crear experiencias interactivas.

**En automatización**: Muchas tareas repetitivas se pueden automatizar usando estos conceptos.

### ¿Por qué es importante entender esto?

Cuando entiendes cómo se aplican estos conceptos en el mundo real, puedes:
- **Imaginar posibilidades**: Ver qué tipo de proyectos podrías crear
- **Entender mejor**: Comprender cómo funcionan las aplicaciones que usas
- **Resolver problemas**: Aplicar estos conceptos a situaciones nuevas

### Tu futuro con estos conceptos

Una vez que domines estos conceptos fundamentales, podrás:
- Crear tus propias aplicaciones
- Automatizar tareas repetitivas
- Entender mejor la tecnología que te rodea
- Abrirte puertas a nuevas oportunidades

> **Reflexión**: ¿Qué tipo de aplicación te gustaría crear? ¿Cómo crees que estos conceptos te ayudarían a lograrlo?`,
        },
        {
          title: 'Errores comunes y cómo evitarlos',
          content: `## Errores comunes y cómo evitarlos

### ¿Qué son los errores en programación?

Los errores son como los tropiezos cuando aprendes a caminar. Son completamente normales y, de hecho, son una parte importante del proceso de aprendizaje. Cada error que cometes te enseña algo nuevo.

### Tipos de errores comunes

**Errores de concepto**: Cuando no entiendes completamente cómo funciona algo
- **Solución**: Volver a los conceptos básicos y practicar más

**Errores de atención**: Cuando escribes algo incorrectamente por descuido
- **Solución**: Revisar tu trabajo paso a paso

**Errores de lógica**: Cuando tu razonamiento no es correcto
- **Solución**: Pensar en el problema de manera diferente

### ¿Por qué es importante entender los errores?

1. **Son parte del aprendizaje**: Cada error te acerca más a la solución
2. **Te enseñan paciencia**: Aprender a programar requiere tiempo
3. **Desarrollan tu pensamiento crítico**: Te ayudan a analizar problemas
4. **Te preparan para el mundo real**: Los errores son inevitables en cualquier proyecto

### Cómo enfrentar los errores

- **No te desanimes**: Los errores son normales
- **Analiza el problema**: ¿Qué estaba tratando de hacer?
- **Busca patrones**: ¿Has visto este error antes?
- **Pide ayuda**: No hay nada malo en pedir ayuda cuando la necesitas
- **Practica más**: La práctica reduce la frecuencia de errores

> **Reflexión**: ¿Recuerdas algún error que hayas cometido al aprender algo nuevo? ¿Qué aprendiste de ese error?`,
        },
        {
          title: 'Cómo conectar con otros conceptos',
          content: `## Cómo conectar con otros conceptos

### El panorama completo

Ahora que entiendes estos conceptos fundamentales, es importante ver cómo se conectan con otros conceptos que aprenderás más adelante. Esto te ayudará a construir una comprensión más completa y sólida.

### Conexiones importantes

**Con conceptos básicos**: Estos conceptos son la base sobre la cual se construyen otros conceptos más avanzados.

**Con aplicaciones prácticas**: Una vez que domines estos conceptos, podrás aplicarlos en proyectos reales.

**Con mejores prácticas**: Estos conceptos te ayudarán a entender por qué ciertas prácticas son mejores que otras.

**Con resolución de problemas**: Cuando enfrentes problemas nuevos, estos conceptos te darán las herramientas para resolverlos.

### ¿Por qué es importante entender estas conexiones?

1. **Construye una base sólida**: Cada concepto nuevo se construye sobre los anteriores
2. **Facilita el aprendizaje**: Cuando entiendes las conexiones, es más fácil aprender conceptos nuevos
3. **Mejora tu comprensión**: Ves el panorama completo, no solo piezas aisladas
4. **Te prepara para el futuro**: Estás construyendo una base para conceptos más avanzados

### Tu progreso hasta ahora

Has aprendido:
- **Por qué** estos conceptos son importantes
- **Qué** son realmente estos conceptos
- **Cómo** se aplican en el mundo real
- **Dónde** verás estos conceptos en acción
- **Cómo** se conectan con otros conceptos

### Próximos pasos

Ahora que tienes una base sólida, estás listo para:
- Aplicar estos conceptos en ejercicios prácticos
- Conectar con conceptos más avanzados
- Crear tus primeros proyectos
- Continuar tu viaje de aprendizaje

> **Reflexión**: ¿Cómo crees que estos conceptos te ayudarán en los siguientes módulos? ¿Qué tipo de proyectos te gustaría crear usando estos conceptos?`,
        },
        {
          title: 'Resumen y consolidación',
          content: `## Resumen y consolidación

### Lo que has aprendido realmente

En este módulo has construido una base sólida de comprensión sobre **${moduleTitle}**. No solo has memorizado definiciones, sino que has entendido:

✅ **El "por qué"** detrás de cada concepto
✅ **Cómo se conectan** estos conceptos entre sí
✅ **Dónde los verás** en aplicaciones reales
✅ **Cómo enfrentar** los errores comunes
✅ **Cómo se relacionan** con otros conceptos

### Conceptos clave que debes recordar

1. **Los fundamentos son importantes**: Estos conceptos son la base de todo lo que aprenderás
2. **La comprensión es mejor que la memorización**: Entender el "por qué" es más valioso que recordar el "qué"
3. **Los errores son parte del aprendizaje**: No te desanimes cuando cometas errores
4. **La práctica consolida el conocimiento**: Aplicar estos conceptos te ayudará a recordarlos

### Tu progreso hasta ahora

Has completado un paso importante en tu viaje de aprendizaje. Ahora tienes:
- Una comprensión clara de por qué estos conceptos son importantes
- Una base sólida para construir conocimiento más avanzado
- Las herramientas para enfrentar errores y desafíos
- Una visión de cómo estos conceptos se aplican en el mundo real

### Próximos pasos recomendados

1. **Reflexiona sobre lo aprendido**: ¿Qué conceptos te quedaron más claros?
2. **Practica con ejercicios**: Aplica estos conceptos en situaciones simples
3. **Conecta con otros temas**: Ve cómo estos conceptos se relacionan con otros
4. **Continúa aprendiendo**: Estás listo para el siguiente módulo

### Ejercicio de reflexión

Antes de continuar, tómate un momento para reflexionar:

- ¿Qué concepto te resultó más interesante?
- ¿Hay algo que aún no entiendes completamente?
- ¿Cómo crees que estos conceptos te ayudarán en el futuro?
- ¿Qué tipo de proyectos te gustaría crear usando estos conceptos?

> **¡Felicidades!** Has completado este módulo y has construido una base sólida para continuar tu aprendizaje. Recuerda que el aprendizaje es un proceso, no un destino.`,
        },
      ],
      quiz: {
        title: `Quiz: ${moduleTitle}`,
        questions: [
          {
            question: `¿Cuál es el concepto más importante que se enseña en "${moduleTitle}"?`,
            options: [
              'Los fundamentos y principios básicos del tema',
              'Técnicas avanzadas y complejas',
              'Herramientas auxiliares y complementarias',
              'Conceptos opcionales y avanzados',
            ],
            correctAnswer: 0,
            explanation:
              'Este módulo se enfoca en enseñar los conceptos fundamentales que son la base para el aprendizaje posterior y la aplicación práctica.',
          },
          {
            question: `¿Qué tipo de práctica es más efectiva para dominar "${moduleTitle}"?`,
            options: [
              'Ejercicios prácticos y proyectos reales',
              'Solo lectura teórica y memorización',
              'Ver videos pasivamente sin interactuar',
              'Copiar código sin entender la lógica',
            ],
            correctAnswer: 0,
            explanation:
              'La práctica activa con ejercicios y proyectos es la forma más efectiva de consolidar el aprendizaje y desarrollar habilidades aplicables.',
          },
          {
            question: `¿Cuál es el siguiente paso lógico después de completar este módulo?`,
            options: [
              'Aplicar los conceptos en un proyecto personal',
              'Repetir exactamente el mismo contenido',
              'Saltar al siguiente tema sin práctica',
              'Olvidar lo aprendido y empezar de nuevo',
            ],
            correctAnswer: 0,
            explanation:
              'La aplicación práctica de los conceptos aprendidos es crucial para el aprendizaje efectivo y la retención a largo plazo.',
          },
          {
            question: `¿Qué característica hace que este módulo sea educativo?`,
            options: [
              'Explicaciones claras y ejemplos prácticos aplicables',
              'Contenido superficial y genérico',
              'Información desactualizada y obsoleta',
              'Falta de estructura y organización',
            ],
            correctAnswer: 0,
            explanation:
              'Un módulo educativo efectivo combina explicaciones claras con ejemplos prácticos que los estudiantes pueden aplicar en situaciones reales.',
          },
          {
            question: `¿Cómo se puede verificar que se ha comprendido el contenido de "${moduleTitle}"?`,
            options: [
              'Completando ejercicios y explicando conceptos con tus propias palabras',
              'Memorizando definiciones sin entender su aplicación',
              'Copiando código sin comprender la lógica',
              'Saltando las prácticas y ejercicios',
            ],
            correctAnswer: 0,
            explanation:
              'La verdadera comprensión se demuestra aplicando los conceptos en ejercicios prácticos y siendo capaz de explicarlos con tus propias palabras.',
          },
          {
            question: `¿Qué es más importante al aprender "${moduleTitle}"?`,
            options: [
              'Entender los principios fundamentales y su aplicación',
              'Memorizar sintaxis específica sin contexto',
              'Aprender solo las partes más avanzadas',
              'Enfocarse únicamente en la teoría',
            ],
            correctAnswer: 0,
            explanation:
              'Entender los principios fundamentales y cómo aplicarlos es más valioso que memorizar sintaxis específica, ya que permite adaptarse a diferentes situaciones.',
          },
          {
            question: `¿Cuál es la mejor estrategia para consolidar el aprendizaje de "${moduleTitle}"?`,
            options: [
              'Practicar regularmente con proyectos pequeños y progresivos',
              'Estudiar intensivamente solo una vez',
              'Evitar la práctica y solo leer teoría',
              'Saltar directamente a proyectos complejos',
            ],
            correctAnswer: 0,
            explanation:
              'La práctica regular con proyectos pequeños y progresivos es la mejor estrategia para consolidar el aprendizaje y desarrollar confianza gradualmente.',
          },
        ],
      },
      content1:
        'Contenido educativo completo sobre los fundamentos y conceptos básicos.',
      content2: 'Implementación práctica con ejemplos reales y casos de uso.',
      content3: 'Optimización, mejores prácticas y técnicas avanzadas.',
      content4:
        'Integración en proyectos reales y consideraciones de producción.',
      total_chunks: 6,
    };
  }

  // Parse JSON with multiple fallback strategies
  private parseJsonWithFallback(
    jsonString: string,
    schema: any = null,
    moduleTitle: string = 'Módulo'
  ): any {
    const strategies = [
      // Strategy 1: Direct parse
      () => JSON.parse(jsonString),

      // Strategy 2: Remove all backslashes and word boundaries
      () => JSON.parse(jsonString.replace(/\\b/g, '').replace(/\b/g, '')),

      // Strategy 3: More aggressive cleaning
      () => {
        const cleaned = jsonString
          .replace(/\\b/g, '')
          .replace(/\b/g, '')
          .replace(/\\\w/g, '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        return JSON.parse(cleaned);
      },

      // Strategy 4: Try to extract just the JSON object
      () => {
        const match = jsonString.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
        throw new Error('No JSON object found');
      },

      // Strategy 5: Fix unterminated strings
      () => {
        let fixed = jsonString
          .replace(/\\b/g, '')
          .replace(/\b/g, '')
          .replace(/\\\w/g, '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/\\(?!["\\/bfnrt])/g, '\\\\');

        // Try to fix unterminated strings by finding and closing them
        fixed = this.fixUnterminatedStrings(fixed);

        return JSON.parse(fixed);
      },

      // Strategy 6: Fix property names without quotes
      () => {
        let fixed = jsonString
          .replace(/\\b/g, '')
          .replace(/\b/g, '')
          .replace(/\\\w/g, '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/\\(?!["\\/bfnrt])/g, '\\\\');

        // Fix property names without quotes
        fixed = this.fixPropertyNames(fixed);

        // Fix unterminated strings
        fixed = this.fixUnterminatedStrings(fixed);

        return JSON.parse(fixed);
      },

      // Strategy 7: Last resort - try to extract and reconstruct JSON
      () => {
        // Try to extract the JSON object and fix it manually
        const match = jsonString.match(/\{[\s\S]*\}/);
        if (match) {
          let extracted = match[0];

          // Apply all cleaning strategies
          extracted = extracted
            .replace(/\\b/g, '')
            .replace(/\b/g, '')
            .replace(/\\\w/g, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/\\(?!["\\/bfnrt])/g, '\\\\');

          // Fix property names
          extracted = this.fixPropertyNames(extracted);

          // Fix unterminated strings
          extracted = this.fixUnterminatedStrings(extracted);

          return JSON.parse(extracted);
        }
        throw new Error('No JSON object found');
      },

      // Strategy 8: Ultimate fallback - generate valid content structure
      () => {
        console.log(
          'Using ultimate fallback strategy - generating valid content structure'
        );
        return this.generateFallbackContent(moduleTitle);
      },
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying JSON parsing strategy ${i + 1}...`);
        const result = strategies[i]();

        // If schema is provided, validate against it
        if (schema) {
          return schema.parse(result);
        }

        return result;
      } catch (error) {
        console.warn(`Strategy ${i + 1} failed:`, error.message);
        if (i === strategies.length - 1) {
          throw new Error(
            `All JSON parsing strategies failed. Last error: ${error.message}`
          );
        }
      }
    }

    throw new Error('All parsing strategies failed');
  }

  // Cleanup
  public clearCache(): void {
    cache.clear();
  }

  public clearRateLimit(): void {
    rateLimit.clear();
  }
}

// Export singleton instance
export const simpleAI = new SimpleAI();
