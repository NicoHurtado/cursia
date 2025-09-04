'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Quote, 
  List, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Lightbulb,
  BookOpen
} from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Simple markdown parser for basic elements
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        elements.push(<div key={key++} className="h-4" />);
        continue;
      }

      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0 border-b border-border pb-2">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-xl font-semibold text-foreground mt-6 mb-3">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={key++} className="text-lg font-medium text-foreground mt-4 mb-2">
            {line.substring(5)}
          </h4>
        );
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        const quoteContent = line.substring(2);
        elements.push(
          <Card key={key++} className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 my-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Quote className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-blue-900 dark:text-blue-100 italic">
                  {quoteContent}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      }
      // Code blocks
      else if (line.startsWith('```')) {
        const language = line.substring(3) || 'text';
        const codeLines: string[] = [];
        i++; // Skip the opening ```
        
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        elements.push(
          <Card key={key++} className="my-4 bg-gray-900 dark:bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 border-b border-gray-600">
                <Code className="h-4 w-4 text-gray-400" />
                <Badge variant="secondary" className="text-xs">
                  {language}
                </Badge>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-gray-100 text-sm font-mono">
                  {codeLines.join('\n')}
                </code>
              </pre>
            </CardContent>
          </Card>
        );
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItems: string[] = [line.substring(2)];
        i++; // Check for more list items
        
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* ') || lines[i].startsWith('  '))) {
          if (lines[i].startsWith('- ') || lines[i].startsWith('* ')) {
            listItems.push(lines[i].substring(2));
          } else if (lines[i].startsWith('  ')) {
            // Sub-item
            listItems[listItems.length - 1] += '\n  ' + lines[i].substring(2);
          }
          i++;
        }
        i--; // Adjust for the loop increment
        
        elements.push(
          <ul key={key++} className="my-4 space-y-2">
            {listItems.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const listItems: string[] = [line.replace(/^\d+\.\s/, '')];
        i++; // Check for more list items
        
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+\.\s/, ''));
          i++;
        }
        i--; // Adjust for the loop increment
        
        elements.push(
          <ol key={key++} className="my-4 space-y-2 list-decimal list-inside">
            {listItems.map((item, index) => (
              <li key={index} className="text-foreground ml-4">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      // Special callout blocks
      else if (line.startsWith('> [!NOTE]') || line.startsWith('> [!TIP]') || line.startsWith('> [!WARNING]') || line.startsWith('> [!INFO]')) {
        const type = line.match(/\[!(.+?)\]/)?.[1] || 'NOTE';
        const content = line.replace(/^> \[!.+?\]\s*/, '');
        
        const iconMap = {
          NOTE: BookOpen,
          TIP: Lightbulb,
          WARNING: AlertCircle,
          INFO: Info,
        };
        
        const colorMap = {
          NOTE: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
          TIP: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
          WARNING: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
          INFO: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
        };
        
        const textColorMap = {
          NOTE: 'text-blue-900 dark:text-blue-100',
          TIP: 'text-green-900 dark:text-green-100',
          WARNING: 'text-yellow-900 dark:text-yellow-100',
          INFO: 'text-purple-900 dark:text-purple-100',
        };
        
        const Icon = iconMap[type as keyof typeof iconMap] || Info;
        
        elements.push(
          <Card key={key++} className={cn("border-l-4 my-4", colorMap[type as keyof typeof colorMap])}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", textColorMap[type as keyof typeof textColorMap])} />
                <div>
                  <h4 className={cn("font-semibold mb-1", textColorMap[type as keyof typeof textColorMap])}>
                    {type}
                  </h4>
                  <p className={cn("text-sm", textColorMap[type as keyof typeof textColorMap])}>
                    {content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }
      // Regular paragraphs
      else {
        const processedLine = processInlineMarkdown(line);
        elements.push(
          <p key={key++} className="text-foreground leading-relaxed mb-4">
            {processedLine}
          </p>
        );
      }
    }

    return elements;
  };

  // Process inline markdown (bold, italic, code, links)
  const processInlineMarkdown = (text: string): JSX.Element[] => {
    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;
    let key = 0;

    // Process bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    const boldMatches: { start: number; end: number; content: string }[] = [];

    while ((match = boldRegex.exec(text)) !== null) {
      boldMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1]
      });
    }

    // Process italic text
    const italicRegex = /\*(.*?)\*/g;
    const italicMatches: { start: number; end: number; content: string }[] = [];

    while ((match = italicRegex.exec(text)) !== null) {
      italicMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1]
      });
    }

    // Process inline code
    const codeRegex = /`(.*?)`/g;
    const codeMatches: { start: number; end: number; content: string }[] = [];

    while ((match = codeRegex.exec(text)) !== null) {
      codeMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1]
      });
    }

    // Combine all matches and sort by position
    const allMatches = [
      ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
      ...italicMatches.map(m => ({ ...m, type: 'italic' as const })),
      ...codeMatches.map(m => ({ ...m, type: 'code' as const }))
    ].sort((a, b) => a.start - b.start);

    // Build the result
    for (let i = 0; i < allMatches.length; i++) {
      const match = allMatches[i];
      
      // Add text before the match
      if (currentIndex < match.start) {
        parts.push(text.slice(currentIndex, match.start));
      }

      // Add the formatted content
      if (match.type === 'bold') {
        parts.push(<strong key={key++} className="font-semibold text-foreground">{match.content}</strong>);
      } else if (match.type === 'italic') {
        parts.push(<em key={key++} className="italic text-foreground">{match.content}</em>);
      } else if (match.type === 'code') {
        parts.push(
          <code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
            {match.content}
          </code>
        );
      }

      currentIndex = match.end;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }

    return parts.length > 0 ? parts as JSX.Element[] : [<span key={0}>{text}</span>];
  };

  return (
    <div className={cn("markdown-content", className)}>
      {parseMarkdown(content)}
    </div>
  );
}
