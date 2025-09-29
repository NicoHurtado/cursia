/**
 * Content Validator for Cursia
 * Validates user prompts to detect sensitive, illegal, immoral, or dangerous content
 */

export interface ContentValidationResult {
  isSafe: boolean;
  reason?: string;
  category?: string;
  confidence?: number;
}

export class ContentValidator {
  private static readonly SENSITIVE_CATEGORIES = [
    'violence',
    'drugs',
    'sexual',
    'hate_speech',
    'self_harm',
    'politics',
    'fraud',
    'cybersecurity',
    'privacy',
    'other_risks',
  ];

  /**
   * Validate if a prompt contains sensitive content
   */
  public static async validatePrompt(
    prompt: string
  ): Promise<ContentValidationResult> {
    try {
      console.log(
        '🔍 Using basic keyword validation (AI validation disabled due to API issues)'
      );

      // Use only basic keyword filtering for now
      const basicValidation = this.basicKeywordFilter(prompt);

      if (!basicValidation.isSafe) {
        console.log(
          '❌ Content blocked by basic filter:',
          basicValidation.reason
        );
        return basicValidation;
      }

      console.log('✅ Content passed basic validation');
      return { isSafe: true };

      // AI validation disabled temporarily due to API issues
      // TODO: Re-enable when Anthropic API is stable
      /*
      try {
        const analysis = await this.analyzeWithAI(prompt);
        
        if (analysis.isSafe) {
          return { isSafe: true };
        }

        return {
          isSafe: false,
          reason: analysis.reason,
          category: analysis.category,
          confidence: analysis.confidence
        };
      } catch (aiError) {
        console.warn('AI validation failed, using basic validation:', aiError);
        return { isSafe: true };
      }
      */
    } catch (error) {
      console.error('Error validating content:', error);
      // If validation fails, allow content through
      return {
        isSafe: true,
        reason:
          'Validación limitada debido a problemas técnicos. El contenido será procesado.',
        category: 'validation_error',
      };
    }
  }

  /**
   * Basic keyword-based filtering as fallback
   */
  private static basicKeywordFilter(prompt: string): ContentValidationResult {
    const lowerPrompt = prompt.toLowerCase();

    // Define dangerous keywords that should always be blocked
    const dangerousKeywords = [
      // Violence and weapons
      'terrorism',
      'terrorismo',
      'terrorist',
      'terrorista',
      'bomb',
      'bomba',
      'bombing',
      'bombardeo',
      'explosive',
      'explosivo',
      'explosives',
      'explosivos',
      'weapon',
      'arma',
      'weapons',
      'armas',
      'gun',
      'pistola',
      'rifle',
      'rifle',

      // Violence and crime
      'suicide',
      'suicidio',
      'kill',
      'matar',
      'murder',
      'asesinato',
      'assassination',
      'asesinato',
      'homicide',
      'homicidio',
      'violence',
      'violencia',
      'violent',
      'violento',
      'torture',
      'tortura',
      'torturing',
      'torturando',

      // Drugs
      'drug production',
      'producción de drogas',
      'cocaine',
      'cocaína',
      'heroin',
      'heroína',
      'marijuana',
      'marihuana',
      'drug trafficking',
      'tráfico de drogas',
      'drug dealer',
      'dealer de drogas',

      // Sexual content
      'child abuse',
      'abuso infantil',
      'pornography',
      'pornografía',
      'pedophile',
      'pedófilo',
      'sexual abuse',
      'abuso sexual',
      'prostitution',
      'prostitución',
      'escort',
      'escort',

      // Financial crimes
      'hack bank',
      'hackear banco',
      'steal money',
      'robar dinero',
      'bank robbery',
      'robo a banco',
      'credit card fraud',
      'fraude tarjeta',
      'money laundering',
      'lavado de dinero',

      // Cybersecurity attacks
      'phishing',
      'malware',
      'virus creation',
      'creación de virus',
      'ransomware',
      'hacking',
      'hackeo',
      'ddos attack',
      'cyber attack',
      'ataque cibernético',

      // Other dangerous content
      'human trafficking',
      'tráfico de personas',
      'kidnapping',
      'secuestro',
      'kidnap',
      'secuestrar',
      'extortion',
      'extorsión',
      'blackmail',
      'chantaje',
    ];

    // Check for dangerous keywords
    for (const keyword of dangerousKeywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        console.log(`🚫 Dangerous keyword detected: ${keyword}`);
        return {
          isSafe: false,
          reason: `El contenido contiene términos relacionados con: ${keyword}`,
          category: 'dangerous_content',
        };
      }
    }

    // Check for educational context that might make some terms acceptable
    const educationalContexts = [
      'curso',
      'course',
      'aprender',
      'learn',
      'estudiar',
      'study',
      'educación',
      'education',
      'enseñanza',
      'teaching',
      'programación',
      'programming',
      'desarrollo',
      'development',
      'informática',
      'computer science',
      'tecnología',
      'technology',
    ];

    // If the prompt contains educational context, be more lenient
    const hasEducationalContext = educationalContexts.some(context =>
      lowerPrompt.includes(context.toLowerCase())
    );

    if (hasEducationalContext) {
      console.log('📚 Educational context detected, being more lenient');
    }

    // If no dangerous keywords found, consider it safe
    console.log('✅ No dangerous keywords detected');
    return { isSafe: true };
  }

  /**
   * Analyze prompt using AI
   */
  private static async analyzeWithAI(prompt: string): Promise<{
    isSafe: boolean;
    reason?: string;
    category?: string;
    confidence?: number;
  }> {
    const { askClaude } = await import('@/lib/ai/anthropic');

    const systemPrompt = `Eres un moderador de contenido especializado en detectar temas sensibles, ilegales, inmorales o peligrosos en prompts educativos.

Tu tarea es analizar si un prompt para crear un curso educativo contiene contenido que debe ser restringido según nuestras políticas.

CATEGORÍAS RESTRINGIDAS:

1. VIOLENCIA Y CRIMINALIDAD
- Terrorismo, extremismo o radicalización
- Fabricación de armas, explosivos, bombas o químicos nocivos
- Instrucciones para cometer delitos (robo, fraude, asesinato, secuestro, etc.)
- Tráfico de drogas, armas o personas
- Asesinatos, torturas o autolesiones gráficas

2. DROGAS Y SUSTANCIAS
- Producción, distribución o consumo de drogas ilegales
- Uso indebido de medicamentos con receta
- Sustancias químicas peligrosas sin fines educativos legítimos

3. CONTENIDO SEXUAL INAPROPIADO
- Pornografía o explotación sexual
- Abuso infantil o grooming
- Fetiches extremos o no consensuales
- Servicios sexuales ilegales

4. DISCURSO DAÑINO
- Racismo, xenofobia, homofobia, transfobia
- Discriminación por religión, género, orientación sexual, nacionalidad, etc.
- Incitación al odio o violencia contra grupos o individuos

5. AUTOLESIONES Y SALUD
- Instrucciones para suicidio o autolesiones
- Trastornos alimenticios promovidos de forma peligrosa
- Terapias médicas falsas o engañosas sin aval científico

6. POLÍTICA Y ELECCIONES
- Manipulación electoral
- Desinformación política o conspiraciones peligrosas
- Supresión de votantes o desinformación sobre procesos de votación

7. FINANZAS Y ESTAFAS
- Esquemas piramidales o Ponzi
- Hackeo de cuentas bancarias o fraudes financieros
- Estafas con criptomonedas o inversiones falsas

8. CIBERSEGURIDAD OFENSIVA
- Hacking malicioso (phishing, DDoS, malware, ransomware)
- Instrucciones para vulnerar sistemas o robar datos
- Creación y distribución de virus

9. INFORMACIÓN PERSONAL O SENSIBLE
- Recolección o exposición de datos privados sin consentimiento
- Instrucciones para el doxxing (exponer direcciones, teléfonos, etc.)

10. OTROS RIESGOS
- Cultos destructivos o manipulación psicológica peligrosa
- Canibalismo o violencia extrema gráfica
- Crueldad animal intencional

INSTRUCCIONES:
- Analiza el prompt cuidadosamente
- Considera el contexto educativo
- Sé estricto pero justo
- Si hay dudas, marca como no seguro
- Responde SOLO con JSON válido

FORMATO DE RESPUESTA:
{
  "isSafe": boolean,
  "reason": "string (si no es seguro, explica por qué)",
  "category": "string (categoría de restricción si aplica)",
  "confidence": number (0-100, qué tan seguro estás de la clasificación)
}`;

    const userPrompt = `Analiza este prompt para crear un curso educativo:

"${prompt}"

¿Contiene contenido que debe ser restringido según nuestras políticas?`;

    const response = await askClaude({
      system: systemPrompt,
      user: userPrompt,
    });

    try {
      const result = JSON.parse(response);
      return result;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // If we can't parse the response, assume it's unsafe
      return {
        isSafe: false,
        reason: 'Error en la validación del contenido.',
        category: 'validation_error',
      };
    }
  }

  /**
   * Get user-friendly error message based on category
   */
  public static getErrorMessage(category: string): string {
    const messages = {
      violence:
        'No podemos crear cursos sobre violencia, criminalidad o actividades ilegales.',
      drugs:
        'No podemos crear cursos sobre drogas ilegales o sustancias peligrosas.',
      sexual: 'No podemos crear cursos con contenido sexual inapropiado.',
      hate_speech:
        'No podemos crear cursos que promuevan discriminación o discurso de odio.',
      self_harm:
        'No podemos crear cursos que promuevan autolesiones o comportamientos peligrosos.',
      politics:
        'No podemos crear cursos con contenido político manipulativo o desinformación.',
      fraud:
        'No podemos crear cursos sobre estafas, fraudes o esquemas ilegales.',
      cybersecurity:
        'No podemos crear cursos sobre hacking malicioso o actividades cibernéticas ilegales.',
      privacy:
        'No podemos crear cursos sobre violación de privacidad o recolección ilegal de datos.',
      other_risks:
        'No podemos crear cursos sobre este tema debido a su naturaleza peligrosa.',
      validation_error:
        'No se pudo validar el contenido. Por favor, intenta con un prompt diferente.',
    };

    return messages[category as keyof typeof messages] || messages.other_risks;
  }
}
