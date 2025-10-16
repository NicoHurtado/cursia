/**
 * Parser de JSON Robusto
 * Limpia y parsea JSON malformado de la IA
 */

/**
 * Limpia y parsea JSON de la IA con múltiples estrategias
 */
export function parseAIJsonRobust(jsonString: string): any {
  // Estrategia 1: Limpieza básica
  let cleaned = cleanBasicJson(jsonString);
  
  const strategies = [
    // Estrategia 1: Parse directo
    () => JSON.parse(cleaned),
    
    // Estrategia 2: Eliminar markdown code blocks
    () => {
      const withoutMarkdown = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      return JSON.parse(withoutMarkdown);
    },
    
    // Estrategia 3: Extraer entre llaves
    () => {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object found');
      return JSON.parse(match[0]);
    },
    
    // Estrategia 4: Reparar comillas
    () => {
      const fixed = fixQuotes(cleaned);
      return JSON.parse(fixed);
    },
    
    // Estrategia 5: Reparar arrays
    () => {
      const fixed = fixArrays(cleaned);
      return JSON.parse(fixed);
    },
    
    // Estrategia 6: Reparar todo
    () => {
      let fixed = cleaned;
      fixed = fixQuotes(fixed);
      fixed = fixArrays(fixed);
      fixed = fixTrailingCommas(fixed);
      fixed = fixUnescapedCharacters(fixed);
      return JSON.parse(fixed);
    },
    
    // Estrategia 7: Truncar y parsear
    () => {
      // Buscar el último cierre de objeto válido
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace === -1) throw new Error('No closing brace found');
      const truncated = cleaned.substring(0, lastBrace + 1);
      let fixed = fixQuotes(truncated);
      fixed = fixArrays(fixed);
      fixed = fixTrailingCommas(fixed);
      return JSON.parse(fixed);
    },
    
    // Estrategia 8: Reparar strings sin terminar y completar JSON
    () => {
      console.log('🔧 Attempting to repair unterminated strings...');
      let fixed = fixUnterminatedStrings(cleaned);
      fixed = fixQuotes(fixed);
      fixed = fixArrays(fixed);
      fixed = fixTrailingCommas(fixed);
      return JSON.parse(fixed);
    },
    
    // Estrategia 9: Completar JSON truncado automáticamente
    () => {
      console.log('🔧 Attempting to complete truncated JSON...');
      let completed = completeTruncatedJson(cleaned);
      completed = fixQuotes(completed);
      completed = fixArrays(completed);
      completed = fixTrailingCommas(completed);
      return JSON.parse(completed);
    },
    
    // Estrategia 10: Reparar comas faltantes entre propiedades
    () => {
      console.log('🔧 Attempting to fix missing commas...');
      let fixed = fixMissingCommas(cleaned);
      fixed = fixQuotes(fixed);
      fixed = fixArrays(fixed);
      fixed = fixTrailingCommas(fixed);
      return JSON.parse(fixed);
    }
  ];
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`🔄 Trying JSON parse strategy ${i + 1}/${strategies.length}...`);
      const result = strategies[i]();
      console.log(`✅ JSON parsed successfully with strategy ${i + 1}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ Strategy ${i + 1} failed: ${lastError.message}`);
    }
  }
  
  // Si todas las estrategias fallan, lanzar error con detalles
  console.error('❌ All JSON parsing strategies failed');
  console.error('Last error:', lastError?.message);
  console.error('JSON preview (first 500 chars):', cleaned.substring(0, 500));
  console.error('JSON preview (last 500 chars):', cleaned.substring(Math.max(0, cleaned.length - 500)));
  
  throw new Error(`Failed to parse JSON after ${strategies.length} attempts: ${lastError?.message}`);
}

/**
 * Limpieza básica del JSON
 */
function cleanBasicJson(jsonString: string): string {
  let cleaned = jsonString.trim();
  
  // Eliminar texto antes del primer {
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) {
    cleaned = cleaned.substring(firstBrace);
  }
  
  // Normalizar comillas smart a comillas normales
  cleaned = cleaned
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
  
  // Eliminar TODOS los caracteres de control excepto espacios normales
  // Esto incluye \n, \r, \t dentro de strings JSON (que deben estar escapados)
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
    const code = char.charCodeAt(0);
    // Preservar solo espacios, tabs y newlines FUERA de strings
    if (code === 0x09 || code === 0x0A || code === 0x0D) {
      return ' '; // Reemplazar con espacio
    }
    return ''; // Eliminar otros caracteres de control
  });
  
  return cleaned;
}

/**
 * Repara comillas en el JSON
 */
function fixQuotes(jsonString: string): string {
  let fixed = jsonString;
  
  // Escapar comillas dobles dentro de strings
  // Patrón: "text": "value with "quotes" inside"
  fixed = fixed.replace(
    /"([^"]*)":\s*"([^"]*)"/g,
    (match, key, value) => {
      // Escapar comillas dobles dentro del valor
      const escapedValue = value.replace(/(?<!\\)"/g, '\\"');
      return `"${key}": "${escapedValue}"`;
    }
  );
  
  return fixed;
}

/**
 * Repara arrays malformados
 */
function fixArrays(jsonString: string): string {
  let fixed = jsonString;
  
  // Eliminar comas antes de ]
  fixed = fixed.replace(/,(\s*])/g, '$1');
  
  // Eliminar comas antes de }
  fixed = fixed.replace(/,(\s*})/g, '$1');
  
  return fixed;
}

/**
 * Elimina comas finales en arrays y objetos
 */
function fixTrailingCommas(jsonString: string): string {
  let fixed = jsonString;
  
  // Eliminar comas finales antes de ] o }
  fixed = fixed.replace(/,(\s*[\]}])/g, '$1');
  
  return fixed;
}

/**
 * Escapa caracteres especiales no escapados
 */
function fixUnescapedCharacters(jsonString: string): string {
  let fixed = jsonString;
  
  // Escapar backslashes no escapados
  // Esto es complicado, hacerlo con cuidado
  fixed = fixed.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  
  return fixed;
}

/**
 * Extrae el JSON más grande y válido del string
 */
export function extractBestJson(text: string): string {
  // Buscar todas las posibles secciones JSON
  const jsonCandidates: string[] = [];
  
  let braceCount = 0;
  let startIndex = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        jsonCandidates.push(text.substring(startIndex, i + 1));
        startIndex = -1;
      }
    }
  }
  
  // Retornar el JSON más largo (probablemente el completo)
  if (jsonCandidates.length === 0) {
    throw new Error('No JSON objects found in text');
  }
  
  return jsonCandidates.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );
}

/**
 * Verifica si un string es JSON válido
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Repara comas faltantes entre propiedades/objetos/arrays
 */
function fixMissingCommas(jsonString: string): string {
  let fixed = jsonString;
  
  // Patrones comunes de comas faltantes:
  
  // 1. Entre dos propiedades: "value" "key": → "value", "key":
  fixed = fixed.replace(/("\s*)\s+"/g, '$1, "');
  
  // 2. Entre objetos: } { → }, {
  fixed = fixed.replace(/}\s*{/g, '}, {');
  
  // 3. Entre array y objeto: ] { → ], {
  fixed = fixed.replace(/]\s*{/g, '], {');
  
  // 4. Entre objeto y array: } [ → }, [
  fixed = fixed.replace(/}\s*\[/g, '}, [');
  
  // 5. Entre valores de array: ] [ → ], [
  fixed = fixed.replace(/]\s*\[/g, '], [');
  
  // 6. Entre string y objeto en array: "value" { → "value", {
  fixed = fixed.replace(/"(\s*){/g, '", {');
  
  // 7. Entre número y string: 123 "key" → 123, "key"
  fixed = fixed.replace(/(\d)(\s*)"(\w+)":/g, '$1, "$3":');
  
  // 8. Entre true/false/null y siguiente propiedad
  fixed = fixed.replace(/(true|false|null)(\s*)"(\w+)":/g, '$1, "$3":');
  
  return fixed;
}

/**
 * Repara strings sin terminar en JSON
 */
function fixUnterminatedStrings(jsonString: string): string {
  let fixed = jsonString;
  
  // Encontrar strings sin cerrar
  let inString = false;
  let lastQuoteIndex = -1;
  let openBraces = 0;
  let openBrackets = 0;
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    const prevChar = i > 0 ? fixed[i - 1] : '';
    
    // Skip escaped quotes
    if (char === '"' && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        lastQuoteIndex = i;
      } else {
        inString = false;
      }
    } else if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
  }
  
  // Si terminamos con un string abierto, cerrarlo
  if (inString && lastQuoteIndex !== -1) {
    console.log('🔧 Closing unterminated string...');
    fixed = fixed + '"';
  }
  
  return fixed;
}

/**
 * Completa JSON truncado agregando los cierres faltantes
 */
function completeTruncatedJson(jsonString: string): string {
  let completed = jsonString;
  
  // Primero, cerrar cualquier string abierto
  completed = fixUnterminatedStrings(completed);
  
  // Contar llaves y corchetes abiertos
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  
  for (let i = 0; i < completed.length; i++) {
    const char = completed[i];
    const prevChar = i > 0 ? completed[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
  }
  
  console.log(`🔧 Open braces: ${openBraces}, open brackets: ${openBrackets}`);
  
  // Cerrar arrays primero, luego objetos
  for (let i = 0; i < openBrackets; i++) {
    console.log('🔧 Adding missing ]');
    completed += ']';
  }
  
  for (let i = 0; i < openBraces; i++) {
    console.log('🔧 Adding missing }');
    completed += '}';
  }
  
  return completed;
}

/**
 * Repara un ContentDocument malformado
 */
export function repairContentDocument(doc: any): any {
  // Asegurar estructura mínima
  if (!doc.version) doc.version = '1.0';
  if (!doc.locale) doc.locale = 'es';
  if (!doc.content_id) doc.content_id = `doc_${Date.now()}`;
  
  // Asegurar meta
  if (!doc.meta) {
    doc.meta = {
      topic: 'Lección',
      audience: 'Estudiantes',
      level: 'beginner',
      created_at: new Date().toISOString().split('T')[0]
    };
  }
  
  // Asegurar blocks es un array
  if (!Array.isArray(doc.blocks)) {
    doc.blocks = [];
  }
  
  // Limpiar blocks malformados
  doc.blocks = doc.blocks.filter((block: any) => {
    return block && 
           typeof block === 'object' && 
           block.type && 
           block.data;
  });
  
  // Asegurar IDs únicos (y arreglar duplicados)
  const usedIds = new Set<string>();
  doc.blocks.forEach((block: any, index: number) => {
    if (!block.id || usedIds.has(block.id)) {
      // Generar ID único con timestamp + random + index
      block.id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
    }
    usedIds.add(block.id);
  });
  
  return doc;
}

