# Guía de Validación de Contenido para Cursos

## Descripción General

He implementado un sistema de validación de contenido que detecta automáticamente:

1. **Temas repetidos entre lecciones** - Identifica cuando diferentes lecciones están cubriendo los mismos temas
2. **Contenido superficial** - Detecta cuando las lecciones no profundizan lo suficiente
3. **Número inadecuado de unidades** - Valida que el número de lecciones sea apropiado según la complejidad del tema
4. **Progresión lógica** - Verifica que las lecciones sigan una secuencia coherente

## Componentes Principales

### 1. ContentTopicValidator (`lib/content-topic-validator.ts`)

Validador que analiza el contenido generado y detecta problemas.

#### Métodos principales:

```typescript
// Valida que no haya repetición de temas entre lecciones
ContentTopicValidator.validateModuleLessons(
  lessons: ContentDocument[],
  moduleTitle: string
): TopicValidationResult

// Valida el número apropiado de unidades según complejidad
ContentTopicValidator.validateUnitCount(
  moduleTitle: string,
  unitCount: number,
  courseLevel: string
): { isValid: boolean; suggestedCount: number; reason: string }

// Valida la progresión lógica de las lecciones
ContentTopicValidator.validateLessonProgression(
  lessons: LessonTopicInfo[]
): { isValid: boolean; issues: string[] }
```

### 2. Generador con Validación (`lib/ai/lesson-generator-with-validation.ts`)

Genera lecciones y las valida automáticamente. Si detecta problemas, regenera con instrucciones mejoradas.

```typescript
import { generateLessonsWithValidation } from '@/lib/ai/lesson-generator-with-validation';

const result = await generateLessonsWithValidation({
  moduleTitle: 'Arrays y Estructuras de Datos',
  courseTopic: 'Programación en Python',
  level: 'intermediate',
  totalLessons: 5,
  maxAttempts: 2,
  interests: ['programación', 'datos']
});

// result contiene:
// - lessons: ContentDocument[] - Las lecciones generadas
// - validationResult: TopicValidationResult - Resultado de la validación
// - attemptsMade: number - Número de intentos realizados
// - regenerated: boolean - Si se tuvieron que regenerar las lecciones
```

### 3. Prompts Mejorados (`lib/ai/content-contract-prompts.ts`)

Los prompts ahora incluyen:

- **Advertencias sobre temas repetidos** - Si detecta temas ya cubiertos, advierte a la IA
- **Requisitos de profundidad** - Exige al menos 10-15 bloques y 3-4 secciones H3 por lección
- **Progresión lógica** - Define claramente qué debe cubrir cada lección (básico → avanzado)
- **Elementos visuales obligatorios** - Requiere listas, tablas, callouts, etc.

## Cómo Funciona

### Flujo de Validación

```
1. Generar lecciones
   ↓
2. Extraer temas principales (H2) y subtemas (H3)
   ↓
3. Detectar repeticiones
   ↓
4. Analizar profundidad del contenido
   ↓
5. ¿Es válido?
   ├─ SÍ → Retornar lecciones
   └─ NO → Regenerar con mejores instrucciones (hasta maxAttempts)
```

### Detección de Repeticiones

El sistema extrae:
- **Temas principales** (headings nivel 2)
- **Subtemas** (headings nivel 3)
- **Keywords** de párrafos

Luego compara entre lecciones y detecta:
- Temas que aparecen en múltiples lecciones
- Lecciones con contenido muy similar

### Análisis de Profundidad

Calcula:
- Promedio de subtemas por tema principal
- Promedio de bloques por lección

Clasifica como:
- **Shallow** (superficial): < 2 subtemas por tema, < 4 bloques por lección
- **Moderate** (moderado): 2-3 subtemas por tema, 4-6 bloques por lección
- **Deep** (profundo): ≥ 3 subtemas por tema, ≥ 6 bloques por lección

## Uso en la Generación de Cursos

### Ejemplo de Integración

```typescript
// En tu API de generación de módulos
import { generateLessonsWithValidation } from '@/lib/ai/lesson-generator-with-validation';
import { ContentTopicValidator } from '@/lib/content-topic-validator';

async function generateModule(moduleTitle: string, courseTopic: string, level: string) {
  console.log(`📚 Generando módulo: ${moduleTitle}`);
  
  // 1. Validar número de unidades apropiado
  const unitValidation = ContentTopicValidator.validateUnitCount(
    moduleTitle,
    5,
    level
  );
  
  console.log(`📊 Validación de unidades:`);
  console.log(`   - Es válido: ${unitValidation.isValid ? 'SÍ' : 'NO'}`);
  console.log(`   - Sugerido: ${unitValidation.suggestedCount} unidades`);
  console.log(`   - Razón: ${unitValidation.reason}`);
  
  const totalLessons = unitValidation.suggestedCount;
  
  // 2. Generar lecciones con validación automática
  const result = await generateLessonsWithValidation({
    moduleTitle,
    courseTopic,
    level,
    totalLessons,
    maxAttempts: 2,
    interests: ['tu', 'lista', 'de', 'intereses']
  });
  
  // 3. Revisar resultado
  if (result.validationResult.isValid) {
    console.log(`✅ Lecciones válidas generadas`);
  } else {
    console.log(`⚠️ Lecciones generadas con advertencias:`);
    result.validationResult.suggestions.forEach((s: string) => {
      console.log(`   - ${s}`);
    });
  }
  
  // 4. Guardar en base de datos
  for (let i = 0; i < result.lessons.length; i++) {
    const lesson = result.lessons[i];
    
    await db.chunk.create({
      data: {
        moduleId: module.id,
        chunkOrder: i + 1,
        title: lesson.meta.topic,
        content: JSON.stringify(lesson),
        videoData: null
      }
    });
  }
  
  console.log(`✅ Módulo completado con ${result.lessons.length} lecciones`);
  if (result.regenerated) {
    console.log(`   (Se regeneró en ${result.attemptsMade} intentos)`);
  }
}
```

## Validación Manual

También puedes validar contenido existente:

```typescript
import { ContentTopicValidator } from '@/lib/content-topic-validator';
import { ContentDocument } from '@/lib/content-contract';

// Obtener lecciones de base de datos
const chunks = await db.chunk.findMany({
  where: { moduleId: 'some-id' },
  orderBy: { chunkOrder: 'asc' }
});

// Parsear a ContentDocument
const lessons: ContentDocument[] = chunks.map(chunk => 
  JSON.parse(chunk.content)
);

// Validar
const validation = ContentTopicValidator.validateModuleLessons(
  lessons,
  'Título del Módulo'
);

if (!validation.isValid) {
  console.log('❌ Problemas detectados:');
  
  if (validation.hasRepetitions) {
    console.log(`\n🔄 Temas repetidos (${validation.repeatedTopics.length}):`);
    validation.repeatedTopics.forEach(topic => {
      console.log(`   - "${topic}"`);
    });
  }
  
  if (validation.needsMoreDepth) {
    console.log(`\n📉 Contenido superficial (profundidad: ${validation.depth})`);
  }
  
  console.log('\n💡 Sugerencias:');
  validation.suggestions.forEach(suggestion => {
    console.log(`   - ${suggestion}`);
  });
}
```

## Criterios de Validación

### Temas Únicos

- ✅ Cada lección debe abordar un aspecto diferente del módulo
- ❌ No repetir el mismo tema en múltiples lecciones
- ✅ Progresión: básico → intermedio → avanzado

### Profundidad

Una lección profunda debe tener:
- **Mínimo 10-15 bloques** de contenido (no solo 8)
- **3-4 secciones H3** que profundicen en el tema principal
- **Párrafos de 80-150 palabras** (no superficiales)
- **Múltiples ejemplos** prácticos por sección
- **Casos de uso** del mundo real
- **Ejercicios** o reflexiones

### Elementos Visuales

Cada lección debe incluir:
- ✅ 2-3 listas (bulleted o numbered)
- ✅ 1-2 callouts (tips, warnings, info)
- ✅ 1-2 highlights con conceptos clave
- ✅ Tablas si el tema lo requiere

### Progresión Lógica

- **Lección 1**: Fundamentos y conceptos básicos
- **Lección 2**: Profundización en conceptos clave con ejemplos
- **Lección 3**: Aplicaciones prácticas y casos de uso
- **Lección 4**: Técnicas avanzadas y mejores prácticas
- **Lección 5**: Integración completa y proyectos

## Número de Unidades Recomendado

El validador sugiere automáticamente el número apropiado de unidades:

### Temas Básicos/Introductorios
- **3-4 unidades**
- Ejemplos: "Introducción a...", "Conceptos básicos de...", "Primeros pasos en..."
- Razón: Cubrir los conceptos esenciales sin abrumar

### Temas de Complejidad Moderada
- **4-5 unidades**
- Mayoría de los temas
- Razón: Cobertura equilibrada con profundidad adecuada

### Temas Complejos/Avanzados
- **5-6 unidades**
- Ejemplos: "Arquitectura avanzada", "Algoritmos complejos", "Machine Learning"
- Razón: Profundidad necesaria para dominar el tema

## Solución de Problemas

### "Detecté X tema(s) repetido(s)"

**Problema**: Múltiples lecciones cubren el mismo tema.

**Solución**: El sistema regenerará automáticamente con instrucciones para evitar esos temas. Si persiste:
1. Aumenta `maxAttempts` a 3
2. Verifica que los títulos de lecciones sean específicos y únicos

### "El contenido es demasiado superficial"

**Problema**: Las lecciones no profundizan lo suficiente.

**Solución**: El sistema ya incluye requisitos de profundidad en los prompts. Si persiste:
1. Revisa que el modelo de IA tenga suficiente contexto
2. Considera usar un modelo más potente (Claude Opus en lugar de Haiku)

### "Solo detecté X tema(s) único(s)"

**Problema**: El módulo tiene muy pocos temas únicos.

**Solución**: 
1. Divide el módulo en aspectos más específicos
2. Usa títulos de lecciones más descriptivos
3. Aumenta el número de lecciones si el tema lo requiere

## Ventajas del Sistema

✅ **Detección automática** de repeticiones y superficialidad
✅ **Regeneración inteligente** con mejores instrucciones
✅ **Validación de profundidad** - Garantiza contenido sustancial
✅ **Sugerencias específicas** para mejorar el contenido
✅ **Número adaptativo** de unidades según complejidad
✅ **Sin intervención manual** - Funciona automáticamente

## Configuración Recomendada

```typescript
const config = {
  // Intentos de generación antes de aceptar resultado
  maxAttempts: 2,
  
  // Número de lecciones (se ajusta automáticamente según complejidad)
  totalLessons: 5,
  
  // Nivel de validación
  strictValidation: true,  // Rechaza contenido superficial
  
  // Logging
  verbose: true  // Mostrar logs detallados de validación
};
```

## Próximos Pasos

Para usar este sistema en tu generación de cursos:

1. Importa las funciones en tu API de generación
2. Reemplaza la generación directa con `generateLessonsWithValidation`
3. Valida el conteo de unidades con `validateUnitCount` antes de generar
4. Revisa los logs para ver si hubo regeneraciones

El sistema funcionará automáticamente y solo regenerará cuando detecte problemas, sin necesidad de intervención manual.

