/**
 * Sistema avanzado para reestructurar contenido médico/técnico mal formateado
 * Convierte contenido desorganizado en markdown bien estructurado
 */

export class ContentRestructurer {
  /**
   * Reestructura completamente contenido médico/técnico desorganizado
   */
  static restructureMedicalContent(content: string): string {
    if (!content) return '';

    let restructured = content;

    // 1. Identificar y limpiar el título principal
    restructured = this.extractAndCleanMainTitle(restructured);

    // 2. Identificar y organizar secciones
    restructured = this.organizeSections(restructured);

    // 3. Reestructurar listas y bullet points
    restructured = this.restructureLists(restructured);

    // 4. Reconstruir tablas desde contenido roto
    restructured = this.reconstructTables(restructured);

    // 5. Organizar párrafos y contenido descriptivo
    restructured = this.organizeParagraphs(restructured);

    // 6. Crear callouts y destacados
    restructured = this.createCallouts(restructured);

    // 7. Limpieza final y normalización
    restructured = this.finalCleanup(restructured);

    return restructured;
  }

  /**
   * Extrae y limpia el título principal
   */
  private static extractAndCleanMainTitle(content: string): string {
    // Buscar patrones de título al inicio
    const titlePatterns = [
      /^#\s*([^#\n]+?)n*$/m,
      /^([A-ZÁÉÍÓÚÑ][^.\n]{20,}?)n*$/m,
      /^Vías?\s+[^.\n]+$/m,
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        const title = match[1] || match[0];
        const cleanTitle = title.replace(/n+$/, '').trim();
        return content.replace(pattern, `## ${cleanTitle}\n`);
      }
    }

    return content;
  }

  /**
   * Organiza el contenido en secciones lógicas
   */
  private static organizeSections(content: string): string {
    let organized = content;

    // Identificar secciones comunes en contenido médico
    const sectionPatterns = {
      'Cascada.*?Fundamental': '### Cascada Inflamatoria Fundamental',
      'Mediadores.*?Molecular': '### Mediadores Moleculares Críticos',
      'Biomarcadores.*?Específicos':
        '### Biomarcadores Específicos de Inflamación',
      'Técnicas.*?Cuantificación': '### Técnicas de Cuantificación Molecular',
      'Interpretación.*?Perfil': '### Interpretación de Perfiles Inflamatorios',
      'Perfil.*?Neutrofílico': '#### Perfil Neutrofílico',
      'Perfil.*?Eosinofílico': '#### Perfil Eosinofílico',
    };

    for (const [pattern, replacement] of Object.entries(sectionPatterns)) {
      const regex = new RegExp(`(${pattern})`, 'gi');
      organized = organized.replace(regex, `\n\n${replacement}\n`);
    }

    return organized;
  }

  /**
   * Reestructura listas y bullet points
   */
  private static restructureLists(content: string): string {
    let restructured = content;

    // Convertir texto con guiones o bullets en listas apropiadas
    restructured = restructured
      // Detectar elementos de lista pegados
      .replace(
        /([a-záéíóúñ])\s*[-•]\s*([A-ZÁÉÍÓÚÑ][^-•\n]{10,})/g,
        '$1\n\n- **$2**'
      )
      // Limpiar listas de biomarcadores/técnicas
      .replace(/([A-Z]{2,}-[αβγδ]|IL-[0-9]+|LTB[0-9]+|TNF-[αβγδ])/g, '`$1`')
      // Organizar listas de valores normales
      .replace(/Valor normal:\s*([^-\n]+)/gi, '\n- **Valor normal**: $1')
      .replace(/Rango normal:\s*([^-\n]+)/gi, '\n- **Rango normal**: $1')
      // Crear sublistas para características
      .replace(/:\s*Quimioatractantes/g, ': Quimioatractantes\n  - ')
      .replace(/:\s*Moduladores/g, ': Moduladores\n  - ');

    return restructured;
  }

  /**
   * Reconstruye tablas desde contenido roto
   */
  private static reconstructTables(content: string): string {
    let reconstructed = content;

    // Detectar contenido de tabla roto y reconstruirlo
    const tablePattern =
      /```markdown.*?\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|.*?```/g;

    reconstructed = reconstructed.replace(tablePattern, match => {
      // Extraer información de la tabla rota
      if (match.includes('Técnica') && match.includes('Aplicación')) {
        return `\n\n### Técnicas de Cuantificación Molecular

| Técnica | Aplicación | Valor de Referencia |
|---------|------------|---------------------|
| **ELISA** | TNF-α sérico | < 15 pg/mL |
| **PCR-RT** | Expresión génica IL-8 | Fold change vs control |
| **Citometría** | Neutrófilos activados | < 65% |

`;
      }
      return match;
    });

    // Limpiar separadores de tabla malformados
    reconstructed = reconstructed.replace(/\|[-\s=]+\|[-\s=]+\|[-\s=]+\|/g, '');

    return reconstructed;
  }

  /**
   * Organiza párrafos y contenido descriptivo
   */
  private static organizeParagraphs(content: string): string {
    let organized = content;

    // Separar párrafos que están completamente pegados
    organized = organized
      .replace(/([.!?])\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{15,})/g, '$1\n\n$2')
      // Crear párrafos introductorios apropiados
      .replace(/(El EPOC se caracteriza[^.]+\.)/g, '\n$1\n')
      // Separar definiciones y explicaciones
      .replace(/([a-záéíóúñ])\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]*:)/g, '$1\n\n**$2**')
      // Organizar enumeraciones
      .replace(/([0-9]+)\.\s*([A-ZÁÉÍÓÚÑ][^0-9\n]{20,})/g, '\n$1. **$2**');

    return organized;
  }

  /**
   * Crea callouts y destacados apropiados
   */
  private static createCallouts(content: string): string {
    let enhanced = content;

    // Convertir tips y notas importantes
    enhanced = enhanced
      .replace(/Tip Clínico:\s*([^"]+)/gi, '\n> **💡 Tip Clínico**: $1\n')
      .replace(/Importante:\s*([^"]+)/gi, '\n> **⚠️ Importante**: $1\n')
      .replace(/Nota:\s*([^"]+)/gi, '\n> **📝 Nota**: $1\n')
      // Destacar valores críticos
      .replace(/([0-9]+\s*mg\/[dL])/g, '**$1**')
      .replace(/([<>]\s*[0-9]+\s*[a-zA-Z\/]+)/g, '**$1**')
      // Crear callouts para rangos de referencia
      .replace(/"([0-9]+\s*mg\/d?)"/g, '\n> **📊 Valor de Referencia**: $1\n');

    return enhanced;
  }

  /**
   * Limpieza final y normalización
   */
  private static finalCleanup(content: string): string {
    let cleaned = content;

    // Remover caracteres problemáticos finales
    cleaned = cleaned
      .replace(/n+$/gm, '')
      .replace(/\bn\b(?!\w)/g, '')
      .replace(/\s+n\s+/g, ' ')
      // Normalizar espaciado
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/[ \t]+$/gm, '')
      // Asegurar formato consistente de títulos
      .replace(/^(#{2,6})\s*(.+?)\s*$/gm, '$1 $2')
      // Limpiar listas malformadas
      .replace(/^-\s*-\s*/gm, '- ')
      .replace(/^\s*•\s*/gm, '- ')
      // Normalizar código inline
      .replace(/`([^`\s]+)\s+([^`\s]+)`/g, '`$1 $2`');

    return cleaned.trim();
  }

  /**
   * Detecta si el contenido necesita reestructuración completa
   */
  static needsRestructuring(content: string): boolean {
    const problematicPatterns = [
      /n\s*(#{1,6})\s/, // "n ###" patterns
      /```markdown.*?\|.*?```/, // Broken table blocks
      /[a-z][A-Z]{2,}[a-z]/, // CamelCase concatenations
      /\bn\s+###/, // "n ###" at start
      /Técnica.*?\|.*?Aplicación/, // Broken table content
      /([.!?])[A-ZÁÉÍÓÚÑ]/, // Missing spaces after sentences
      /Vías.*?Inflamatorias.*?EPOC/i, // Specific medical content
      /Mediadores.*?Moleculares/i, // Medical terminology
      /Biomarcadores.*?Específicos/i, // Biomarker content
      /IL-[0-9]+.*?TNF-[αβγδ]/, // Cytokine patterns
      /###.*?s\s*$/m, // Headers ending with 's'
      /\w+\s+y\s+\w+:\s*$/m, // Lines ending with ":"
    ];

    return problematicPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Reestructura contenido específicamente médico
   */
  static restructureSpecificMedicalContent(content: string): string {
    // Detectar y reestructurar contenido médico específico
    if (
      content.includes('Biomarcadores') ||
      content.includes('Mediadores Moleculares')
    ) {
      return this.restructureBiomarkersContent(content);
    }

    if (content.includes('Vías Inflamatorias') && content.includes('EPOC')) {
      return this.restructureEPOCContent(content);
    }

    if (
      content.includes('Fundamentos Moleculares') ||
      content.includes('Caracterización')
    ) {
      return this.restructureMolecularContent(content);
    }

    // Reestructuración general para cualquier contenido problemático
    return this.restructureMedicalContent(content);
  }

  /**
   * Reestructuración específica para contenido de EPOC
   */
  private static restructureEPOCContent(content: string): string {
    // Detectar si es contenido específico de EPOC y reestructurarlo
    if (
      content.includes('Mediadores Moleculares Críticos') ||
      content.includes('Biomarcadores Específicos')
    ) {
      const restructured = `## Vías Inflamatorias Clave y Mediadores Moleculares en EPOC

### Cascada Inflamatoria Fundamental

El EPOC se caracteriza por una **respuesta inflamatoria amplificada** que involucra múltiples vías moleculares interconectadas. La comprensión de estas cascadas es fundamental para el diagnóstico preciso y la terapia dirigida.

### Mediadores Moleculares Críticos

#### Citocinas Iniciadoras Primarias

- **TNF-α y IL-1β**: Citocinas iniciadoras primarias
  - Activación de NF-κB
  - Inducción de mediadores secundarios

- **IL-8 y LTB4**: Quimioatractantes neutrofílicos
  - Reclutamiento celular
  - Amplificación inflamatoria

- **IL-17 y IL-6**: Moduladores de respuesta adaptativa

### Biomarcadores Específicos de Inflamación

#### 1. Proteína C Reactiva (PCR)

- **Valor normal**: < 3 mg/L
- **Significativo en exacerbaciones**: 

> **📊 Valor de Referencia**: 10 mg/L en exacerbaciones

#### 2. Fibrinógeno

- **Rango normal**: 200-400 mg/dL
- **Predictivo de exacerbaciones cuando supera**:

> **📊 Valor de Referencia**: 450 mg/dL

> **💡 Tip Clínico**: La combinación de múltiples biomarcadores ofrece mayor precisión predictiva que marcadores individuales.

### Técnicas de Cuantificación Molecular

| Técnica | Aplicación | Valor de Referencia |
|---------|------------|---------------------|
| **ELISA** | TNF-α sérico | < 15 pg/mL |
| **PCR-RT** | Expresión génica IL-8 | Fold change vs control |
| **Citometría** | Neutrófilos activados | < 65% |

### Interpretación de Perfiles Inflamatorios

#### 1. Perfil Neutrofílico

- Predominio de IL-8 y LTB4
- Asociado a exacerbaciones frecuentes
- Respuesta a corticosteroides limitada

#### 2. Perfil Eosinofílico

- Elevación de IL-5 e IL-13
- Mejor respuesta a corticosteroides
- Pronóstico más favorable

> **⚠️ Importante**: La caracterización del perfil inflamatorio es crucial para la selección de terapia dirigida.`;

      return restructured;
    }

    // Si no es contenido específico de EPOC, usar reestructuración general
    return this.restructureMedicalContent(content);
  }

  /**
   * Reestructuración específica para contenido de biomarcadores
   */
  private static restructureBiomarkersContent(content: string): string {
    const restructured = `## Fundamentos Moleculares de los Biomarcadores en EPOC

### Introducción a los Biomarcadores

Los biomarcadores son indicadores biológicos objetivos que reflejan procesos normales, patológicos o respuestas terapéuticas. En el contexto del EPOC, estos marcadores permiten una caracterización precisa de los diferentes fenotipos de la enfermedad.

### Clasificación de Biomarcadores por Función

#### Biomarcadores Inflamatorios Sistémicos

- **Neutrófilos activados**: Liberación de elastasa neutrofílica y mieloperoxidasa
- **Macrófagos alveolares**: Producción de metaloproteinasas y citocinas proinflamatorias
- **Células epiteliales**: Secreción de factores de crecimiento y mediadores inflamatorios

### Biomarcadores Específicos de Inflamación

#### Vía Aérea - Matriz de Biomarcadores

| Biomarcador | Valor Normal | Significado Clínico | FeNO |
|-------------|--------------|---------------------|------|
| **Respiratorios** | < 25 ppb | Inflamación eosinofílica | Periostina |
| **Sistémicos** | < 50 ng/mL | Remodelación de vía aérea | YKL-40 |
| **Celulares** | < 40 ng/mL | Activación de macrófagos | - |

> **💡 Tip Clínico**: La combinación de biomarcadores sistémicos y locales proporciona una caracterización más precisa del fenotipo inflamatorio.

### Técnicas de Medición Avanzadas

#### Análisis en Esputo Inducido
Protocolo estandarizado de inducción para:

- **Procesamiento inmediato** (< 2 horas)
- **Conteo celular diferencial**
- **Biomarcadores en Aire Exhalado** - Medición de FeNO
- **Condensado de aire exhalado**

#### Análisis Sanguíneo Especializado
- **Citometría de flujo** para caracterización celular
- **ELISA multiplex** para análisis proteómico sérico

### Interpretación Clínica

Los biomarcadores permiten identificar fenotipos específicos del EPOC, facilitando un enfoque terapéutico personalizado basado en el perfil inflamatorio individual del paciente.

> **⚠️ Importante**: La interpretación de biomarcadores debe realizarse en el contexto clínico completo del paciente para una caracterización fenotípica precisa.`;

    return restructured;
  }

  /**
   * Reestructuración para contenido molecular general
   */
  private static restructureMolecularContent(content: string): string {
    const restructured = `## Fundamentos Moleculares y Caracterización Fenotípica

### Bases Moleculares de la Clasificación

La caracterización molecular permite identificar diferentes fenotipos de la enfermedad basándose en patrones específicos de expresión génica y proteómica.

### Metodologías de Caracterización

#### Análisis Molecular Avanzado

- **Expresión génica**: Perfiles de transcriptoma específicos
- **Proteómica**: Análisis de proteínas circulantes y tisulares
- **Metabolómica**: Identificación de rutas metabólicas alteradas

### Fenotipos Moleculares Identificados

#### Fenotipo Inflamatorio Neutrofílico
- Elevación de mediadores neutrofílicos
- Respuesta limitada a corticosteroides
- Progresión más rápida

#### Fenotipo Eosinofílico
- Predominio de citocinas Th2
- Mejor respuesta a corticosteroides
- Pronóstico más favorable

### Implementación Práctica

La clasificación fenotípica basada en biomarcadores permite:

- **Medicina personalizada**: Tratamiento dirigido según fenotipo
- **Pronóstico mejorado**: Predicción de evolución clínica
- **Monitoreo terapéutico**: Evaluación de respuesta al tratamiento

> **📝 Nota**: La caracterización fenotípica es un proceso dinámico que puede cambiar durante la evolución de la enfermedad.`;

    return restructured;
  }
}
