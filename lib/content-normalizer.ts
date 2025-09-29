import { ContentDocument, ContentBlock } from '@/lib/content-contract';

function mapLevel(level: any): 'beginner' | 'intermediate' | 'advanced' {
  const v = String(level || '').toLowerCase();
  if (['beginner', 'principiante'].includes(v)) return 'beginner';
  if (['intermediate', 'intermedio'].includes(v)) return 'intermediate';
  if (['advanced', 'avanzado'].includes(v)) return 'advanced';
  return 'beginner';
}

export function normalizeToContract(input: any): ContentDocument {
  const doc: any = { ...input };
  // meta
  doc.meta = doc.meta || {};
  doc.meta.level = mapLevel(doc.meta.level);

  // Normalize blocks
  doc.blocks = Array.isArray(doc.blocks)
    ? doc.blocks.map((b: any): ContentBlock => {
        const type = b?.type;
        const data = b?.data;
        const id =
          b?.id ||
          `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        switch (type) {
          case 'paragraph': {
            const text = typeof data === 'string' ? data : (data?.text ?? '');
            return { id, type: 'paragraph', data: { text } } as any;
          }
          case 'list': {
            const style = data?.style || data?.type || 'bulleted';
            const items = Array.isArray(data?.items) ? data.items : [];
            return { id, type: 'list', data: { style, items } } as any;
          }
          case 'code': {
            const language = data?.language || 'text';
            let snippet = data?.snippet ?? data?.code ?? '';
            // Strip markdown code fences if present
            if (typeof snippet === 'string') {
              snippet = snippet
                .replace(/^```[a-zA-Z0-9]*\n?/, '')
                .replace(/\n?```$/, '')
                .replace(/```/g, ''); // remove any remaining backticks fences
            }
            // ensure multiline and has some indentation if likely single line
            if (typeof snippet === 'string' && !/\n/.test(snippet)) {
              if (snippet.trim().length < 10) {
                // Generate basic code example based on language
                if (language === 'java') {
                  snippet = `public class Ejemplo {\n    public static void main(String[] args) {\n        System.out.println("Hola mundo");\n    }\n}`;
                } else if (language === 'python') {
                  snippet = `def ejemplo():\n    print("Hola mundo")\n    return True\n\nejemplo()`;
                } else {
                  snippet = `// Ejemplo básico\nfunction ejemplo() {\n    console.log("Hola mundo");\n    return true;\n}`;
                }
              } else {
                snippet = `// Código de ejemplo\n  ${snippet}`;
              }
            }
            if (typeof snippet === 'string') {
              const lines = snippet.split(/\n/);
              const hasIndent = lines.some(l => /^\s+\S/.test(l));
              if (!hasIndent && lines.length > 1) {
                snippet = lines
                  .map((l, i) => (i === 0 ? l : '  ' + l))
                  .join('\n');
              }
              // split multiple statements on one line except for 'for (...)' headers
              // Split multiple statements in any line (except for-loop headers)
              const lines2 = snippet.split('\n').map((line: string) => {
                const trimmed = line.trimStart();
                if (/^for\s*\(/.test(trimmed)) return line;
                return line.replace(/;\s*(?=\S)/g, ';\n  ');
              });
              snippet = lines2.join('\n');
            }
            return { id, type: 'code', data: { language, snippet } } as any;
          }
          case 'callout': {
            const kind = data?.kind ?? data?.type ?? 'info';
            const text =
              data?.text ??
              (data?.title
                ? `${data.title}${data.content ? ': ' + data.content : ''}`
                : '');
            return { id, type: 'callout', data: { kind, text } } as any;
          }
          case 'quote': {
            const text = data?.text ?? '';
            const author = data?.cite ?? data?.author;
            return { id, type: 'quote', data: { text, author } } as any;
          }
          case 'divider': {
            return { id, type: 'divider', data: {} } as any;
          }
          case 'heading': {
            const level = Number(data?.level ?? 2);
            const text = data?.text ?? '';
            return { id, type: 'heading', data: { text, level } } as any;
          }
          case 'table': {
            let headers = Array.isArray(data?.headers) ? data.headers : [];
            let rows = Array.isArray(data?.rows) ? data.rows : [];

            // Limpiar y normalizar headers
            headers = headers
              .map((header: any) => {
                if (typeof header !== 'string') {
                  return String(header || '');
                }
                return header.trim();
              })
              .filter((header: string) => header.length > 0);

            // Limpiar y normalizar rows
            rows = rows.map((row: any) => {
              if (!Array.isArray(row)) {
                console.warn('Table row is not an array, converting...');
                return [];
              }
              return row.map(cell => {
                if (typeof cell !== 'string') {
                  return String(cell || '');
                }
                return cell.trim();
              });
            });

            // Si no hay headers pero hay filas, generar headers automáticamente
            if (headers.length === 0 && rows.length > 0) {
              const firstRow = rows[0];
              if (Array.isArray(firstRow) && firstRow.length > 0) {
                headers = firstRow.map((_, i) => `Columna ${i + 1}`);
              }
            }

            // Asegurar que siempre haya al menos 2 columnas
            if (headers.length < 2) {
              headers = ['Concepto', 'Descripción'];
            }

            // Si no hay datos o hay headers pero no filas, crear una tabla básica
            if (
              (headers.length === 0 && rows.length === 0) ||
              (headers.length > 0 && rows.length === 0)
            ) {
              if (headers.length === 0) {
                headers = ['Concepto', 'Descripción'];
              }
              rows = [['Ejemplo', 'Descripción del ejemplo']];
            }

            // Ajustar todas las filas para que tengan el mismo número de columnas que headers
            rows = rows.map((row: any) => {
              const adjustedRow = [...row];
              while (adjustedRow.length < headers.length) {
                adjustedRow.push('');
              }
              return adjustedRow.slice(0, headers.length);
            });

            // Asegurar que todas las filas tengan el mismo número de columnas
            if (headers.length > 0) {
              rows = rows.map((row: any) => {
                if (!Array.isArray(row)) {
                  console.warn(
                    'Table row is not an array during adjustment, creating empty row'
                  );
                  return new Array(headers.length).fill('');
                }
                const adjustedRow = [...row];
                while (adjustedRow.length < headers.length) {
                  adjustedRow.push('');
                }
                return adjustedRow.slice(0, headers.length);
              });
            }

            return { id, type: 'table', data: { headers, rows } } as any;
          }
          case 'link': {
            const text = data?.text ?? '';
            const url = data?.url ?? '';
            return { id, type: 'link', data: { text, url } } as any;
          }
          case 'highlight': {
            const text = data?.text ?? '';
            return { id, type: 'highlight', data: { text } } as any;
          }
          default: {
            // Unknown types: coerce to paragraph text if possible
            const text = typeof data === 'string' ? data : (data?.text ?? '');
            return { id, type: 'paragraph', data: { text } } as any;
          }
        }
      })
    : [];

  return doc as ContentDocument;
}
