# Sistema de Contenido Estructurado - Cursia

## 🎯 Objetivo

El Sistema de Contenido Estructurado asegura que la IA genere contenido perfectamente organizado y que el frontend lo renderice de manera consistente, independientemente del tipo de contenido (títulos, párrafos, listas, código, tablas, etc.).

## 🏗️ Arquitectura

### 1. **Generación de Contenido (IA)**

- La IA usa un sistema de etiquetas estructurado para marcar cada tipo de contenido
- Cada elemento tiene una etiqueta específica que define su tipo y propósito
- El contenido se genera siguiendo reglas estrictas de formato

### 2. **Procesamiento (ContentParser)**

- Parsea el contenido etiquetado y lo convierte en elementos estructurados
- Maneja diferentes tipos de contenido (títulos, listas, código, etc.)
- Convierte el contenido estructurado a markdown para renderizado

### 3. **Renderizado (Frontend)**

- `StructuredContentRenderer`: Renderiza contenido etiquetado con componentes específicos
- `ContractRenderer`: Renderer principal para ContentDocument JSON
- Cada tipo de contenido tiene su propio componente visual

## 🏷️ Sistema de Etiquetas

### Títulos

- `[TITLE]` - Título principal del chunk
- `[SUBTITLE]` - Subtítulo de sección
- `[HEADING]` - Título de subsección
- `[SUBHEADING]` - Título de punto específico

### Contenido de Texto

- `[PARAGRAPH]` - Párrafo normal
- `[INTRO]` - Párrafo de introducción
- `[EXPLANATION]` - Párrafo explicativo
- `[CONCLUSION]` - Párrafo de conclusión

### Listas

- `[FEATURE_LIST]` - Lista de características
- `[BENEFIT_LIST]` - Lista de beneficios
- `[STEP_LIST]` - Lista de pasos
- `[BULLET_LIST]` - Lista con viñetas
- `[NUMBERED_LIST]` - Lista numerada

### Código

- `[PYTHON_CODE]` - Código Python
- `[JAVASCRIPT_CODE]` - Código JavaScript
- `[SQL_CODE]` - Código SQL
- `[CODE_BLOCK]` - Bloque de código genérico

### Notas y Consejos

- `[TIP]` - Consejo práctico
- `[WARNING]` - Advertencia
- `[NOTE]` - Nota informativa
- `[KEY_CONCEPT]` - Concepto clave
- `[QUOTE]` - Cita o referencia

### Tablas

- `[COMPARISON_TABLE]` - Tabla de comparación
- `[DATA_TABLE]` - Tabla de datos
- `[SPECIFICATION_TABLE]` - Tabla de especificaciones

## 📝 Formato de Uso

### Ejemplo Completo

```
[TITLE] Fundamentos de NumPy para Análisis Financiero

[SUBTITLE] La Importancia de los Arrays Multidimensionales

[INTRO] En el análisis financiero, trabajamos constantemente con matrices de datos.

[PARAGRAPH] NumPy proporciona la estructura perfecta para estos datos.

[HEADING] ¿Por qué es importante?

[EXPLANATION] La vectorización no solo hace el código más rápido, sino también más legible.

[FEATURE_LIST]
- Procesamiento ultra-rápido de datos
- Operaciones vectorizadas eficientes
- Integración perfecta con Pandas

[HEADING] Ejemplo Práctico

[PARAGRAPH] Veamos cómo calcular rendimientos:

[PYTHON_CODE]
import numpy as np
precios = np.array([100, 102, 105])
rendimientos = (precios[1:] - precios[:-1]) / precios[:-1]

[TIP] Siempre usa operaciones vectorizadas de NumPy.

[COMPARISON_TABLE]
| Método | Velocidad |
| --- | --- |
| Iterativo | Lento |
| Vectorizado | Rápido |

[CONCLUSION] Los arrays de NumPy son fundamentales para el análisis financiero.
```

## 🔧 Reglas Críticas

1. **SIEMPRE etiqueta cada elemento de contenido**
2. **Usa UNA etiqueta por línea al inicio**
3. **Después de la etiqueta, deja un espacio y el contenido**
4. **NO mezcles etiquetas en la misma línea**
5. **Para listas, usa la etiqueta en una línea y cada elemento en líneas separadas con - o números**
6. **Para código, NO uses backticks, solo pon el código directamente**
7. **Para tablas, incluye el formato markdown completo**
8. **Cada elemento debe estar en su propia línea con su etiqueta correspondiente**

## 🎨 Renderizado Visual

### Títulos

- `[TITLE]` → H1 con gradiente y borde inferior
- `[SUBTITLE]` → H2 con borde lateral y fondo degradado
- `[HEADING]` → H3 con punto decorativo
- `[SUBHEADING]` → H4 con borde inferior

### Listas

- `[FEATURE_LIST]` → Lista con viñetas azules
- `[NUMBERED_LIST]` → Lista numerada con círculos azules
- `[BULLET_LIST]` → Lista simple con puntos

### Código

- `[PYTHON_CODE]` → Bloque de código con sintaxis highlighting
- `[JAVASCRIPT_CODE]` → Bloque de código JavaScript
- `[SQL_CODE]` → Bloque de código SQL
- Todos incluyen botón de copia

### Notas y Consejos

- `[TIP]` → Caja azul con ícono de bombilla
- `[WARNING]` → Caja amarilla con ícono de advertencia
- `[NOTE]` → Caja azul con ícono de información
- `[KEY_CONCEPT]` → Caja púrpura con ícono de libro

### Tablas

- Todas las tablas se renderizan con estilos consistentes
- Bordes redondeados y sombras
- Hover effects en las filas

## 🔄 Flujo de Procesamiento

1. **IA genera contenido** con etiquetas estructuradas
2. **ContentParser** detecta y parsea las etiquetas
3. **StructuredContentRenderer** renderiza cada elemento con su componente específico
4. **Fallback** a texto plano para contenido no estructurado

## 🧪 Testing

El sistema incluye tests automáticos que verifican:

- ✅ Parsing de contenido etiquetado
- ✅ Conversión a markdown
- ✅ Detección de contenido legacy vs estructurado
- ✅ Renderizado de todos los tipos de elementos

## 🚀 Beneficios

1. **Consistencia Visual**: Todos los elementos se renderizan de manera uniforme
2. **Flexibilidad**: Fácil agregar nuevos tipos de contenido
3. **Mantenibilidad**: Código organizado y fácil de mantener
4. **Escalabilidad**: Sistema preparado para futuras expansiones
5. **Experiencia de Usuario**: Contenido siempre bien formateado

## 📋 Próximos Pasos

- [ ] Agregar más tipos de contenido (diagramas, imágenes, etc.)
- [ ] Implementar tema oscuro específico para cada elemento
- [ ] Agregar animaciones y transiciones
- [ ] Optimizar rendimiento para contenido largo
- [ ] Agregar soporte para contenido interactivo
