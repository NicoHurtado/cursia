# 🚀 Inicio Rápido - Validación de Contenido

## Lo que necesitas saber en 2 minutos

### ✅ Problema resuelto

Tu problema: **Lecciones que repiten temas y contenido superficial**

Mi solución: **Sistema que detecta repeticiones y regenera automáticamente**

### 📁 Archivos creados

1. **`lib/content-topic-validator.ts`** - Detecta repeticiones y profundidad
2. **`lib/ai/lesson-generator-with-validation.ts`** - Genera con validación automática
3. **`lib/ai/content-contract-prompts.ts`** - Prompts mejorados (actualizado)
4. **`lib/ai/integration-example.ts`** - Ejemplos listos para copiar
5. **`docs/content-validation-guide.md`** - Documentación completa
6. **`scripts/test-content-validation.ts`** - Script de prueba

### 🧪 Probar ahora (1 minuto)

```bash
cd cursia
npx tsx scripts/test-content-validation.ts
```

Verás:

- ✅ Detección de repeticiones funcionando
- ✅ Validación de profundidad funcionando
- ✅ Sugerencias automáticas

### 💻 Usar en tu código (2 minutos)

**Opción A: Función completa** (copia y pega)

```typescript
// En tu archivo de generación de módulos
import { generateLessonsWithValidation } from '@/lib/ai/lesson-generator-with-validation';

const result = await generateLessonsWithValidation({
  moduleTitle: 'Nombre del Módulo',
  courseTopic: 'Nombre del Curso',
  level: 'intermediate',
  totalLessons: 5,
  maxAttempts: 2,
  interests: ['interés1', 'interés2'],
});

// Usar result.lessons para guardar en DB
for (const lesson of result.lessons) {
  await db.chunk.create({
    data: {
      moduleId: module.id,
      content: JSON.stringify(lesson),
      // ... otros campos
    },
  });
}
```

**Opción B: Ejemplo completo** (incluye validación de unidades)

Abre **`lib/ai/integration-example.ts`** y copia la función `generateModuleForAPI`.

### 🎯 Qué hace automáticamente

1. **Valida** el número de unidades según complejidad
2. **Genera** lecciones con títulos progresivos
3. **Detecta** si hay temas repetidos
4. **Analiza** si el contenido es superficial
5. **Regenera** automáticamente si encuentra problemas
6. **Retorna** lecciones validadas

### ⚙️ Configuración

```typescript
{
  maxAttempts: 2,      // Cuántas veces intentar si falla
  totalLessons: 5,     // Se ajusta automáticamente
  minBlocksPerLesson: 10  // Mínimo para ser profundo
}
```

### 📊 Ejemplo de output

```
🔍 Validando temas del módulo: Arrays en JavaScript
📚 Total de lecciones a validar: 5

📄 Lección 1: Fundamentos de Arrays
   - Temas principales: 2
   - Subtemas: 4
   - Keywords: 8

✅ Validación completada:
   - Temas únicos: 5
   - Repeticiones: 0
   - Profundidad: deep
   - Es válido: SÍ
```

### ❗ Si hay problemas

```
⚠️ Tema repetido: "qué son los arrays" en lecciones 1, 3
⚠️ Contenido superficial detectado

🔄 Regenerando lecciones con mejores instrucciones...

✅ Validación exitosa en intento 2
```

### 📚 Documentación completa

- **Lee primero**: `CONTENT_VALIDATION_SUMMARY.md`
- **Documentación**: `docs/content-validation-guide.md`
- **Ejemplos**: `lib/ai/integration-example.ts`

### 🎉 ¡Eso es todo!

El sistema está listo. Solo:

1. Prueba con el script
2. Copia el código en tu API
3. Disfruta contenido sin repeticiones

---

**¿Dudas?** Lee `CONTENT_VALIDATION_SUMMARY.md` para más detalles.
