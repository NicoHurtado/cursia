'use client';

import {
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  Copy,
} from 'lucide-react';
import { useState } from 'react';

import { ContractRenderer } from '@/components/content/ContractRenderer';
import { Button } from '@/components/ui/button';
import { ContentDocument } from '@/lib/content-contract';
import { TaggedContent } from '@/lib/content-parser';
import { cn } from '@/lib/utils';

interface StructuredContentRendererProps {
  content: string;
  className?: string;
}

export function StructuredContentRenderer({
  content,
  className,
}: StructuredContentRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // 1) Try ContentDocument JSON (sistema único determinista)
  try {
    const maybe: unknown = JSON.parse(content);
    if (
      maybe &&
      typeof maybe === 'object' &&
      (maybe as any).version &&
      (maybe as any).locale &&
      (maybe as any).content_id &&
      (maybe as any).meta &&
      Array.isArray((maybe as any).blocks)
    ) {
      return (
        <div className={cn('max-w-none', className)}>
          <ContractRenderer document={maybe as ContentDocument} />
        </div>
      );
    }
  } catch (_) {
    // not JSON → continue
  }

  // 2) Si no es JSON válido del contrato, mostramos el texto como está (sin parsers alternos)
  return (
    <div
      className={cn(
        'prose prose-slate dark:prose-invert max-w-4xl mx-auto',
        className
      )}
    >
      <div className="whitespace-pre-wrap break-words">{content}</div>
    </div>
  );
}

interface StructuredElementProps {
  element: TaggedContent;
  onCopyCode: (text: string) => void;
  copiedCode: string | null;
}

function StructuredElement({
  element,
  onCopyCode,
  copiedCode,
}: StructuredElementProps) {
  switch (element.type) {
    case 'TITLE':
      return (
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 mt-10 border-b-2 border-blue-500 pb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent first:mt-0">
          {element.content}
        </h1>
      );

    case 'SUBTITLE':
      return (
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-6 mt-8 border-l-4 border-blue-500 pl-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 py-3 rounded-r-lg first:mt-0">
          {element.content}
        </h2>
      );

    case 'HEADING':
      return (
        <h3 className="text-2xl font-medium text-slate-700 dark:text-slate-300 mb-4 mt-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          {element.content}
        </h3>
      );

    case 'SUBHEADING':
      return (
        <h4 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-3 mt-5 border-b border-slate-200 dark:border-slate-700 pb-2">
          {element.content}
        </h4>
      );

    case 'PARAGRAPH':
    case 'INTRO':
    case 'EXPLANATION':
    case 'CONCLUSION':
      return (
        <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed text-base">
          {element.content}
        </p>
      );

    case 'BULLET_LIST':
    case 'FEATURE_LIST':
    case 'BENEFIT_LIST':
      return (
        <div className="mb-6">
          <ul className="list-none space-y-3 text-slate-700 dark:text-slate-300">
            {element.metadata?.items?.map((item, index) => (
              <li
                key={index}
                className="leading-relaxed flex items-start gap-3"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'NUMBERED_LIST':
    case 'STEP_LIST':
      return (
        <div className="mb-6">
          <ol className="list-none space-y-3 text-slate-700 dark:text-slate-300">
            {element.metadata?.items?.map((item, index) => (
              <li
                key={index}
                className="leading-relaxed flex items-start gap-3"
              >
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case 'CODE_BLOCK':
    case 'PYTHON_CODE':
    case 'JAVASCRIPT_CODE':
    case 'SQL_CODE':
      const language = element.metadata?.language || 'text';
      return (
        <div className="relative group my-8">
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between bg-slate-800 px-6 py-3 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-slate-300 text-sm font-medium">
                  {language}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                onClick={() => onCopyCode(element.content)}
              >
                {copiedCode === element.content ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="p-6 overflow-x-auto bg-slate-900">
              <code className="text-sm font-mono text-slate-100 leading-relaxed">
                {element.content}
              </code>
            </pre>
          </div>
        </div>
      );

    case 'TIP':
      return (
        <div className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 pl-6 py-4 my-6 rounded-r-lg relative">
          <div className="absolute top-4 left-2 text-blue-500 text-2xl">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Consejo
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {element.content}
            </p>
          </div>
        </div>
      );

    case 'WARNING':
      return (
        <div className="border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 pl-6 py-4 my-6 rounded-r-lg relative">
          <div className="absolute top-4 left-2 text-yellow-500 text-2xl">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              ⚠️ Advertencia
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {element.content}
            </p>
          </div>
        </div>
      );

    case 'NOTE':
      return (
        <div className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 pl-6 py-4 my-6 rounded-r-lg relative">
          <div className="absolute top-4 left-2 text-blue-500 text-2xl">
            <Info className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📝 Nota
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {element.content}
            </p>
          </div>
        </div>
      );

    case 'KEY_CONCEPT':
      return (
        <div className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 pl-6 py-4 my-6 rounded-r-lg relative">
          <div className="absolute top-4 left-2 text-purple-500 text-2xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              🔑 Concepto Clave
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {element.content}
            </p>
          </div>
        </div>
      );

    case 'QUOTE':
      return (
        <blockquote className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 pl-6 py-4 my-6 rounded-r-lg relative">
          <div className="absolute top-4 left-2 text-blue-500 text-2xl">"</div>
          <div className="ml-4 italic text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
            {element.content}
          </div>
        </blockquote>
      );

    case 'COMPARISON_TABLE':
    case 'DATA_TABLE':
    case 'SPECIFICATION_TABLE':
      return (
        <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        </div>
      );

    case 'SEPARATOR':
      return <hr className="my-8 border-t border-border" />;

    case 'HIGHLIGHT':
      return (
        <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded font-semibold">
          {element.content}
        </span>
      );

    case 'EMPHASIS':
      return (
        <em className="italic text-slate-600 dark:text-slate-400">
          {element.content}
        </em>
      );

    default:
      console.warn(`Unknown element type: ${element.type}`);
      return (
        <div className="text-slate-700 dark:text-slate-300 mb-4">
          {element.content}
        </div>
      );
  }
}
