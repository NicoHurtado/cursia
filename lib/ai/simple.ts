import { generateCourseMetadata, generateModuleContent } from './anthropic';
import { fallbackAI } from './fallback';
import {
  ContentDocument,
  ContentContractValidator,
} from '@/lib/content-contract';
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
      // Debug log raw AI metadata
      try {
        console.log(
          '📝 [AI][Metadata] Raw response length:',
          metadataJson.length
        );
        console.log(
          '📝 [AI][Metadata] Raw response preview:',
          metadataJson.substring(0, 300) + '...'
        );
      } catch (_) {}

      // First try as ContentDocument
      try {
        const contractStr = this.cleanJsonString(metadataJson);
        const doc: ContentDocument = JSON.parse(contractStr);
        const validation = ContentContractValidator.validateDocument(doc);
        if (!validation.isValid) {
          throw new Error(
            'Contract validation failed: ' + validation.errors.join('; ')
          );
        }
        console.log(
          '✅ [AI][Metadata] Detected ContentDocument. Blocks:',
          doc.blocks?.length || 0
        );
        const metadata = this.convertContractToCourseMetadata(doc);

        this.setCache(cacheKey, metadata);
        return metadata;
      } catch (e) {
        // Legacy path
        const cleanedJson = this.cleanJsonString(metadataJson);
        const metadata = this.parseJsonWithFallback(
          cleanedJson,
          CourseMetadataSchema
        );

        this.setCache(cacheKey, metadata);
        return metadata;
      }
    } catch (error) {
      console.error(
        '❌ Course metadata generation failed with Anthropic, using fallback:',
        error
      );
      // Use fallback AI when Anthropic fails
      const fallbackJson = await fallbackAI.generateCourseMetadata(
        prompt,
        level,
        interests
      );
      const fallbackMetadata = this.parseJsonWithFallback(
        fallbackJson,
        CourseMetadataSchema
      );
      this.setCache(cacheKey, fallbackMetadata);
      return fallbackMetadata;
    }
  }

  // Module Content Generation
  public async generateModuleContent(
    courseTitle: string,
    moduleTitle: string,
    moduleOrder: number,
    totalModules: number,
    courseDescription: string,
    previousModules?: Array<{
      title: string;
      topics: string[];
      description: string;
    }>,
    courseOutline?: string[]
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
        courseDescription,
        previousModules,
        courseOutline
      );

      // Debug: Log raw AI response
      console.log('📝 Raw AI response length:', moduleJson.length);
      console.log(
        '📝 Raw AI response preview:',
        moduleJson.substring(0, 200) + '...'
      );

      // First attempt: parse as ContentContract and convert deterministically
      try {
        const contractStr = this.cleanJsonString(moduleJson);
        const doc: ContentDocument = JSON.parse(contractStr);
        const validation = ContentContractValidator.validateDocument(doc);
        if (!validation.isValid) {
          throw new Error(
            'Contract validation failed: ' + validation.errors.join('; ')
          );
        }
        const moduleContent = this.convertContractToModuleContent(
          doc,
          moduleTitle
        );
        console.log('✅ Converted ContentDocument to ModuleContent');

        // No further post-processing needed when using contract blocks
        // Cache and return early
        this.setCache(cacheKey, moduleContent);
        return moduleContent;
      } catch (error) {
        console.warn(
          'Contract path failed, trying legacy ModuleContent parsing:',
          error
        );

        // Legacy path: parse as ModuleContent JSON and normalize markdown
        const cleanedJson = this.cleanJsonString(moduleJson);
        const rawContent = this.parseJsonWithFallback(
          cleanedJson,
          ModuleContentSchema,
          moduleTitle
        );

        // Post-process the raw content
        const processedContent = this.postProcessModuleContent(rawContent);

        // Ensure we have a proper quiz structure
        if (!processedContent.quiz) {
          processedContent.quiz = {
            title: `Quiz: ${moduleTitle}`,
            questions: [],
          };
        }

        if (
          !processedContent.quiz.questions ||
          processedContent.quiz.questions.length < 5
        ) {
          console.warn(
            `Only ${processedContent.quiz.questions?.length || 0} questions generated, adding fallback questions`
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

          const currentQuestions = processedContent.quiz.questions || [];
          const neededQuestions = Math.max(0, 5 - currentQuestions.length);
          processedContent.quiz.questions = [
            ...currentQuestions,
            ...fallbackQuestions.slice(0, neededQuestions),
          ];
        }

        // Try parsing again
        const moduleContent = ModuleContentSchema.parse(processedContent);

        // Cache the result and return
        this.setCache(cacheKey, moduleContent);
        return moduleContent;
      }
    } catch (error) {
      console.error(
        '❌ Module content generation failed with Anthropic, using fallback:',
        error
      );
      // Use fallback AI when Anthropic fails
      const fallbackJson = await fallbackAI.generateModuleContent(
        courseTitle,
        moduleTitle,
        moduleOrder,
        totalModules,
        courseDescription,
        previousModules,
        courseOutline
      );
      const fallbackContent = this.parseJsonWithFallback(
        fallbackJson,
        ModuleContentSchema,
        moduleTitle
      );
      this.setCache(cacheKey, fallbackContent);
      return fallbackContent;
    }
  }

  // Convert a ContentDocument (blocks) into CourseMetadata structure
  private convertContractToCourseMetadata(doc: ContentDocument): any {
    const blocks = doc.blocks || [];

    // Find the course description paragraph (after "Información del Curso" heading)
    let description = doc.meta.topic; // fallback to topic

    // Look for the paragraph that comes after "Información del Curso" heading
    for (let i = 0; i < blocks.length - 1; i++) {
      const currentBlock = blocks[i];
      const nextBlock = blocks[i + 1];

      if (
        currentBlock.type === 'heading' &&
        (currentBlock.data as any)?.text === 'Información del Curso' &&
        nextBlock.type === 'paragraph'
      ) {
        description = (nextBlock.data as any)?.text || doc.meta.topic;
        break;
      }
    }

    // If not found, use the first paragraph as fallback
    if (description === doc.meta.topic) {
      const paragraphs = blocks.filter(b => b.type === 'paragraph') as any[];
      description = paragraphs[0]?.data?.text || doc.meta.topic;
    }

    const finalDescription = description.slice(0, 500);

    // Extract module list from numbered lists
    const moduleList: string[] = [];
    const lists = blocks.filter(
      b => b.type === 'list' && (b.data as any)?.style === 'numbered'
    ) as any[];
    if (lists.length > 0) {
      const listItems = (lists[0].data as any)?.items || [];
      moduleList.push(...listItems);
    }

    return {
      title: doc.meta.topic,
      description: finalDescription,
      moduleList,
    };
  }

  // Convert a ContentDocument (blocks) into ModuleContent structure
  private convertContractToModuleContent(
    doc: ContentDocument,
    moduleTitle: string
  ): any {
    // Minimal deterministic conversion:
    // - title/description from meta + first paragraph
    // - chunks: split blocks roughly into 6 groups
    const blocks = doc.blocks || [];
    const paragraphs = blocks.filter(b => b.type === 'paragraph') as any[];
    const firstParagraph = paragraphs[0]?.data?.text || moduleTitle;

    const description = firstParagraph.slice(0, 500);

    // Build 6 chunks evenly (store ContentDocument JSON per chunk to render perfectly)
    const chunks: { title: string; content: string }[] = [];
    const groupSize = Math.max(1, Math.ceil(blocks.length / 6));
    for (let i = 0; i < 6; i++) {
      const start = i * groupSize;
      const group = blocks.slice(start, start + groupSize);
      if (group.length === 0 && chunks.length > 0) {
        // duplicate last if not enough content
        chunks.push({
          title: `${moduleTitle} - Sección ${i + 1}`,
          content: chunks[chunks.length - 1].content,
        });
        continue;
      }
      // Title from first heading in group (prefer level 2/3)
      const heading =
        group.find(
          (b: any) =>
            b.type === 'heading' &&
            b.data &&
            (b.data as any).level &&
            ((b.data as any).level === 2 || (b.data as any).level === 3)
        ) || group.find((b: any) => b.type === 'heading');
      const chunkTitle =
        heading && (heading as any).data && (heading as any).data.text
          ? String((heading as any).data.text).trim()
          : `${moduleTitle} - Sección ${i + 1}`;

      // Create a mini ContentDocument per chunk
      const chunkDoc: ContentDocument = {
        version: '1.0.0',
        locale: 'es',
        content_id: `chunk-${Date.now()}-${Math.random()}`,
        meta: { ...doc.meta },
        blocks: group,
      };
      chunks.push({ title: chunkTitle, content: JSON.stringify(chunkDoc) });
    }

    // Convert quiz from ContentDocument if available
    let quiz;
    if (doc.quiz && doc.quiz.questions && doc.quiz.questions.length > 0) {
      // Use quiz from ContentDocument
      quiz = {
        title: doc.quiz.title,
        questions: doc.quiz.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };
    } else {
      // Fallback quiz if not provided
      quiz = {
        title: `Quiz: ${moduleTitle}`,
        questions: new Array(7).fill(0).map((_, idx) => ({
          question: `Pregunta ${idx + 1} sobre ${moduleTitle}`,
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correctAnswer: 0,
          explanation: undefined,
        })),
      };
    }

    return {
      title: moduleTitle,
      description,
      chunks,
      quiz,
      total_chunks: 6,
    };
  }

  // Deterministic block→markdown mapping used for legacy compatibility
  private blocksToMarkdown(blocks: any[]): string {
    const lines: string[] = [];
    for (const b of blocks) {
      switch (b.type) {
        case 'heading': {
          const level = Math.min(3, Math.max(1, b.data?.level || 2));
          lines.push(`${'#'.repeat(level)} ${b.data?.text || ''}`);
          lines.push('');
          break;
        }
        case 'paragraph':
          lines.push(b.data?.text || '');
          lines.push('');
          break;
        case 'list': {
          const style = b.data?.style;
          const items: string[] = b.data?.items || [];
          for (let i = 0; i < items.length; i++) {
            lines.push(
              style === 'numbered' ? `${i + 1}. ${items[i]}` : `- ${items[i]}`
            );
          }
          lines.push('');
          break;
        }
        case 'table': {
          const headers: string[] = b.data?.headers || [];
          const rows: string[][] = b.data?.rows || [];
          if (headers.length) {
            lines.push(`| ${headers.join(' | ')} |`);
            lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
            for (const row of rows) {
              lines.push(`| ${row.join(' | ')} |`);
            }
            lines.push('');
          }
          break;
        }
        case 'code': {
          const lang = b.data?.language || 'text';
          lines.push('```' + lang);
          lines.push(b.data?.snippet || '');
          lines.push('```');
          lines.push('');
          break;
        }
        case 'callout': {
          const type = b.data?.type || 'info';
          const title = b.data?.title || '';
          const content = b.data?.content || '';
          lines.push(`> ${type.toUpperCase()}: ${title}`);
          lines.push(`> ${content}`);
          lines.push('');
          break;
        }
        case 'quote': {
          const text = b.data?.text || '';
          lines.push(`> ${text}`);
          lines.push('');
          break;
        }
        case 'divider':
          lines.push('');
          lines.push('---');
          lines.push('');
          break;
        case 'link': {
          const text = b.data?.text || 'link';
          const url = b.data?.url || '#';
          lines.push(`[${text}](${url})`);
          lines.push('');
          break;
        }
        case 'highlight':
          lines.push(`**${b.data?.text || ''}**`);
          lines.push('');
          break;
        default:
          break;
      }
    }
    return this.normalizeMarkdownLegacy(lines.join('\n'));
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

      // Extract JSON between explicit markers if present
      const startMarker = '<<<JSON>>>';
      const endMarker = '<<<END>>>';
      const startIdx = cleaned.indexOf(startMarker);
      const endIdx = cleaned.indexOf(endMarker);
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned
          .substring(startIdx + startMarker.length, endIdx)
          .trim();
      }

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
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`Strategy ${i + 1} failed:`, errorMessage);
        if (i === strategies.length - 1) {
          throw new Error(
            `All JSON parsing strategies failed. Last error: ${errorMessage}`
          );
        }
      }
    }

    throw new Error('All parsing strategies failed');
  }

  // Post-process module content to ensure proper markdown structure
  private postProcessModuleContent(content: any): any {
    if (!content || !content.chunks) {
      return content;
    }

    console.log('🔧 Processing', content.chunks.length, 'chunks...');

    // Process each chunk to ensure proper markdown structure
    content.chunks = content.chunks.map((chunk: any, index: number) => {
      if (chunk.content) {
        console.log(`📝 Processing chunk ${index + 1}: "${chunk.title}"`);
        const originalContent = chunk.content;
        chunk.content = this.normalizeMarkdownContent(chunk.content);

        // Validate chunk structure
        this.validateChunkStructure(chunk, index + 1);
      }
      return chunk;
    });

    console.log('✅ All chunks processed successfully');
    return content;
  }

  // Validate chunk structure to ensure proper organization
  private validateChunkStructure(chunk: any, chunkNumber: number): void {
    const content = chunk.content;
    const issues: string[] = [];

    // Check for main heading (##)
    if (!content.includes('##')) {
      issues.push('Missing main heading (##)');
    }

    // Check for subheadings (###)
    const subheadings = (content.match(/###/g) || []).length;
    if (subheadings < 2) {
      issues.push(`Only ${subheadings} subheadings found (recommended: 3-4)`);
    }

    // Check for lists
    const lists = (content.match(/^[-*+]\s/gm) || []).length;
    if (lists < 3) {
      issues.push(`Only ${lists} list items found (recommended: 5+)`);
    }

    // Check for paragraphs
    const paragraphs = content
      .split('\n\n')
      .filter(
        (p: string) =>
          p.trim() &&
          !p.match(/^#{1,6}\s/) &&
          !p.match(/^[-*+]\s/) &&
          !p.match(/^>\s/)
      ).length;
    if (paragraphs < 3) {
      issues.push(`Only ${paragraphs} paragraphs found (recommended: 5+)`);
    }

    // Check for blockquotes
    const blockquotes = (content.match(/^>\s/gm) || []).length;
    if (blockquotes === 0) {
      issues.push('No blockquotes found (recommended: 1-2 for tips)');
    }

    if (issues.length > 0) {
      console.warn(`⚠️ Chunk ${chunkNumber} structure issues:`, issues);
    } else {
      console.log(`✅ Chunk ${chunkNumber} structure looks good`);
    }
  }

  // Enhanced content processing with tagged content support
  private normalizeMarkdownContent(raw: string): string {
    if (!raw) return '';

    console.log('🔍 Processing content...');
    console.log('📏 Original length:', raw.length);

    // Check if content uses the new tagging system
    const hasTags = /^\[[A-Z_]+\]\s/.test(raw);

    if (hasTags) {
      console.log('🏷️ Detected tagged content, using new parser...');

      // Import ContentParser dynamically to avoid circular dependencies
      const { ContentParser } = require('@/lib/content-parser');

      // Parse tagged content
      const elements = ContentParser.parseTaggedContent(raw);
      console.log('📊 Parsed elements:', elements.length);

      // Convert to markdown
      const markdown = ContentParser.convertToMarkdown(elements);
      console.log('✅ Converted to markdown');

      return markdown;
    } else {
      console.log('📝 Using legacy normalization...');
      return this.normalizeMarkdownLegacy(raw);
    }
  }

  // Legacy markdown normalization (fallback)
  private normalizeMarkdownLegacy(raw: string): string {
    if (!raw) return '';

    console.log('🔍 Normalizing markdown content (legacy)...');
    console.log('📏 Original length:', raw.length);

    let text = raw.replace(/\r\n/g, '\n');

    // Step 1: Fix common AI concatenation issues
    text = text
      // Fix common concatenations like "ProgramaciónAsí" -> "Programación\n\nAsí"
      .replace(/([a-záéíóúñ0-9\)])([A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2')
      // Fix concatenations with common words
      .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/g, '$1\n\n$2')
      // Fix concatenations with numbers
      .replace(/([a-záéíóúñ])(\d+)/g, '$1\n\n$2')
      .replace(/(\d+)([A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2');

    // Step 2: Ensure proper heading structure
    text = text
      // Ensure headings start on their own line
      .replace(/(?<!^|\n)(#{1,6}\s)/g, '\n\n$1')
      .replace(/\s*(#{1,6}\s)/g, '\n$1')
      // Fix headings that might be concatenated
      .replace(/(#{1,6})\s*([A-ZÁÉÍÓÚÑ][^#\n]*?)(#{1,6})/g, '$1 $2\n\n$3');

    // Step 3: Fix list structures
    text = text
      // Fix unordered lists
      .replace(/(?<!\n)-\s/g, '\n- ')
      .replace(/:\s*-\s/g, ':\n- ')
      // Fix ordered lists
      .replace(/(?<!\n)(\d+)\.\s/g, '\n$1. ')
      // Fix nested lists
      .replace(/(\n- [^\n]+)\n([A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2');

    // Step 4: Fix blockquotes
    text = text
      .replace(/(?<!\n)>\s/g, '\n> ')
      .replace(/([^\n])\n(>\s)/g, '$1\n\n$2');

    // Step 5: Fix code blocks
    text = text
      .replace(/(?<!\n)```/g, '\n```')
      .replace(/```(?<!\n)/g, '```\n')
      // Ensure code blocks have proper spacing
      .replace(/([^\n])\n(```)/g, '$1\n\n$2')
      .replace(/(```[^\n]*\n[^`]*```)([^\n])/g, '$1\n\n$2');

    // Step 6: Fix tables
    text = text
      .replace(/(?<!\n)\|/g, '\n|')
      .replace(/([^\n])\n(\|)/g, '$1\n\n$2');

    // Step 7: Fix paragraph breaks
    text = text
      // Ensure paragraphs are separated
      .replace(/([.!?])\s*([A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2')
      // Fix sentences that should be separate paragraphs
      .replace(/([.!?])\s+([A-ZÁÉÍÓÚÑ][^.!?]*[.!?])/g, '$1\n\n$2');

    // Step 8: Clean up excessive whitespace
    text = text
      // Collapse multiple newlines to maximum of 2
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace from lines
      .replace(/^\s+|\s+$/gm, '')
      // Remove empty lines at start/end
      .replace(/^\n+|\n+$/g, '');

    // Step 9: Final structure validation
    text = text
      // Ensure proper spacing around headings
      .replace(/(\n#{1,6}[^\n]+)\n([^#\n])/g, '$1\n\n$2')
      // Ensure proper spacing around lists
      .replace(/(\n[-*+]\s[^\n]+)\n([^-\n*+\n])/g, '$1\n\n$2')
      // Ensure proper spacing around code blocks
      .replace(/(\n```[^\n]*\n[^`]*```)\n([^`\n])/g, '$1\n\n$2');

    const result = text.trim();
    console.log('📏 Normalized length:', result.length);
    console.log('📊 Headings found:', (result.match(/#{1,6}\s/g) || []).length);
    console.log('📋 Lists found:', (result.match(/^[-*+]\s/gm) || []).length);
    console.log('💬 Blockquotes found:', (result.match(/^>\s/gm) || []).length);
    console.log(
      '💻 Code blocks found:',
      (result.match(/```/g) || []).length / 2
    );

    return result;
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
