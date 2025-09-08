import { z } from 'zod';

// Course Metadata Schema
export const CourseMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z
    .string()
    .min(600, 'Description must be at least 600 characters'),
  prerequisites: z.array(z.string()).default([]),
  totalModules: z.number().int().min(1).max(10).default(4),
  moduleList: z.array(z.string()).min(1, 'At least one module is required'),
  topics: z.array(z.string()).default([]),
  introduction: z.string().optional(),
  finalProjectData: z
    .object({
      title: z.string(),
      description: z.string(),
      requirements: z.array(z.string()),
      deliverables: z.array(z.string()),
    })
    .optional(),
  totalSizeEstimate: z.string().optional(),
  language: z.string().default('es'),
});

// Module Content Schema
export const ModuleContentSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  description: z
    .string()
    .min(80, 'Module description must be at least 80 characters'),
  chunks: z
    .array(
      z.object({
        title: z.string().min(1, 'Chunk title is required'),
        content: z
          .string()
          .min(1200, 'Chunk content must be at least 1200 characters'),
      })
    )
    .length(6, 'Exactly 6 chunks are required'),
  quiz: z.object({
    title: z.string().min(1, 'Quiz title is required'),
    questions: z
      .array(
        z.object({
          question: z.string().min(1, 'Question is required'),
          options: z
            .array(z.string())
            .length(4, 'Exactly 4 options are required'),
          correctAnswer: z
            .number()
            .int()
            .min(0)
            .max(3, 'Correct answer must be between 0-3'),
          explanation: z.string().optional(),
        })
      )
      .length(7, 'Exactly 7 questions are required'),
  }),
  content1: z.string().optional(),
  content2: z.string().optional(),
  content3: z.string().optional(),
  content4: z.string().optional(),
  total_chunks: z.number().int().default(6),
});

// Request/Response Schemas
export const CourseCreateRequestSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  level: z.enum(['principiante', 'intermedio', 'avanzado']),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed').optional().default([]),
});

export const CourseCreateResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  title: z.string().nullable(),
  message: z.string(),
});

export const CourseStatusResponseSchema = z.object({
  status: z.string(),
  status_display: z.string(),
  progress_percentage: z.number(),
});

export const CourseFullResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  status: z.string(),
  status_display: z.string(),
  progress_percentage: z.number(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  userPrompt: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  prerequisites: z.array(z.string()),
  totalModules: z.number(),
  moduleList: z.array(z.string()),
  topics: z.array(z.string()),
  introduction: z.string().nullable(),
  finalProjectData: z
    .object({
      title: z.string(),
      description: z.string(),
      requirements: z.array(z.string()),
      deliverables: z.array(z.string()),
    })
    .nullable(),
  totalSizeEstimate: z.string().nullable(),
  language: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  modules: z.array(
    z.object({
      id: z.string(),
      moduleOrder: z.number(),
      title: z.string(),
      description: z.string().nullable(),
      chunks: z.array(
        z.object({
          id: z.string(),
          chunkOrder: z.number(),
          title: z.string(),
          content: z.string(),
        })
      ),
      videos: z.array(
        z.object({
          id: z.string(),
          videoOrder: z.number(),
          title: z.string(),
          description: z.string().nullable(),
          duration: z.number().nullable(),
          url: z.string().nullable(),
        })
      ),
      quizzes: z.array(
        z.object({
          id: z.string(),
          quizOrder: z.number(),
          title: z.string(),
          questions: z.array(
            z.object({
              id: z.string(),
              questionOrder: z.number(),
              question: z.string(),
              options: z.array(z.string()),
              correctAnswer: z.number(),
              explanation: z.string().nullable(),
            })
          ),
        })
      ),
    })
  ),
});

// Type exports
export type CourseMetadata = z.infer<typeof CourseMetadataSchema>;
export type ModuleContent = z.infer<typeof ModuleContentSchema>;
export type CourseCreateRequest = z.infer<typeof CourseCreateRequestSchema>;
export type CourseCreateResponse = z.infer<typeof CourseCreateResponseSchema>;
export type CourseStatusResponse = z.infer<typeof CourseStatusResponseSchema>;
export type CourseFullResponse = z.infer<typeof CourseFullResponseSchema>;
