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
  const systemPrompt = `Eres un experto pedagogo y diseñador de currículos educativos. Tu tarea es crear un curso que siga principios de aprendizaje humano real.

Genera metadata de curso en JSON. Responde SOLO con JSON válido:

{
  "title": "string (título atractivo y específico)",
  "description": "string (descripción detallada de 150-200 palabras que explique qué aprenderá el estudiante)",
  "prerequisites": ["string", "string"],
  "totalModules": number (4-6),
  "moduleList": ["string", "string", ...],
  "topics": ["string", "string", ...],
  "introduction": "string (introducción motivacional al curso)",
  "finalProjectData": {
    "title": "string",
    "description": "string",
    "requirements": ["string", "string"],
    "deliverables": ["string", "string"]
  },
  "totalSizeEstimate": "string",
  "language": "es"
}

PRINCIPIOS PEDAGÓGICOS CRÍTICOS:

1. **PROGRESIÓN NATURAL**: Cada módulo debe construir sobre el anterior de manera lógica
2. **NIVEL APROPIADO**: El contenido debe ser apropiado para el nivel especificado
3. **HILO NARRATIVO**: Los módulos deben contar una historia coherente de aprendizaje
4. **APRENDIZAJE HUMANO**: Prioriza comprensión conceptual antes que sintaxis

ESTRUCTURA RECOMENDADA POR NIVEL:

**PRINCIPIANTE** (sin experiencia):
- Módulo 1: "¿Qué es [tema] y por qué es importante?" (conceptos, no código)
- Módulo 2: "Primeros pasos prácticos" (herramientas básicas)
- Módulo 3: "Conceptos fundamentales" (teoría aplicada)
- Módulo 4: "Tu primer proyecto" (aplicación práctica)

**INTERMEDIO** (conocimiento básico):
- Módulo 1: "Repaso y profundización" (consolidar bases)
- Módulo 2: "Técnicas avanzadas" (herramientas más complejas)
- Módulo 3: "Mejores prácticas" (optimización y calidad)
- Módulo 4: "Proyecto integrador" (aplicación completa)

**AVANZADO** (experiencia sólida):
- Módulo 1: "Arquitectura y diseño" (patrones avanzados)
- Módulo 2: "Optimización y rendimiento" (técnicas especializadas)
- Módulo 3: "Integración y despliegue" (producción)
- Módulo 4: "Proyecto final avanzado" (aplicación real)

EJEMPLOS DE TÍTULOS APROPIADOS POR NIVEL:

**Python Principiante**:
- "¿Qué es Python y por qué aprenderlo?"
- "Configurando tu entorno de desarrollo"
- "Variables y tipos de datos: Los bloques básicos"
- "Tu primer programa: Una calculadora simple"

**Python Intermedio**:
- "Funciones y módulos: Organizando tu código"
- "Manejo de archivos y datos"
- "Programación orientada a objetos"
- "Proyecto: Sistema de gestión de inventario"

**Python Avanzado**:
- "Arquitectura de aplicaciones Python"
- "Optimización y profiling"
- "APIs y microservicios"
- "Proyecto: Aplicación web completa"

IMPORTANTE: Los intereses se usarán SOLO en ejemplos y ejercicios, NO son el tema principal del curso.`;

  const userPrompt = `Curso: "${prompt}"
Nivel: ${level}
Intereses (para ejemplos y ejercicios): ${interests.join(', ')}

Crea un currículo educativo que siga principios de aprendizaje humano real. Considera el nivel del estudiante y crea una progresión natural que construya conocimiento paso a paso. Los módulos deben tener un hilo narrativo coherente y ser apropiados para el nivel especificado.`;

  return askClaude({ system: systemPrompt, user: userPrompt });
}

export async function generateModuleContent(
  courseTitle: string,
  moduleTitle: string,
  moduleOrder: number,
  totalModules: number,
  courseDescription: string
): Promise<string> {
  const systemPrompt = `Eres un maestro experto que crea contenido educativo verdaderamente humano y efectivo. Tu objetivo es enseñar de manera que los estudiantes realmente aprendan y comprendan.

Genera contenido de módulo en JSON. Responde SOLO con JSON válido:

{
  "title": "string",
  "description": "string (descripción detallada del módulo, 2-3 oraciones)",
  "chunks": [
    {"title": "string", "content": "string (contenido educativo completo en Markdown)"},
    {"title": "string", "content": "string (contenido educativo completo en Markdown)"},
    {"title": "string", "content": "string (contenido educativo completo en Markdown)"},
    {"title": "string", "content": "string (contenido educativo completo en Markdown)"},
    {"title": "string", "content": "string (contenido educativo completo en Markdown)"},
    {"title": "string", "content": "string (contenido educativo completo en Markdown)"}
  ],
  "quiz": {
    "title": "string",
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": number (0-3),
        "explanation": "string (explicación detallada de por qué es correcta)"
      }
    ]
  },
  "content1": "string",
  "content2": "string", 
  "content3": "string",
  "content4": "string",
  "total_chunks": 6
}

PRINCIPIOS DE ENSEÑANZA HUMANA:

1. **HILO NARRATIVO**: Cada chunk debe conectar con el anterior y preparar el siguiente
2. **CONTEXTO PRIMERO**: Explica el "por qué" antes del "cómo"
3. **PROGRESIÓN NATURAL**: De lo simple a lo complejo, de lo concreto a lo abstracto
4. **APRENDIZAJE ACTIVO**: Incluye reflexiones, preguntas y ejercicios mentales
5. **RELEVANCIA**: Conecta cada concepto con situaciones reales

ESTRUCTURA EDUCATIVA POR CHUNK:

**Chunk 1**: Contexto y motivación
- ¿Por qué es importante este tema?
- ¿Qué problema resuelve?
- ¿Cómo se relaciona con lo anterior?

**Chunk 2**: Conceptos fundamentales
- Explicación clara y simple
- Analogías y ejemplos de la vida real
- Evita jerga técnica innecesaria

**Chunk 3**: Aplicación práctica
- Ejemplos concretos y relevantes
- Código solo si es necesario y apropiado
- Explicación paso a paso

**Chunk 4**: Profundización
- Conceptos más avanzados
- Casos de uso reales
- Mejores prácticas

**Chunk 5**: Integración
- Cómo se conecta con otros conceptos
- Aplicaciones en proyectos reales
- Consideraciones importantes

**Chunk 6**: Consolidación
- Resumen de conceptos clave
- Próximos pasos
- Ejercicios de reflexión

REGLAS CRÍTICAS:

**NIVEL PRINCIPIANTE**:
- NO uses código en los primeros módulos
- Explica conceptos con analogías simples
- Usa lenguaje cotidiano, no técnico
- Enfócate en comprensión, no en memorización

**NIVEL INTERMEDIO**:
- Introduce código gradualmente
- Explica la lógica detrás del código
- Incluye casos de uso prácticos
- Conecta con conocimientos previos

**NIVEL AVANZADO**:
- Usa código cuando sea apropiado
- Enfócate en arquitectura y diseño
- Incluye consideraciones de producción
- Conecta con mejores prácticas

FORMATO MARKDOWN:
- Usa ## para títulos principales
- Usa ### para subtítulos
- Usa \`\`\`lenguaje\`\`\` para bloques de código (solo cuando sea apropiado)
- Usa \`código\` para código inline
- Usa **texto** para énfasis importante
- Usa > para consejos o notas importantes
- Usa listas numeradas para pasos secuenciales
- Usa listas con viñetas para puntos clave

QUIZ REQUIREMENTS:
- Genera EXACTAMENTE 7 preguntas de calidad
- Cada pregunta debe evaluar comprensión conceptual, no memorización
- Las opciones deben ser plausibles y educativas
- Las explicaciones deben enseñar, no solo justificar
- correctAnswer debe ser 0, 1, 2, o 3 (índice de la opción correcta)

EJEMPLOS DE BUENAS PREGUNTAS:
- "¿Por qué es importante [concepto] en [contexto]?"
- "¿Qué pasaría si [situación] sin [concepto]?"
- "¿Cuál es la diferencia entre [A] y [B]?"
- "¿En qué situación usarías [técnica]?"

NO incluyas:
- Código sin contexto o explicación
- Listas superficiales de características
- Información técnica sin propósito educativo
- Contenido que no construya sobre el anterior`;

  const userPrompt = `Módulo: "${moduleTitle}" (${moduleOrder}/${totalModules})
Curso: ${courseTitle}
Descripción del curso: ${courseDescription}

Crea un módulo educativo que siga principios de aprendizaje humano real. Considera que este es el módulo ${moduleOrder} de ${totalModules}, por lo que debe construir sobre conocimientos previos y preparar para los siguientes.

El contenido debe:
- Tener un hilo narrativo coherente
- Ser apropiado para el nivel del curso
- Enseñar conceptos, no solo mostrar código
- Conectar con situaciones reales
- Progresar naturalmente de lo simple a lo complejo

Genera 6 chunks educativos que formen una historia de aprendizaje completa y un quiz de 7 preguntas que evalúen comprensión real.`;

  return askClaude({ system: systemPrompt, user: userPrompt });
}
