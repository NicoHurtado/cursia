/**
 * Central Markdown rendering policies used by Cursia.
 * These rules are referenced by AI prompts to ensure the content renders
 * exactly as our frontend expects (GitHub Flavored Markdown).
 */

export const MARKDOWN_RENDERING_POLICIES = `
SISTEMA DE ETIQUETADO ESTRUCTURADO PARA CURSIA:

OBLIGATORIO: Usa las siguientes etiquetas para marcar cada tipo de contenido:

1) TÍTULOS (ETIQUETAS OBLIGATORIAS)
- [TITLE] Título principal de la lección
- [SUBTITLE] Subtítulo de sección principal  
- [HEADING] Título de subsección
- [SUBHEADING] Título de punto específico

2) CONTENIDO DE TEXTO
- [PARAGRAPH] Párrafo de texto normal
- [INTRO] Párrafo de introducción (estilo especial)
- [CONCLUSION] Párrafo de conclusión (estilo especial)
- [EXPLANATION] Párrafo explicativo (estilo especial)

3) LISTAS (ETIQUETAS OBLIGATORIAS)
- [BULLET_LIST] Lista con viñetas
- [NUMBERED_LIST] Lista numerada
- [FEATURE_LIST] Lista de características
- [STEP_LIST] Lista de pasos
- [BENEFIT_LIST] Lista de beneficios

4) CÓDIGO (ETIQUETAS OBLIGATORIAS)
- [CODE_BLOCK] Bloque de código completo
- [INLINE_CODE] Código inline
- [PYTHON_CODE] Código Python específico
- [JAVASCRIPT_CODE] Código JavaScript específico
- [SQL_CODE] Código SQL específico

5) CITAS Y NOTAS (ETIQUETAS OBLIGATORIAS)
- [QUOTE] Cita o blockquote
- [TIP] Consejo práctico
- [WARNING] Advertencia importante
- [NOTE] Nota informativa
- [KEY_CONCEPT] Concepto clave

6) TABLAS (ETIQUETAS OBLIGATORIAS)
- [COMPARISON_TABLE] Tabla de comparación
- [DATA_TABLE] Tabla de datos
- [SPECIFICATION_TABLE] Tabla de especificaciones

7) ELEMENTOS ESPECIALES
- [SEPARATOR] Separador visual
- [HIGHLIGHT] Texto destacado
- [EMPHASIS] Texto con énfasis
- [LINK] Enlace externo

FORMATO DE USO:

[TITLE] Fundamentos de NumPy para Análisis Financiero

[SUBTITLE] La Importancia de los Arrays Multidimensionales

[PARAGRAPH] En el análisis financiero, trabajamos constantemente con matrices de datos: precios históricos, rendimientos, correlaciones entre activos. NumPy proporciona la estructura perfecta para estos datos: el array multidimensional.

[KEY_CONCEPT] La vectorización no solo hace el código más rápido, sino también más legible y menos propenso a errores.

[FEATURE_LIST]
- Procesamiento ultra-rápido de datos
- Operaciones vectorizadas eficientes
- Integración perfecta con Pandas
- Soporte para arrays multidimensionales

[CODE_BLOCK]
\`\`\`python
# Ejemplo de cálculo vectorizado
import numpy as np

# Crear array de precios
precios = np.array([[100, 102, 105], [200, 198, 201]])

# Calcular rendimientos
rendimientos = (precios[:, 1:] - precios[:, :-1]) / precios[:, :-1]
print(rendimientos)
\`\`\`

[COMPARISON_TABLE]
| Método | Velocidad | Legibilidad | Uso de Memoria |
| --- | --- | --- | --- |
| Iterativo | Lento | Baja | Alta |
| Vectorizado | Rápido | Alta | Baja |

[TIP] Siempre usa operaciones vectorizadas de NumPy en lugar de bucles cuando trabajes con datos financieros.

REGLAS CRÍTICAS:
1. SIEMPRE etiqueta cada elemento de contenido
2. Usa UNA etiqueta por línea
3. La etiqueta debe estar al inicio de la línea
4. Después de la etiqueta, deja un espacio y el contenido
5. NO mezcles etiquetas en la misma línea
6. Usa las etiquetas específicas para cada tipo de contenido

ESTRUCTURA OBLIGATORIA POR CHUNK:
[TITLE] Título del Chunk
[SUBTITLE] Introducción al Concepto
[PARAGRAPH] Explicación inicial...
[HEADING] ¿Por qué es importante?
[EXPLANATION] Explicación detallada...
[FEATURE_LIST]
- Característica 1
- Característica 2
- Característica 3
[HEADING] Ejemplos Prácticos
[PYTHON_CODE]
# Código de ejemplo
print("Hello World")
[TIP] Consejo importante...
[CONCLUSION] Resumen del chunk...

EJEMPLO COMPLETO DE USO:

[TITLE] Fundamentos de NumPy para Análisis Financiero

[SUBTITLE] La Importancia de los Arrays Multidimensionales

[INTRO] En el análisis financiero, trabajamos constantemente con matrices de datos: precios históricos, rendimientos, correlaciones entre activos.

[PARAGRAPH] NumPy proporciona la estructura perfecta para estos datos: el array multidimensional. A diferencia de las listas de Python, los arrays de NumPy están optimizados para operaciones matemáticas y ocupan menos memoria.

[HEADING] ¿Por qué es importante?

[EXPLANATION] La vectorización no solo hace el código más rápido, sino también más legible y menos propenso a errores. Cuando trabajas con datos financieros, cada milisegundo cuenta.

[FEATURE_LIST]
- Procesamiento ultra-rápido de datos
- Operaciones vectorizadas eficientes
- Integración perfecta con Pandas
- Soporte para arrays multidimensionales

[HEADING] Ejemplo Práctico

[PARAGRAPH] Veamos cómo calcular rendimientos de múltiples activos de forma vectorizada:

[PYTHON_CODE]
import numpy as np

# Crear array de precios (3 activos, 5 días)
precios = np.array([
    [100, 102, 105, 103, 108],  # Activo A
    [50, 51, 49, 52, 53],       # Activo B
    [200, 198, 201, 205, 203]   # Activo C
])

# Calcular rendimientos diarios
rendimientos = (precios[:, 1:] - precios[:, :-1]) / precios[:, :-1]
print(rendimientos)
[TIP] Siempre usa operaciones vectorizadas de NumPy en lugar de bucles cuando trabajes con datos financieros.

[COMPARISON_TABLE]
| Método | Velocidad | Legibilidad | Uso de Memoria |
| --- | --- | --- | --- |
| Iterativo | Lento | Baja | Alta |
| Vectorizado | Rápido | Alta | Baja |

[CONCLUSION] Los arrays de NumPy son fundamentales para el análisis financiero eficiente. Su capacidad de vectorización permite procesar grandes volúmenes de datos de manera rápida y elegante.
`;
