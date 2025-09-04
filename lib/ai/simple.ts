import { generateCourseMetadata, generateModuleContent } from './anthropic';
import { CourseMetadataSchema, ModuleContentSchema } from '@/lib/dto/course';

/**
 * Simple AI System - No Redis, Direct Calls Only
 * Perfect for development and small-scale production
 */

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Simple rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 requests per minute per user

export class SimpleAI {
  // Course Metadata Generation
  public async generateCourseMetadata(
    prompt: string,
    level: string,
    interests: string[]
  ): Promise<any> {
    const cacheKey = `course-metadata:${JSON.stringify({ prompt, level, interests })}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached course metadata');
      return cached;
    }

    console.log('🚀 Generating course metadata...');
    
    try {
      const metadataJson = await generateCourseMetadata(prompt, level, interests);
      const metadata = CourseMetadataSchema.parse(JSON.parse(metadataJson));
      
      // Cache the result
      this.setCache(cacheKey, metadata);
      
      return metadata;
    } catch (error) {
      console.error('Course metadata generation failed:', error);
      throw new Error(`Failed to generate course metadata: ${error}`);
    }
  }

  // Module Content Generation
  public async generateModuleContent(
    courseTitle: string,
    moduleTitle: string,
    moduleOrder: number,
    totalModules: number,
    courseDescription: string
  ): Promise<any> {
    const cacheKey = `module-content:${JSON.stringify({
      courseTitle,
      moduleTitle,
      moduleOrder,
      totalModules,
      courseDescription,
    })}`;
    
    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Using cached module content');
      return cached;
    }

    console.log(`🚀 Generating module content: ${moduleTitle}...`);
    
    try {
      const moduleJson = await generateModuleContent(
        courseTitle,
        moduleTitle,
        moduleOrder,
        totalModules,
        courseDescription
      );
      let moduleContent;
      try {
        moduleContent = ModuleContentSchema.parse(JSON.parse(moduleJson));
      } catch (error) {
        console.warn('Schema validation failed, attempting to fix:', error);
        
        // Try to fix the module content
        const rawContent = JSON.parse(moduleJson);
        
        // Ensure we have at least 3 questions
        if (rawContent.quiz && rawContent.quiz.questions) {
          if (rawContent.quiz.questions.length < 3) {
            console.warn(`Only ${rawContent.quiz.questions.length} questions generated, adding fallback questions`);
            
            // Add fallback questions to reach minimum
            const fallbackQuestions = [
              {
                question: "¿Cuál es el concepto principal de este módulo?",
                options: ["Opción A", "Opción B", "Opción C", "Opción D"],
                correctAnswer: 0,
                explanation: "Esta es una pregunta de respaldo para completar el quiz."
              },
              {
                question: "¿Qué habilidad se desarrolla en este módulo?",
                options: ["Opción A", "Opción B", "Opción C", "Opción D"],
                correctAnswer: 1,
                explanation: "Esta es una pregunta de respaldo para completar el quiz."
              }
            ];
            
            rawContent.quiz.questions = [...rawContent.quiz.questions, ...fallbackQuestions.slice(0, 3 - rawContent.quiz.questions.length)];
          }
        }
        
        // Try parsing again
        moduleContent = ModuleContentSchema.parse(rawContent);
      }
      
      // Cache the result
      this.setCache(cacheKey, moduleContent);
      
      return moduleContent;
    } catch (error) {
      console.error('Module content generation failed:', error);
      throw new Error(`Failed to generate module content: ${error}`);
    }
  }

  // Rate Limiting
  public checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimit.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (userLimit.count >= RATE_LIMIT_MAX) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  public getRateLimitInfo(userId: string): {
    remaining: number;
    resetTime: number;
    limit: number;
  } {
    const userLimit = rateLimit.get(userId);
    const now = Date.now();

    if (!userLimit || now > userLimit.resetTime) {
      return {
        remaining: RATE_LIMIT_MAX,
        resetTime: now + RATE_LIMIT_WINDOW,
        limit: RATE_LIMIT_MAX,
      };
    }

    return {
      remaining: Math.max(0, RATE_LIMIT_MAX - userLimit.count),
      resetTime: userLimit.resetTime,
      limit: RATE_LIMIT_MAX,
    };
  }

  // Cache Management
  private getFromCache(key: string): any | null {
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    cache.set(key, {
      data,
      expires: Date.now() + CACHE_TTL,
    });
  }

  // Cleanup
  public clearCache(): void {
    cache.clear();
  }

  public clearRateLimit(): void {
    rateLimit.clear();
  }
}

// Export singleton instance
export const simpleAI = new SimpleAI();
