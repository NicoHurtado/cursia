/**
 * CONTRATO DE CONTENIDO - CURSIA
 *
 * Fuente única de verdad para el contenido educativo.
 * Garantiza determinismo: "si es H1 se vea como H1"
 *
 * Principios:
 * 1. El contenido se compone de bloques tipados
 * 2. Cada bloque dice explícitamente qué es y su carga útil
 * 3. El front no interpreta, solo obedece
 * 4. Un tipo = un componente visual
 */

export const CONTENT_CONTRACT_VERSION = '1.0.0';

// ============================================================================
// ESQUEMA DEL CONTRATO
// ============================================================================

export interface ContentDocument {
  version: string;
  locale: string; // e.g., "es"
  content_id: string; // unique document id
  meta: DocumentMeta;
  blocks: ContentBlock[];
  quiz?: QuizData;
}

export interface DocumentMeta {
  topic: string;
  audience: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string; // ISO string (snake_case per new contract)
  author?: string;
  estimatedReadingTime?: number;
}

// ============================================================================
// TIPOS DE BLOQUES (ENUM)
// ============================================================================

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout'
  | 'highlight'
  | 'link';

export interface ContentBlock {
  id: string;
  type: BlockType;
  data: BlockData;
}

// ============================================================================
// DATOS DE BLOQUES (DISCRIMINATED UNION)
// ============================================================================

export type BlockData =
  | HeadingData
  | ParagraphData
  | ListData
  | TableData
  | QuoteData
  | CodeData
  | DividerData
  | CalloutData
  | HighlightData
  | LinkData;

export interface HeadingData {
  text: string;
  level: 1 | 2 | 3; // Solo niveles 1-3 permitidos
}

export interface ParagraphData {
  text: string;
}

export interface ListData {
  style: 'bulleted' | 'numbered';
  items: string[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface QuoteData {
  text: string;
  author?: string;
}

export interface CodeData {
  language: string;
  snippet: string;
}

export interface DividerData {
  // Sin datos adicionales
}

export interface CalloutData {
  kind: 'tip' | 'warning' | 'info' | 'note';
  text: string;
}

export interface HighlightData {
  text: string;
}

export interface LinkData {
  text: string;
  url: string;
  description?: string;
}

// ============================================================================
// DATOS DE QUIZ
// ============================================================================

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string]; // Exactamente 4 opciones
  correctAnswer: 0 | 1 | 2 | 3; // Índice de la respuesta correcta
  explanation?: string;
}

// ============================================================================
// VALIDADOR DEL CONTRATO
// ============================================================================

export class ContentContractValidator {
  private static readonly MAX_TITLE_LENGTH = 120;
  private static readonly PARAGRAPH_MIN_WORDS = 60; // advisory
  private static readonly PARAGRAPH_MAX_WORDS = 180; // advisory
  private static readonly LIST_MIN_ITEMS = 1; // Más flexible para listas cortas
  private static readonly LIST_MAX_ITEMS = 7;
  private static readonly ITEM_MIN_WORDS = 6;
  private static readonly ITEM_MAX_WORDS = 18;
  private static readonly TABLE_MIN_COLS = 2;
  private static readonly TABLE_MAX_COLS = 6;
  private static readonly TABLE_MIN_ROWS = 1;
  private static readonly TABLE_MAX_ROWS = 25;
  private static readonly MIN_BLOCKS_RECOMMENDED = 8;
  private static readonly MAX_BLOCKS_RECOMMENDED = 14;

  /**
   * Valida que un documento cumpla el contrato
   */
  public static validateDocument(doc: ContentDocument): ValidationResult {
    const errors: string[] = [];

    // Validar version (cualquier string, pero no vacío)
    if (!doc.version || String(doc.version).trim() === '') {
      errors.push('version es requerido');
    }

    // Validar documento base
    if (!doc.locale || doc.locale.trim() === '') {
      errors.push('locale es requerido');
    }
    if (!doc.content_id || doc.content_id.trim() === '') {
      errors.push('content_id es requerido');
    }

    // Validar meta
    if (!doc.meta.topic || !doc.meta.audience || !doc.meta.level) {
      errors.push(
        'Meta información incompleta: topic, audience y level son requeridos'
      );
    }
    if (
      !(doc.meta as any).created_at ||
      String((doc.meta as any).created_at).trim() === ''
    ) {
      errors.push('meta.created_at es requerido');
    }

    // Validar cantidad de bloques (solo error si vacío)
    if (!doc.blocks || doc.blocks.length === 0) {
      errors.push('blocks es requerido y no puede estar vacío');
    }

    // Validar cada bloque
    const blockIds = new Set<string>();
    doc.blocks.forEach((block, index) => {
      const blockErrors = this.validateBlock(block, index);
      errors.push(...blockErrors);

      // Verificar IDs únicos
      if (blockIds.has(block.id)) {
        errors.push(`ID duplicado en bloque ${index}: ${block.id}`);
      }
      blockIds.add(block.id);
    });

    // Validar quiz si existe
    if (doc.quiz) {
      errors.push(...this.validateQuizData(doc.quiz));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(doc),
    };
  }

  /**
   * Valida un bloque individual
   */
  private static validateBlock(block: ContentBlock, index: number): string[] {
    const errors: string[] = [];

    // Validar ID
    if (!block.id || block.id.trim() === '') {
      errors.push(`Bloque ${index}: ID es requerido`);
    }

    // Validar tipo
    if (!block.type) {
      errors.push(`Bloque ${index}: Tipo es requerido`);
    }

    // Validar datos según tipo
    if (block.data) {
      switch (block.type) {
        case 'heading':
          errors.push(
            ...this.validateHeadingData(block.data as HeadingData, index)
          );
          break;
        case 'paragraph':
          errors.push(
            ...this.validateParagraphData(block.data as ParagraphData, index)
          );
          break;
        case 'list':
          errors.push(...this.validateListData(block.data as ListData, index));
          break;
        case 'table':
          errors.push(
            ...this.validateTableData(block.data as TableData, index)
          );
          break;
        case 'quote':
          errors.push(
            ...this.validateQuoteData(block.data as QuoteData, index)
          );
          break;
        case 'code':
          errors.push(...this.validateCodeData(block.data as CodeData, index));
          break;
        case 'divider':
          // Divider no necesita datos adicionales
          break;
        case 'callout':
          errors.push(
            ...this.validateCalloutData(block.data as CalloutData, index)
          );
          break;
        case 'highlight':
          errors.push(
            ...this.validateHighlightData(block.data as HighlightData, index)
          );
          break;
        case 'link':
          errors.push(...this.validateLinkData(block.data as LinkData, index));
          break;
        default:
          errors.push(`Bloque ${index}: Tipo desconocido: ${block.type}`);
      }
    } else {
      errors.push(`Bloque ${index}: Datos son requeridos`);
    }

    return errors;
  }

  private static validateHeadingData(
    data: HeadingData,
    index: number
  ): string[] {
    const errors: string[] = [];

    if (!data.text || data.text.trim() === '') {
      errors.push(`Bloque ${index} (heading): Texto es requerido`);
    }

    if (data.text && data.text.length > this.MAX_TITLE_LENGTH) {
      errors.push(
        `Bloque ${index} (heading): Texto muy largo (${data.text.length} > ${this.MAX_TITLE_LENGTH})`
      );
    }

    if (data.level < 1 || data.level > 3) {
      errors.push(
        `Bloque ${index} (heading): Nivel debe ser 1, 2 o 3, recibido: ${data.level}`
      );
    }

    return errors;
  }

  private static validateParagraphData(
    data: ParagraphData,
    index: number
  ): string[] {
    const errors: string[] = [];

    if (!data.text || data.text.trim() === '') {
      errors.push(`Bloque ${index} (paragraph): Texto es requerido`);
    }

    // Word-count bounds are advisory; enforce as warnings in generateWarnings

    return errors;
  }

  private static validateListData(data: ListData, index: number): string[] {
    const errors: string[] = [];

    if (!data.style || !['bulleted', 'numbered'].includes(data.style)) {
      errors.push(
        `Bloque ${index} (list): Estilo debe ser 'bulleted' o 'numbered'`
      );
    }

    if (!data.items || data.items.length === 0) {
      errors.push(`Bloque ${index} (list): Items son requeridos`);
    } else if (
      data.items.length < this.LIST_MIN_ITEMS ||
      data.items.length > this.LIST_MAX_ITEMS
    ) {
      errors.push(
        `Bloque ${index} (list): Debe tener entre ${this.LIST_MIN_ITEMS}-${this.LIST_MAX_ITEMS} items. Actual: ${data.items.length}`
      );
    }

    if (data.items) {
      data.items.forEach((item, itemIndex) => {
        if (!item || item.trim() === '') {
          errors.push(`Bloque ${index} (list): Item ${itemIndex} está vacío`);
        }
      });
    }

    return errors;
  }

  private static validateTableData(data: TableData, index: number): string[] {
    const errors: string[] = [];

    // Si no hay headers, generar headers básicos automáticamente
    if (!data.headers || data.headers.length === 0) {
      if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
        // Generar headers basados en el número de columnas de la primera fila
        const firstRow = data.rows[0];
        if (Array.isArray(firstRow)) {
          data.headers = firstRow.map((_, i) => `Columna ${i + 1}`);
        }
      } else {
        // Si no hay datos, crear una tabla básica
        data.headers = ['Concepto', 'Descripción'];
        data.rows = [['Ejemplo', 'Descripción del ejemplo']];
      }
    }

    // Asegurar que siempre haya al menos 2 columnas
    if (data.headers && data.headers.length < 2) {
      data.headers = ['Concepto', 'Descripción'];
      // Ajustar las filas existentes para que tengan 2 columnas
      if (data.rows && Array.isArray(data.rows)) {
        data.rows = data.rows.map(row => {
          if (Array.isArray(row)) {
            const adjustedRow = [...row];
            while (adjustedRow.length < 2) {
              adjustedRow.push('');
            }
            return adjustedRow.slice(0, 2);
          }
          return ['', ''];
        });
      } else {
        data.rows = [['Ejemplo', 'Descripción del ejemplo']];
      }
    }

    if (
      data.headers &&
      (data.headers.length < this.TABLE_MIN_COLS ||
        data.headers.length > this.TABLE_MAX_COLS)
    ) {
      errors.push(
        `Bloque ${index} (table): Columnas debe estar entre ${this.TABLE_MIN_COLS}-${this.TABLE_MAX_COLS}. Actual: ${data.headers.length}`
      );
    }

    if (!data.rows || data.rows.length === 0) {
      errors.push(`Bloque ${index} (table): Filas son requeridas`);
    }

    if (
      data.rows &&
      (data.rows.length < this.TABLE_MIN_ROWS ||
        data.rows.length > this.TABLE_MAX_ROWS)
    ) {
      errors.push(
        `Bloque ${index} (table): Filas debe estar entre ${this.TABLE_MIN_ROWS}-${this.TABLE_MAX_ROWS}. Actual: ${data.rows.length}`
      );
    }

    // Verificar coherencia: cada fila debe tener el mismo número de celdas que headers
    if (data.headers && data.rows) {
      const expectedCols = data.headers.length;

      // Asegurar que data.rows es un array
      if (!Array.isArray(data.rows)) {
        console.warn(
          `Bloque ${index} (table): data.rows no es un array, convirtiendo...`
        );
        data.rows = [];
      }

      data.rows.forEach((row, rowIndex) => {
        // Asegurar que row es un array
        if (!Array.isArray(row)) {
          console.warn(
            `Bloque ${index} (table): Fila ${rowIndex} no es un array, convirtiendo...`
          );
          data.rows[rowIndex] = [];
          row = [];
        }

        if (row.length !== expectedCols) {
          // Ajustar la fila para que tenga el número correcto de columnas
          while (row.length < expectedCols) {
            row.push('');
          }
          if (row.length > expectedCols) {
            data.rows[rowIndex] = row.slice(0, expectedCols);
          }
        }

        // Verificar que no haya celdas vacías (solo advertencia, no error)
        row.forEach((cell, cellIndex) => {
          // Asegurar que cell es un string
          if (typeof cell !== 'string') {
            console.warn(
              `Bloque ${index} (table): Celda [${rowIndex}][${cellIndex}] no es string, convirtiendo...`
            );
            data.rows[rowIndex][cellIndex] = String(cell || '');
            cell = String(cell || '');
          }

          if (!cell || cell.trim() === '') {
            // Convertir a advertencia en lugar de error
            console.warn(
              `Bloque ${index} (table): Celda [${rowIndex}][${cellIndex}] está vacía`
            );
          }
        });
      });
    }

    return errors;
  }

  private static validateQuoteData(data: QuoteData, index: number): string[] {
    const errors: string[] = [];

    if (!data.text || data.text.trim() === '') {
      errors.push(`Bloque ${index} (quote): Texto es requerido`);
    }

    return errors;
  }

  private static validateCodeData(data: CodeData, index: number): string[] {
    const errors: string[] = [];

    if (!data.language || data.language.trim() === '') {
      errors.push(`Bloque ${index} (code): Lenguaje es requerido`);
    }

    if (!data.snippet || data.snippet.trim() === '') {
      errors.push(`Bloque ${index} (code): Snippet es requerido`);
    }
    if (data.snippet) {
      // multilínea: debe contener al menos un salto de línea real
      if (!/\n/.test(data.snippet)) {
        errors.push(
          `Bloque ${index} (code): Debe ser multilínea con saltos de línea reales`
        );
      }
      // indentación coherente: solo validar si tiene múltiples líneas de contenido
      const lines = data.snippet.split(/\n/).filter(l => l.trim().length > 0);
      if (lines.length > 2) {
        // Solo validar si tiene más de 2 líneas de contenido
        const hasIndented = lines.some(l => /^\s+\S/.test(l));
        if (!hasIndented) {
          // Esta validación se mueve a generateWarnings
        }
      }
    }

    return errors;
  }

  private static validateCalloutData(
    data: CalloutData,
    index: number
  ): string[] {
    const errors: string[] = [];
    if (!data.kind || !['tip', 'warning', 'info', 'note'].includes(data.kind)) {
      errors.push(
        `Bloque ${index} (callout): kind debe ser 'tip', 'warning', 'info' o 'note'`
      );
    }
    if (!data.text || data.text.trim() === '') {
      errors.push(`Bloque ${index} (callout): text es requerido`);
    }

    return errors;
  }

  private static validateHighlightData(
    data: HighlightData,
    index: number
  ): string[] {
    const errors: string[] = [];

    if (!data.text || data.text.trim() === '') {
      errors.push(`Bloque ${index} (highlight): Texto es requerido`);
    }

    return errors;
  }

  private static validateLinkData(data: LinkData, index: number): string[] {
    const errors: string[] = [];

    if (!data.text || data.text.trim() === '') {
      errors.push(`Bloque ${index} (link): Texto es requerido`);
    }

    if (!data.url || data.url.trim() === '') {
      errors.push(`Bloque ${index} (link): URL es requerida`);
    }

    // Validar formato de URL básico
    if (data.url && !this.isValidUrl(data.url)) {
      errors.push(`Bloque ${index} (link): URL inválida: ${data.url}`);
    }
    if (data.url && !/^https:\/\//.test(data.url)) {
      errors.push(`Bloque ${index} (link): URL debe ser https`);
    }

    return errors;
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static validateQuizData(quiz: QuizData): string[] {
    const errors: string[] = [];

    if (!quiz.title || quiz.title.trim() === '') {
      errors.push('Quiz: Título es requerido');
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      errors.push('Quiz: Debe tener al menos una pregunta');
    } else if (quiz.questions.length < 5) {
      errors.push(
        `Quiz: Mínimo 5 preguntas requeridas, se encontraron ${quiz.questions.length}`
      );
    } else if (quiz.questions.length > 10) {
      errors.push(
        `Quiz: Máximo 10 preguntas permitidas, se encontraron ${quiz.questions.length}`
      );
    }

    quiz.questions.forEach((question, index) => {
      if (!question.question || question.question.trim() === '') {
        errors.push(`Quiz pregunta ${index + 1}: Pregunta es requerida`);
      }

      if (!question.options || question.options.length !== 4) {
        errors.push(
          `Quiz pregunta ${index + 1}: Debe tener exactamente 4 opciones`
        );
      } else {
        question.options.forEach((option, optIndex) => {
          if (!option || option.trim() === '') {
            errors.push(
              `Quiz pregunta ${index + 1}, opción ${optIndex + 1}: Opción no puede estar vacía`
            );
          }
        });
      }

      if (question.correctAnswer < 0 || question.correctAnswer > 3) {
        errors.push(
          `Quiz pregunta ${index + 1}: Respuesta correcta debe ser entre 0-3`
        );
      }

      if (question.explanation && question.explanation.trim() === '') {
        errors.push(
          `Quiz pregunta ${index + 1}: Explicación no puede estar vacía si se proporciona`
        );
      }
    });

    return errors;
  }

  private static generateWarnings(doc: ContentDocument): string[] {
    const warnings: string[] = [];
    if (
      doc.blocks &&
      (doc.blocks.length < this.MIN_BLOCKS_RECOMMENDED ||
        doc.blocks.length > this.MAX_BLOCKS_RECOMMENDED)
    ) {
      warnings.push(
        `Recomendación: la lección debería tener entre ${this.MIN_BLOCKS_RECOMMENDED}-${this.MAX_BLOCKS_RECOMMENDED} bloques. Actual: ${doc.blocks.length}`
      );
    }
    // Advisory: paragraph word counts
    doc.blocks.forEach((b, i) => {
      if (b.type === 'paragraph') {
        const text = (b.data as any)?.text || '';
        const words = String(text).trim().split(/\s+/).filter(Boolean).length;
        if (
          words &&
          (words < this.PARAGRAPH_MIN_WORDS || words > this.PARAGRAPH_MAX_WORDS)
        ) {
          warnings.push(
            `Bloque ${i} (paragraph): recomendado ${this.PARAGRAPH_MIN_WORDS}-${this.PARAGRAPH_MAX_WORDS} palabras. Actual: ${words}`
          );
        }
      }
      if (b.type === 'list') {
        const items: string[] = (b.data as any)?.items || [];
        items.forEach((it, j) => {
          const words = String(it || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
          if (
            words &&
            (words < this.ITEM_MIN_WORDS || words > this.ITEM_MAX_WORDS)
          ) {
            warnings.push(
              `Bloque ${i} (list): item ${j} recomendado ${this.ITEM_MIN_WORDS}-${this.ITEM_MAX_WORDS} palabras. Actual: ${words}`
            );
          }
        });
      }
    });

    // Verificar jerarquía de headings
    const headings = doc.blocks.filter(
      b => b.type === 'heading'
    ) as (ContentBlock & { data: HeadingData })[];
    const headingLevels = headings.map(h => h.data.level);

    // Verificar que no se salte niveles (ej: H1 -> H3 sin H2)
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] > headingLevels[i - 1] + 1) {
        warnings.push(
          `Jerarquía de headings: se saltó del nivel ${headingLevels[i - 1]} al ${headingLevels[i]}`
        );
      }
    }

    // Verificar que empiece con H1
    if (headingLevels.length > 0 && headingLevels[0] !== 1) {
      warnings.push('Documento no empieza con H1');
    }

    // Palabras pegadas básicas (heurística): detectar secuencias con mayúscula dentro de palabra sin espacio
    const gluedWordRegex = /[a-záéíóúñ][A-ZÁÉÍÓÚÑ][a-záéíóúñ]/g;
    const text = doc.blocks.map(b => JSON.stringify(b.data)).join(' ');
    if (gluedWordRegex.test(text)) {
      warnings.push('Posibles palabras pegadas detectadas');
    }

    // Code warnings: backticks/HTML y múltiples sentencias en la misma línea
    doc.blocks.forEach((b, i) => {
      if (b.type === 'code') {
        const s: string = (b.data as any)?.snippet || '';
        if (/```|<[^>]+>/.test(s)) {
          warnings.push(
            `Bloque ${i} (code): Se detectaron backticks/HTML; fueron normalizados`
          );
        }
        const lines = s.split(/\n/);
        if (lines.some(l => (l.match(/;/g) || []).length > 1)) {
          warnings.push(
            `Bloque ${i} (code): Varias sentencias en una línea; se recomienda separarlas`
          );
        }
      }
    });

    return warnings;
  }
}

// ============================================================================
// TIPOS DE RESULTADO
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// UTILIDADES
// ============================================================================

export class ContentContractUtils {
  /**
   * Genera un ID único para un bloque
   */
  public static generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crea un documento vacío
   */
  public static createEmptyDocument(
    topic: string,
    audience: string,
    level: 'beginner' | 'intermediate' | 'advanced'
  ): ContentDocument {
    return {
      version: CONTENT_CONTRACT_VERSION,
      locale: 'es',
      content_id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      meta: {
        topic,
        audience,
        level,
        created_at: new Date().toISOString(),
      },
      blocks: [],
    };
  }

  /**
   * Crea un bloque de heading
   */
  public static createHeading(
    text: string,
    level: 1 | 2 | 3,
    id?: string
  ): ContentBlock {
    return {
      id: id || this.generateBlockId(),
      type: 'heading',
      data: { text, level },
    };
  }

  /**
   * Crea un bloque de párrafo
   */
  public static createParagraph(text: string, id?: string): ContentBlock {
    return {
      id: id || this.generateBlockId(),
      type: 'paragraph',
      data: { text },
    };
  }

  /**
   * Crea un bloque de lista
   */
  public static createList(
    style: 'bulleted' | 'numbered',
    items: string[],
    id?: string
  ): ContentBlock {
    return {
      id: id || this.generateBlockId(),
      type: 'list',
      data: { style, items },
    };
  }

  /**
   * Crea un bloque de tabla
   */
  public static createTable(
    headers: string[],
    rows: string[][],
    id?: string
  ): ContentBlock {
    return {
      id: id || this.generateBlockId(),
      type: 'table',
      data: { headers, rows },
    };
  }

  /**
   * Crea un bloque de código
   */
  public static createCode(
    language: string,
    snippet: string,
    id?: string
  ): ContentBlock {
    return {
      id: id || this.generateBlockId(),
      type: 'code',
      data: { language, snippet },
    };
  }

  /**
   * Crea un bloque de callout
   */
  public static createCallout(
    type: 'tip' | 'warning' | 'info' | 'note',
    title: string,
    content: string,
    id?: string
  ): ContentBlock {
    return {
      id: id || this.generateBlockId(),
      type: 'callout',
      data: { kind: type, text: `${title ? title + ': ' : ''}${content}` },
    };
  }
}
