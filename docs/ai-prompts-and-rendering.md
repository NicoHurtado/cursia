## Cursia · Prompts a la IA y Render en Frontend

Esta guía muestra exactamente qué prompts (system y user) se envían a la IA, con qué estructura, y cómo se renderiza la respuesta en el frontend. Incluye fragmentos listos para copiar y pegar.

---

### 1) Construcción y envío del prompt (backend)

Lugar principal: `lib/ai/anthropic.ts`

System y user prompt para METADATA DE CURSO (se fuerza salida JSON estricta). La función arma los textos con `ContractPromptBuilder` y llama a `askClaude`:

```ts
// lib/ai/anthropic.ts (extracto)
import { ContractPromptBuilder } from '@/lib/ai/content-contract-prompts';

export async function generateCourseMetadata(
  prompt: string,
  level: string,
  interests: string[]
): Promise<string> {
  const systemPrompt = ContractPromptBuilder.buildSystemPrompt('course');
  let userPrompt = ContractPromptBuilder.buildUserPrompt('course', {
    topic: prompt,
    level: level as 'beginner' | 'intermediate' | 'advanced',
    interests: interests,
  });

  // Instrucciones para forzar JSON válido entre <<<JSON>>> y <<<END>>>
  const jsonInstruction = `\n\nDevuelve UNICAMENTE un JSON válido entre las marcas <<<JSON>>> y <<<END>>> con esta estructura exacta (sin comentarios):\n{\n  "title": string,\n  "description": string (>= 600 caracteres),\n  "prerequisites": string[],\n  "totalModules": number (1-10),\n  "moduleList": string[] (>= 4),\n  "topics": string[],\n  "introduction": string (opcional),\n  "finalProjectData": {\n    "title": string,\n    "description": string,\n    "requirements": string[],\n    "deliverables": string[]\n  } (opcional),\n  "totalSizeEstimate": string (opcional),\n  "language": "es"\n}\nNo incluyas texto adicional, ni bloques markdown, ni explicaciones.`;

  userPrompt = `${userPrompt}\n\n${jsonInstruction}\n\nFormato de salida:\n<<<JSON>>>\n{ JSON }\n<<<END>>>`;

  return askClaude({ system: systemPrompt, user: userPrompt });
}
```

Estructura del request enviado a Anthropic (modelo, mensajes y headers):

```ts
// lib/ai/anthropic.ts (extracto)
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}
interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
}

const baseRequestBody: Omit<AnthropicRequest, 'max_tokens'> = {
  model: 'claude-3-haiku-20240307',
  messages: [{ role: 'user', content: user }],
  system,
};

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({ ...baseRequestBody, max_tokens: currentMaxTokens }),
});
```

---

### 2) Plantillas y builder del prompt

Lugar: `lib/ai/content-contract-prompts.ts`

- `buildSystemPrompt('course' | 'module' | 'chunk')`: concatena el contrato de contenido y la guía específica.
- `buildUserPrompt(...)`: arma el prompt del usuario con contexto (tema, nivel, intereses, títulos, etc.).

```ts
// lib/ai/content-contract-prompts.ts (extracto)
export class ContractPromptBuilder {
  static buildSystemPrompt(contentType: 'course' | 'module' | 'chunk'): string {
    const basePrompt = CONTENT_CONTRACT_SYSTEM_PROMPT;
    switch (contentType) {
      case 'course':
        return basePrompt + '\n\n' + COURSE_METADATA_CONTRACT_PROMPT;
      case 'module':
        return basePrompt + '\n\n' + MODULE_CONTENT_CONTRACT_PROMPT;
      case 'chunk':
        return basePrompt + '\n\n' + MODULE_CONTENT_CONTRACT_PROMPT;
      default:
        return basePrompt;
    }
  }

  static buildUserPrompt(
    contentType: 'course' | 'module' | 'chunk',
    context: {
      topic?: string;
      level?: string;
      interests?: string[];
      moduleTitle?: string;
      moduleOrder?: number;
      totalModules?: number;
      courseDescription?: string;
    }
  ): string {
    switch (contentType) {
      case 'course':
        return `Curso: "${context.topic}"
Nivel: ${context.level}
Intereses (para ejemplos y ejercicios): ${context.interests?.join(', ') || 'N/A'}

Genera metadata de curso que siga principios de aprendizaje humano real. Considera el nivel del estudiante y crea una progresión natural que construya conocimiento paso a paso.`;

      case 'module':
        return `Módulo: "${context.moduleTitle}" (${context.moduleOrder}/${context.totalModules})
Curso: ${context.topic}
Descripción del curso: ${context.courseDescription}

Crea un módulo educativo que siga principios de aprendizaje humano real. Considera que este es el módulo ${context.moduleOrder} de ${context.totalModules}...

📏 TAMAÑO IDEAL: Genera un módulo de 4,000-8,000 caracteres con 15-25 bloques...

IMPORTANTE: Adapta el contenido según el tema del curso: ...`;

      case 'chunk':
        return `Chunk: "${context.moduleTitle}"
Curso: ${context.topic}
Nivel: ${context.level}

Crea contenido educativo para este chunk específico...`;

      default:
        return 'Genera contenido educativo siguiendo el contrato de contenido.';
    }
  }
}
```

Contrato recomendado para MÓDULOS (estructura `ContentDocument` y principios):

```md
// lib/ai/content-contract-prompts.ts (extracto de MODULE_CONTENT_CONTRACT_PROMPT)
{
"version": "1.0.0",
"language": "es",
"meta": { "topic": "...", "audience": "...", "level": "beginner|intermediate|advanced", "createdAt": "ISO string" },
"blocks": [
{ "id": "block_module_1", "type": "heading", "data": { "text": "Título del Módulo", "level": 1 } },
{ "id": "block_module_2", "type": "paragraph", "data": { "text": "Descripción del módulo..." } },
{ "id": "block_quiz_1", "type": "heading", "data": { "text": "Quiz del Módulo", "level": 2 } },
{ "id": "block_quiz_2", "type": "callout", "data": { "type": "info", "title": "Instrucciones del Quiz", "content": "..." } }
],
"quiz": {
"title": "Quiz: [Título del Módulo]",
"questions": [
{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." },
{ "question": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "..." }
]
}
}
```

---

### 3) Flujo de endpoint que dispara la generación

Lugar: `app/api/courses/route.ts`

```ts
// app/api/courses/route.ts (extracto)
const metadata = await simpleAI.generateCourseMetadata(
  prompt,
  level,
  userInterests
);
await db.course.update({
  where: { courseId },
  data: {
    status: 'METADATA_READY',
    title: metadata.title,
    description: metadata.description,
    prerequisites: JSON.stringify(metadata.prerequisites),
    totalModules: metadata.totalModules,
    moduleList: JSON.stringify(metadata.moduleList),
    topics: JSON.stringify(metadata.topics),
    introduction: metadata.introduction,
    finalProjectData: metadata.finalProjectData
      ? JSON.stringify(metadata.finalProjectData)
      : null,
    totalSizeEstimate: metadata.totalSizeEstimate,
    language: metadata.language,
  },
});
```

---

### 4) Cómo se renderiza la respuesta en el frontend

Lugar: `components/course/StructuredContentRenderer.tsx`

Estrategia:

- Intenta parsear como `ContentDocument` JSON → renderiza con `ContractRenderer`.
- Si no es JSON pero tiene “tags” → parsea con `ContentParser` y renderiza componentes tipados.
- Si nada aplica → muestra texto plano.

```tsx
// components/course/StructuredContentRenderer.tsx (extracto)
export function StructuredContentRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  // 1) Intento ContentContract JSON
  try {
    const maybe: unknown = JSON.parse(content);
    if (
      maybe &&
      typeof maybe === 'object' &&
      (maybe as any).version &&
      (maybe as any).meta &&
      Array.isArray((maybe as any).blocks)
    ) {
      return (
        <div className={cn('max-w-none', className)}>
          <ContractRenderer document={maybe as ContentDocument} />
        </div>
      );
    }
  } catch (_) {}

  // 2) Tagged content
  const hasTags =
    /^\[[A-Z_]+\]\s/m.test(content) ||
    content.includes('[TITLE]') ||
    content.includes('[PARAGRAPH]');
  if (!hasTags) {
    // 3) Fallback a texto
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

  // Parseo de tags y render
  const elements = ContentParser.parseTaggedContent(content);
  return (
    <div className={cn('structured-content space-y-6', className)}>
      {elements.map((element, index) => (
        <StructuredElement
          key={index}
          element={element}
          onCopyCode={copyToClipboard}
          copiedCode={copiedCode}
        />
      ))}
    </div>
  );
}
```

Demo que simula exactamente el JSON que llega de la IA y cómo se renderiza:

```tsx
// app/(marketing)/demo-ai-response/page.tsx (uso)
<StructuredContentRenderer content={rawAiResponse} />
```

---

### 5) Cómo se hace el POST desde el frontend

Lugar: `components/landing/CourseFunnelModal.tsx`

```ts
// components/landing/CourseFunnelModal.tsx (extracto)
const courseResponse = await fetch('/api/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: courseData.description,
    level: mappedLevel,
    interests: courseData.interests,
  }),
});
```

---

### 6) Snippet autocontenible para construir el prompt de metadata (copiar y pegar)

```ts
// build-prompts-example.ts (snippet)
import { ContractPromptBuilder } from '@/lib/ai/content-contract-prompts';

export function buildCourseMetadataPrompts(
  topic: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  interests: string[]
) {
  const system = ContractPromptBuilder.buildSystemPrompt('course');
  const baseUser = ContractPromptBuilder.buildUserPrompt('course', {
    topic,
    level,
    interests,
  });

  const jsonInstruction = `
Devuelve UNICAMENTE un JSON válido entre las marcas <<<JSON>>> y <<<END>>> con esta estructura exacta (sin comentarios):
{
  "title": string,
  "description": string (>= 600 caracteres),
  "prerequisites": string[],
  "totalModules": number (1-10),
  "moduleList": string[] (>= 4),
  "topics": string[],
  "introduction": string (opcional),
  "finalProjectData": {
    "title": string,
    "description": string,
    "requirements": string[],
    "deliverables": string[]
  } (opcional),
  "totalSizeEstimate": string (opcional),
  "language": "es"
}
No incluyas texto adicional, ni bloques markdown, ni explicaciones.`;

  const user = `${baseUser}

${jsonInstruction}

Formato de salida:
<<<JSON>>>
{ JSON }
<<<END>>>`;

  return { system, user };
}

// Uso de ejemplo:
// const { system, user } = buildCourseMetadataPrompts('Fundamentos de Python', 'beginner', ['programación', 'datos']);
// → system y user listos para enviarse a la API de Anthropic
```

---

### 7) Consejos de depuración

- Se puede loguear el `system` y `user` antes del `fetch` a la API para inspeccionar prompts reales (evitar en producción):

```ts
console.log('[AI][system]', systemPrompt);
console.log('[AI][user]', userPrompt.slice(0, 2000)); // truncar si es largo
```

- Asegúrate de que la respuesta cumpla con el formato esperado (JSON entre `<<<JSON>>>` y `<<<END>>>`) para que el parser no falle.

---

Con esto tienes el flujo completo: cómo se construye y envía el prompt, el contrato de contenido esperado, el endpoint que dispara la generación y cómo el frontend muestra la respuesta.
