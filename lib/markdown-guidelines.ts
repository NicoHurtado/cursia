/**
 * Central Markdown rendering policies used by Cursia.
 * These rules are referenced by AI prompts to ensure the content renders
 * exactly as our frontend expects (GitHub Flavored Markdown).
 */

export const MARKDOWN_RENDERING_POLICIES = `
REGLAS DE MARKDOWN (ESTRICTO, ESTILO GITHUB):

1) Títulos
- Usa # H1, ## H2, ### H3 según corresponda
- Siempre deja una línea en blanco ANTES y DESPUÉS de un título

2) Párrafos y saltos de línea
- Separa párrafos con una línea en blanco
- No pegues títulos y párrafos en la misma línea

3) Listas
- Viñetas: empieza líneas con "- " (guion + espacio)
- Numeradas: "1. ", "2. ", etc.
- Anidación: indenta 2 espacios por nivel

4) Código
- Bloques: usa fences con lenguaje, por ejemplo:
\n\n\`\`\`ts\nconst x: number = 1\n\`\`\`\n\n
- Inline: usa \`codigo\`

5) Citas
- Usa "> " al inicio de la línea para blockquotes

6) Enlaces e Imágenes
- Enlace: [texto](https://ejemplo.com)
- Imagen: ![alt](https://img)
- Provee texto alternativo claro

7) Tablas (GFM)
- Usa pipes y cabecera con separadores: | Col 1 | Col 2 |\n| --- | --- |

8) Checklists (GFM)
- Usa "- [ ] item" o "- [x] item"

9) Prohibido
- No mezclar múltiples elementos en una sola línea (p. ej. título + párrafo)
- No usar HTML bruto para dar formato

Referencia de atajos y sintaxis: https://www.coursera.org/resources/markdown-cheat-sheet
`;


