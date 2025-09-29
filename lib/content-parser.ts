/**
 * Content Parser for Cursia
 * Parses tagged content from AI and converts it to structured markdown
 */

export interface TaggedContent {
  type: string;
  content: string;
  metadata?: {
    language?: string;
    title?: string;
    items?: string[];
  };
}

export class ContentParser {
  private static readonly TAG_PATTERN = /^\[([A-Z_]+)\]\s*(.*)$/gm;

  /**
   * Parse tagged content into structured elements
   */
  public static parseTaggedContent(rawContent: string): TaggedContent[] {
    const lines = rawContent.split('\n');
    const elements: TaggedContent[] = [];
    let currentElement: TaggedContent | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\[([A-Z_]+)\]\s*(.*)$/);

      if (match) {
        // Save previous element if exists
        if (currentElement) {
          elements.push(currentElement);
        }

        // Start new element
        const [, tag, content] = match;
        currentElement = {
          type: tag,
          content: content.trim(),
        };

        // Handle special cases
        if (this.isCodeTag(tag)) {
          currentElement.metadata = { language: this.getLanguageFromTag(tag) };
        }
      } else if (currentElement && line.trim()) {
        // Continue current element
        if (this.isCodeTag(currentElement.type)) {
          // For code blocks, preserve formatting exactly
          currentElement.content += '\n' + line;
        } else if (this.isListTag(currentElement.type)) {
          // For lists, add as items (remove leading - or numbers)
          const cleanLine = line
            .replace(/^[\s]*[-*+]\s*/, '')
            .replace(/^[\s]*\d+\.\s*/, '')
            .trim();
          if (cleanLine) {
            if (!currentElement.metadata) {
              currentElement.metadata = { items: [] };
            }
            if (currentElement.metadata.items) {
              currentElement.metadata.items.push(cleanLine);
            }
          }
        } else {
          // For other content, append with space
          currentElement.content += ' ' + line.trim();
        }
      }
    }

    // Add last element
    if (currentElement) {
      elements.push(currentElement);
    }

    return elements;
  }

  /**
   * Convert tagged content to markdown
   */
  public static convertToMarkdown(elements: TaggedContent[]): string {
    return elements
      .map(element => this.elementToMarkdown(element))
      .join('\n\n');
  }

  /**
   * Convert a single element to markdown
   */
  private static elementToMarkdown(element: TaggedContent): string {
    switch (element.type) {
      case 'TITLE':
        return `# ${element.content}`;

      case 'SUBTITLE':
        return `## ${element.content}`;

      case 'HEADING':
        return `### ${element.content}`;

      case 'SUBHEADING':
        return `#### ${element.content}`;

      case 'PARAGRAPH':
      case 'INTRO':
      case 'EXPLANATION':
      case 'CONCLUSION':
        return element.content;

      case 'BULLET_LIST':
      case 'FEATURE_LIST':
      case 'BENEFIT_LIST':
        return this.formatBulletList(element);

      case 'NUMBERED_LIST':
      case 'STEP_LIST':
        return this.formatNumberedList(element);

      case 'CODE_BLOCK':
      case 'PYTHON_CODE':
      case 'JAVASCRIPT_CODE':
      case 'SQL_CODE':
        return this.formatCodeBlock(element);

      case 'INLINE_CODE':
        return `\`${element.content}\``;

      case 'QUOTE':
      case 'TIP':
      case 'WARNING':
      case 'NOTE':
      case 'KEY_CONCEPT':
        return this.formatQuote(element);

      case 'COMPARISON_TABLE':
      case 'DATA_TABLE':
      case 'SPECIFICATION_TABLE':
        return this.formatTable(element);

      case 'SEPARATOR':
        return '---';

      case 'HIGHLIGHT':
        return `**${element.content}**`;

      case 'EMPHASIS':
        return `*${element.content}*`;

      case 'LINK':
        return element.content; // Assume it's already formatted as markdown link

      default:
        console.warn(`Unknown tag type: ${element.type}`);
        return element.content;
    }
  }

  private static formatBulletList(element: TaggedContent): string {
    if (element.metadata?.items) {
      return element.metadata.items.map(item => `- ${item}`).join('\n');
    }
    return `- ${element.content}`;
  }

  private static formatNumberedList(element: TaggedContent): string {
    if (element.metadata?.items) {
      return element.metadata.items
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n');
    }
    return `1. ${element.content}`;
  }

  private static formatCodeBlock(element: TaggedContent): string {
    const language = element.metadata?.language || 'text';
    // Remove any existing ``` if present
    const cleanContent = element.content
      .replace(/^```\w*\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    return `\`\`\`${language}\n${cleanContent}\n\`\`\``;
  }

  private static formatQuote(element: TaggedContent): string {
    const prefix = this.getQuotePrefix(element.type);
    return `> ${prefix}${element.content}`;
  }

  private static formatTable(element: TaggedContent): string {
    // For now, return the content as-is, assuming it's already formatted as markdown table
    return element.content;
  }

  private static getQuotePrefix(type: string): string {
    switch (type) {
      case 'TIP':
        return '💡 **Tip:** ';
      case 'WARNING':
        return '⚠️ **Advertencia:** ';
      case 'NOTE':
        return '📝 **Nota:** ';
      case 'KEY_CONCEPT':
        return '🔑 **Concepto Clave:** ';
      default:
        return '';
    }
  }

  private static isCodeTag(tag: string): boolean {
    return [
      'CODE_BLOCK',
      'PYTHON_CODE',
      'JAVASCRIPT_CODE',
      'SQL_CODE',
      'INLINE_CODE',
    ].includes(tag);
  }

  private static isListTag(tag: string): boolean {
    return [
      'BULLET_LIST',
      'FEATURE_LIST',
      'BENEFIT_LIST',
      'NUMBERED_LIST',
      'STEP_LIST',
    ].includes(tag);
  }

  private static getLanguageFromTag(tag: string): string {
    switch (tag) {
      case 'PYTHON_CODE':
        return 'python';
      case 'JAVASCRIPT_CODE':
        return 'javascript';
      case 'SQL_CODE':
        return 'sql';
      default:
        return 'text';
    }
  }
}
