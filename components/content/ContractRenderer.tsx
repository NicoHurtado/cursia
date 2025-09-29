'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ContentDocument,
  ContentBlock,
  ContentContractValidator,
} from '@/lib/content-contract';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Copy,
  BookOpen,
} from 'lucide-react';

interface ContractRendererProps {
  document: ContentDocument;
  className?: string;
  showValidation?: boolean;
}

function ContractRendererImpl({
  document,
  className,
  showValidation = false,
}: ContractRendererProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const validation = showValidation
    ? ContentContractValidator.validateDocument(document)
    : null;

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div
      className={cn('contract-renderer space-y-8 max-w-4xl mx-auto', className)}
    >
      {validation && (
        <div className="mb-4">
          {validation.isValid ? (
            <div className="flex items-center gap-2 p-3 rounded border border-green-300 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-300 text-sm">
                Documento válido
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded border border-red-300 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 dark:text-red-300 text-sm">
                  Documento inválido
                </span>
              </div>
              {validation.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-700 dark:text-red-300">
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-8">
        {document.blocks.map((b, i) => (
          <Block key={b.id || i} block={b} onCopy={onCopy} copied={copied} />
        ))}
      </div>
    </div>
  );
}

function Block({
  block,
  onCopy,
  copied,
}: {
  block: ContentBlock;
  onCopy: (t: string) => void;
  copied: string | null;
}) {
  switch (block.type) {
    case 'heading': {
      const d: any = block.data;
      const level = Math.min(3, Math.max(1, d.level || 2));
      if (level === 1)
        return (
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 border-b-2 border-blue-500 pb-3">
            {d.text}
          </h1>
        );
      if (level === 2)
        return (
          <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-5 border-l-4 border-blue-500 pl-6 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-r-lg">
            {d.text}
          </h2>
        );
      return (
        <h3 className="text-2xl font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          {d.text}
        </h3>
      );
    }
    case 'paragraph': {
      const d: any = block.data;
      return (
        <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed text-base">
          {d.text}
        </p>
      );
    }
    case 'list': {
      const d: any = block.data;
      if (d.style === 'numbered') {
        return (
          <ol className="list-none space-y-3 text-slate-700 dark:text-slate-300 mb-6">
            {d.items?.map((it: string, idx: number) => (
              <li key={idx} className="leading-relaxed flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5 flex-shrink-0">
                  {idx + 1}
                </div>
                <span>{it}</span>
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-none space-y-3 text-slate-700 dark:text-slate-300 mb-6">
          {d.items?.map((it: string, idx: number) => (
            <li key={idx} className="leading-relaxed flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    }
    case 'table': {
      const d: any = block.data;
      return (
        <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {d.headers?.map((h: string, i: number) => (
                  <th
                    key={i}
                    className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {d.rows?.map((row: string[], r: number) => (
                <tr
                  key={r}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {row.map((cell: string, c: number) => (
                    <td
                      key={c}
                      className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'quote': {
      const d: any = block.data;
      return (
        <blockquote className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 pl-6 py-4 my-6 rounded-r-lg relative">
          <div className="absolute top-4 left-2 text-blue-500 text-2xl">"</div>
          <div className="ml-4 italic text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
            {d.text}
          </div>
        </blockquote>
      );
    }
    case 'code': {
      const d: any = block.data;
      const snippet = String(d.snippet ?? '').replace(/\\n/g, '\n');
      const layout: 'wrap' | 'scroll' =
        d.layout === 'scroll' ? 'scroll' : 'wrap';
      return (
        <div className="relative group my-8">
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between bg-slate-800 px-6 py-3 border-b border-slate-700">
              <div className="text-slate-300 text-sm font-medium">
                {d.language || 'text'}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                onClick={() => onCopy(snippet)}
              >
                {copied === snippet ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre
              className={`p-6 bg-slate-900 ${layout === 'wrap' ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto whitespace-pre'}`}
            >
              <code className="text-sm font-mono text-slate-100 leading-6">
                {snippet}
              </code>
            </pre>
          </div>
        </div>
      );
    }
    case 'divider':
      return <hr className="my-8 border-t border-border" />;
    case 'callout': {
      const d: any = block.data;
      const type = d.kind || 'info';
      const base = 'pl-6 py-4 my-6 rounded-r-lg relative';
      const map: any = {
        tip: {
          border: 'border-blue-500',
          bg: 'from-blue-50 to-purple-50',
          icon: <Lightbulb className="h-6 w-6" />,
        },
        warning: {
          border: 'border-yellow-500',
          bg: 'from-yellow-50 to-orange-50',
          icon: <AlertTriangle className="h-6 w-6" />,
        },
        info: {
          border: 'border-blue-500',
          bg: 'from-blue-50 to-cyan-50',
          icon: <Info className="h-6 w-6" />,
        },
        note: {
          border: 'border-blue-500',
          bg: 'from-blue-50 to-cyan-50',
          icon: <Info className="h-6 w-6" />,
        },
      };
      const styles = map[type] || map.info;
      return (
        <div
          className={cn(
            'border-l-4 bg-gradient-to-r dark:from-blue-950/20 dark:to-purple-950/20',
            base,
            styles.border,
            styles.bg
          )}
        >
          <div className="absolute top-4 left-2 text-blue-500 text-2xl">
            {styles.icon}
          </div>
          <div className="ml-4">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {d.text}
            </p>
          </div>
        </div>
      );
    }
    case 'highlight': {
      const d: any = block.data;
      return (
        <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded font-semibold">
          {d.text}
        </span>
      );
    }
    case 'link': {
      const d: any = block.data;
      return (
        <a
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 underline"
        >
          {d.text}
        </a>
      );
    }
    default:
      return null;
  }
}

const ContractRenderer = ContractRendererImpl;
export default ContractRenderer;
export { ContractRenderer };
