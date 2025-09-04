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

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function askClaude({
  system,
  user,
}: {
  system: string;
  user: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const requestBody: AnthropicRequest = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: user,
      },
    ],
    system,
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const data: AnthropicResponse = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new Error('No content received from Anthropic API');
    }

    return data.content[0].text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Anthropic API call failed: ${error.message}`);
    }
    throw new Error('Unknown error occurred while calling Anthropic API');
  }
}

export async function generateCourseMetadata(
  prompt: string,
  level: string,
  interests: string[]
): Promise<string> {
  const systemPrompt = `Genera metadata de curso en JSON. Responde SOLO con JSON válido:

{
  "title": "string",
  "description": "string (150-200 palabras)",
  "prerequisites": ["string", "string"],
  "totalModules": number (4-6),
  "moduleList": ["string", "string", ...],
  "topics": ["string", "string", ...],
  "introduction": "string",
  "finalProjectData": {
    "title": "string",
    "description": "string",
    "requirements": ["string", "string"],
    "deliverables": ["string", "string"]
  },
  "totalSizeEstimate": "string",
  "language": "es"
}

IMPORTANTE: Los intereses se usarán SOLO en ejemplos y ejercicios, NO son el tema principal del curso.`;

  const userPrompt = `Curso: "${prompt}"
Nivel: ${level}
Intereses (para ejemplos): ${interests.join(', ')}

Genera metadata completa. Los intereses solo se usarán en ejemplos y ejercicios.`;

  return askClaude({ system: systemPrompt, user: userPrompt });
}

export async function generateModuleContent(
  courseTitle: string,
  moduleTitle: string,
  moduleOrder: number,
  totalModules: number,
  courseDescription: string
): Promise<string> {
  const systemPrompt = `Genera contenido de módulo en JSON. Responde SOLO con JSON válido:

{
  "title": "string",
  "description": "string",
  "chunks": [
    {"title": "string", "content": "string (contenido en Markdown estructurado)"},
    {"title": "string", "content": "string (contenido en Markdown estructurado)"},
    {"title": "string", "content": "string (contenido en Markdown estructurado)"},
    {"title": "string", "content": "string (contenido en Markdown estructurado)"},
    {"title": "string", "content": "string (contenido en Markdown estructurado)"},
    {"title": "string", "content": "string (contenido en Markdown estructurado)"}
  ],
  "quiz": {
    "title": "string",
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": number (0-3),
        "explanation": "string"
      }
    ]
  },
  "content1": "string",
  "content2": "string",
  "content3": "string",
  "content4": "string",
  "total_chunks": 6
}

IMPORTANTE PARA EL CONTENIDO MARKDOWN:
- Usa títulos con ## para secciones principales
- Usa ### para subtítulos
- Usa listas con - o * para puntos importantes
- Usa > para citas o notas importantes
- Usa \`\`\`código\`\`\` para bloques de código
- Usa \`código\` para código inline
- Usa **texto** para énfasis
- Usa *texto* para cursiva
- Estructura el contenido de manera educativa y fácil de leer
- Incluye ejemplos prácticos y ejercicios
- Genera EXACTAMENTE 7 preguntas en el quiz
- Cada pregunta debe tener 4 opciones (A, B, C, D)
- correctAnswer debe ser 0, 1, 2, o 3 (índice de la opción correcta)`;

  const userPrompt = `Módulo: "${moduleTitle}" (${moduleOrder}/${totalModules})
Curso: ${courseTitle}
Descripción: ${courseDescription}

Genera contenido educativo completo con 6 chunks en formato Markdown estructurado y quiz de 7 preguntas.
Cada chunk debe tener:
- Títulos y subtítulos claros
- Listas de puntos importantes
- Ejemplos de código cuando sea relevante
- Citas o notas importantes
- Estructura visual atractiva y fácil de leer`;

  return askClaude({ system: systemPrompt, user: userPrompt });
}
