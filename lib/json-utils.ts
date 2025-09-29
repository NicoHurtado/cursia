/**
 * Clean and normalize JSON string before parsing
 */
function cleanJsonString(jsonString: string): string {
  if (!jsonString) return '[]';

  // Remove any leading/trailing whitespace
  let cleaned = jsonString.trim();

  // If it's not an array or object, wrap it in an array
  if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
    cleaned = `["${cleaned}"]`;
  }

  // Fix common issues with Spanish text in JSON
  cleaned = cleaned
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}');

  return cleaned;
}

/**
 * Safely parse JSON strings with fallback values
 */
export function safeJsonParse<T = any>(
  jsonString: string | null | undefined,
  fallback: T
): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Problematic JSON string:', jsonString);

    // Try to clean and parse again
    try {
      const cleaned = cleanJsonString(jsonString);
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('JSON Parse Error after cleaning:', secondError);
      return fallback;
    }
  }
}

/**
 * Safely parse JSON arrays
 */
export function safeJsonParseArray(
  jsonString: string | null | undefined,
  fallback: string[] = []
): string[] {
  return safeJsonParse<string[]>(jsonString, fallback);
}

/**
 * Safely parse JSON objects
 */
export function safeJsonParseObject<T = any>(
  jsonString: string | null | undefined,
  fallback: T | null = null
): T | null {
  return safeJsonParse<T | null>(jsonString, fallback);
}
