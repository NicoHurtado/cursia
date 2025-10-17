import { ContractPromptBuilder } from '@/lib/ai/content-contract-prompts';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function askClaude({
  system,
  user,
  retries = 3,
}: {
  system: string;
  user: string;
  retries?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  // Model configuration with safe output token caps
  const MODEL_CONFIG: Record<string, { maxOutputTokens: number }> = {
    'claude-3-haiku-20240307': { maxOutputTokens: 4096 },
    // Add other models here if needed
  };

  const model = 'claude-3-haiku-20240307';
  const modelMax = MODEL_CONFIG[model]?.maxOutputTokens ?? 4096;
  // Use full token limit for complete responses (will handle truncation with robust parser)
  let currentMaxTokens = modelMax;

  const baseRequestBody: Omit<AnthropicRequest, 'max_tokens'> = {
    model,
    messages: [
      {
        role: 'user',
        content: user,
      },
    ],
    system,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `🔄 Attempt ${attempt}/${retries} - Calling Anthropic API...`
      );

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          ...baseRequestBody,
          max_tokens: currentMaxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ API Error (attempt ${attempt}): ${response.status} ${errorText}`
        );

        // Handle specific error codes
        if (response.status === 529 || response.status === 429) {
          // Overloaded or rate limited - wait longer
          if (attempt < retries) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(
              `⏳ API overloaded, waiting ${waitTime}ms before retry...`
            );
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Handle invalid max_tokens by reducing and retrying immediately
        if (response.status === 400 && /max_tokens/i.test(errorText)) {
          const reduced = Math.max(512, Math.floor(currentMaxTokens / 2));
          if (reduced < currentMaxTokens) {
            console.log(
              `⚠️ Reducing max_tokens from ${currentMaxTokens} to ${reduced} and retrying...`
            );
            currentMaxTokens = reduced;
            // Do not count against retries; continue loop without incrementing attempt
            attempt -= 1;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }

        // Handle 500 errors (internal server error) - fail immediately for server errors
        if (response.status === 500) {
          console.log(
            '🚨 Server error detected, failing immediately to use fallback'
          );
          throw new Error(
            `Anthropic API server error: ${response.status} ${errorText}`
          );
        }

        throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
      }

      const data: AnthropicResponse = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error('No content received from Anthropic API');
      }

      console.log(`✅ API call successful on attempt ${attempt}`);
      return data.content[0].text;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        if (error instanceof Error) {
          throw new Error(
            `Anthropic API call failed after ${retries} attempts: ${error.message}`
          );
        }
        throw new Error(
          `Unknown error occurred while calling Anthropic API after ${retries} attempts`
        );
      }

      // Wait before retry
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('This should never be reached');
}

export async function generateCourseMetadata(
  prompt: string,
  level: string,
  interests: string[]
): Promise<string> {
  const systemPrompt = ContractPromptBuilder.buildSystemPrompt('course');
  const userPrompt = ContractPromptBuilder.buildUserPrompt('course', {
    topic: prompt,
    level: level as 'beginner' | 'intermediate' | 'advanced',
    interests: interests,
  });

  return askClaude({ system: systemPrompt, user: userPrompt });
}

export async function generateModuleContent(
  courseTitle: string,
  moduleTitle: string,
  moduleOrder: number,
  totalModules: number,
  courseDescription: string,
  previousModules?: Array<{
    title: string;
    topics: string[];
    description: string;
  }>,
  courseOutline?: string[]
): Promise<string> {
  const systemPrompt = ContractPromptBuilder.buildSystemPrompt('module');
  const userPrompt = ContractPromptBuilder.buildUserPrompt('module', {
    topic: courseTitle,
    moduleTitle: moduleTitle,
    moduleOrder: moduleOrder,
    totalModules: totalModules,
    courseDescription: courseDescription,
    previousModules: previousModules,
    courseOutline: courseOutline,
  });

  return askClaude({ system: systemPrompt, user: userPrompt });
}
