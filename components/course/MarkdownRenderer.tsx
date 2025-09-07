'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { Components } from 'react-markdown';
import {
  Code,
  Quote,
  List,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Normalize AI output by inserting newlines before headings/lists/quotes
  // and fixing common concatenations (e.g., "ProgramaciónAsí" -> line break)
  function normalizeMarkdown(raw: string): string {
    if (!raw) return '';
    let text = raw.replace(/\r\n/g, '\n');

    // Add paragraph breaks when a lowercase or ) is immediately followed by an uppercase
    // This helps with cases like: "... ProgramaciónAsí ..."
    text = text.replace(/([a-záéíóúñ0-9\)])([A-ZÁÉÍÓÚÑ])/g, '$1\n\n$2');

    // Ensure headings start on their own line
    text = text
      .replace(/(?<!^|\n)(#{1,6}\s)/g, '\n\n$1')
      .replace(/\s*(#{1,6}\s)/g, '\n$1');

    // Ensure blockquotes, unordered and ordered lists start on new line
    text = text
      .replace(/(?<!\n)>\s/g, '\n> ')
      .replace(/:\s*-\s/g, ':\n- ')
      .replace(/(?<!\n)-\s/g, '\n- ')
      .replace(/(?<!\n)(\d+)\.\s/g, '\n$1. ');

    // Collapse excessive blank lines to at most one empty line between blocks
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Custom components for react-markdown with GitHub-like styling
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-foreground mt-8 mb-6 first:mt-0 border-b border-border pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0 border-b border-border pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-base font-semibold text-foreground mt-3 mb-2">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-sm font-semibold text-foreground mt-2 mb-1">
        {children}
      </h6>
    ),
    p: ({ children }) => (
      <p className="text-foreground leading-7 mb-4">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-foreground">{children}</em>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');

      if (!inline && match) {
        // Block code with syntax highlighting
        return (
          <div className="relative group my-4">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-t border-l border-r rounded-t-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {match[1]}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(codeContent)}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedCode === codeContent ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-muted/30 p-4 rounded-b-lg border-b border-l border-r overflow-x-auto">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }

      // Inline code
      return (
        <code
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <div className="relative group my-4">
        <pre className="bg-muted/30 p-4 rounded-lg border overflow-x-auto">
          {children}
        </pre>
      </div>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-foreground pl-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground pl-4">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-foreground leading-6 mb-1">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-lg">
        <div className="flex items-start gap-2">
          <Quote className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
          <div className="text-foreground/90">{children}</div>
        </div>
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse border border-border rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-border">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2 text-foreground">
        {children}
      </td>
    ),
    hr: () => <hr className="my-8 border-t border-border" />,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg border border-border my-4"
      />
    ),
  };

  return (
    <div
      className={cn(
        'prose prose-slate dark:prose-invert max-w-none markdown-content',
        className
      )}
    >
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
