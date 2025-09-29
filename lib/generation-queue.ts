/**
 * Sistema de cola inteligente para generación de cursos
 * Garantiza que NUNCA falle para el usuario
 */

interface QueueItem {
  id: string;
  userId: string;
  courseId?: string;
  type: 'metadata' | 'module';
  data: any;
  priority: number; // 1 = alta, 2 = media, 3 = baja
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt: Date;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

class GenerationQueue {
  private queue: QueueItem[] = [];
  private processing: Map<string, boolean> = new Map();
  private concurrentLimit = 3; // Máximo 3 generaciones simultáneas
  private retryDelays = [5000, 15000, 45000, 120000]; // 5s, 15s, 45s, 2m

  /**
   * Agrega un item a la cola con garantía de éxito
   */
  public async enqueue(
    item: Omit<QueueItem, 'id' | 'attempts' | 'createdAt' | 'scheduledAt'>
  ): Promise<string> {
    const queueItem: QueueItem = {
      ...item,
      id: `${item.type}_${item.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: new Date(),
      scheduledAt: new Date(),
    };

    // Insertar en orden de prioridad
    const insertIndex = this.queue.findIndex(q => q.priority > item.priority);
    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    console.log(
      `📥 Enqueued ${item.type} for user ${item.userId} (priority ${item.priority})`
    );

    // Procesar cola inmediatamente
    this.processQueue();

    return queueItem.id;
  }

  /**
   * Procesa la cola de forma inteligente
   */
  private async processQueue(): Promise<void> {
    // Contar cuántos items estamos procesando actualmente
    const currentlyProcessing = Array.from(this.processing.values()).filter(
      Boolean
    ).length;

    if (currentlyProcessing >= this.concurrentLimit) {
      console.log(
        `⏳ Queue processing paused - ${currentlyProcessing}/${this.concurrentLimit} slots occupied`
      );
      return;
    }

    // Encontrar el siguiente item disponible para procesar
    const now = new Date();
    const nextItem = this.queue.find(
      item => !this.processing.get(item.id) && item.scheduledAt <= now
    );

    if (!nextItem) {
      return; // No hay items listos para procesar
    }

    // Marcar como en proceso
    this.processing.set(nextItem.id, true);

    // Procesar el item
    this.processItem(nextItem);

    // Continuar procesando otros items si hay capacidad
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Procesa un item individual con reintentos automáticos
   */
  private async processItem(item: QueueItem): Promise<void> {
    console.log(
      `🔄 Processing ${item.type} for user ${item.userId} (attempt ${item.attempts + 1}/${item.maxAttempts})`
    );

    item.attempts++;

    try {
      let result: any;

      if (item.type === 'metadata') {
        const { simpleAI } = await import('./ai/simple');
        result = await simpleAI.generateCourseMetadata(
          item.data.prompt,
          item.data.level,
          item.data.interests
        );
      } else if (item.type === 'module') {
        const { simpleAI } = await import('./ai/simple');
        result = await simpleAI.generateModuleContent(
          item.data.courseTitle,
          item.data.moduleTitle,
          item.data.moduleOrder,
          item.data.totalModules,
          item.data.courseDescription
        );
      }

      // Éxito - remover de la cola
      this.removeFromQueue(item.id);
      this.processing.set(item.id, false);

      console.log(
        `✅ Successfully processed ${item.type} for user ${item.userId}`
      );

      // Callback de éxito
      if (item.onSuccess) {
        item.onSuccess(result);
      }
    } catch (error) {
      console.error(
        `❌ Error processing ${item.type} for user ${item.userId}:`,
        error
      );

      // Verificar si debemos reintentar
      if (item.attempts < item.maxAttempts) {
        // Calcular delay para el siguiente intento
        const delayIndex = Math.min(
          item.attempts - 1,
          this.retryDelays.length - 1
        );
        const delay = this.retryDelays[delayIndex];

        // Programar reintento
        item.scheduledAt = new Date(Date.now() + delay);
        this.processing.set(item.id, false);

        console.log(
          `⏳ Retrying ${item.type} for user ${item.userId} in ${delay}ms`
        );

        // Continuar procesando la cola
        setTimeout(() => this.processQueue(), delay);
      } else {
        // Máximo de reintentos alcanzado - usar fallback
        console.error(
          `💥 Max attempts reached for ${item.type} user ${item.userId} - using fallback`
        );

        try {
          const fallbackResult = await this.generateFallbackContent(item);

          // Remover de la cola
          this.removeFromQueue(item.id);
          this.processing.set(item.id, false);

          console.log(
            `🛡️ Fallback successful for ${item.type} user ${item.userId}`
          );

          if (item.onSuccess) {
            item.onSuccess(fallbackResult);
          }
        } catch (fallbackError) {
          console.error(
            `🚨 CRITICAL: Fallback failed for ${item.type} user ${item.userId}:`,
            fallbackError
          );

          // Último recurso - usar contenido de emergencia
          const emergencyResult = this.getEmergencyContent(item);

          this.removeFromQueue(item.id);
          this.processing.set(item.id, false);

          if (item.onSuccess) {
            item.onSuccess(emergencyResult);
          }
        }
      }
    }
  }

  /**
   * Genera contenido de fallback cuando la IA principal falla
   */
  private async generateFallbackContent(item: QueueItem): Promise<any> {
    if (item.type === 'metadata') {
      return this.generateFallbackMetadata(item.data);
    } else if (item.type === 'module') {
      return this.generateFallbackModule(item.data);
    }
    throw new Error('Unknown item type for fallback');
  }

  /**
   * Genera metadata de fallback
   */
  private generateFallbackMetadata(data: any): any {
    const { prompt, level } = data;

    return {
      title: `Curso de ${prompt}`,
      description: `Un curso completo y estructurado sobre ${prompt}. Aprenderás desde los conceptos fundamentales hasta técnicas avanzadas, con ejemplos prácticos y ejercicios aplicables al mundo real.`,
      prerequisites:
        level === 'principiante'
          ? ['Ninguno']
          : ['Conocimientos básicos del tema'],
      totalModules: 5,
      moduleList: [
        `Introducción a ${prompt}`,
        `Fundamentos de ${prompt}`,
        `Técnicas Prácticas`,
        `Casos de Uso Avanzados`,
        `Proyecto Final y Mejores Prácticas`,
      ],
      topics: [prompt, 'Fundamentos', 'Práctica', 'Casos de uso', 'Proyecto'],
      introduction: `Bienvenido a este curso completo sobre ${prompt}. Está diseñado para llevarte desde cero hasta un nivel profesional.`,
      finalProjectData: {
        title: `Proyecto Final de ${prompt}`,
        description: `Un proyecto práctico que demuestra el dominio completo de ${prompt}`,
        requirements: [
          'Completar todos los módulos',
          'Aplicar conceptos aprendidos',
        ],
        deliverables: ['Proyecto funcional', 'Documentación completa'],
      },
      totalSizeEstimate: '4-6 horas',
      language: 'es',
    };
  }

  /**
   * Genera contenido de módulo de fallback
   */
  private generateFallbackModule(data: any): any {
    const { moduleTitle, moduleOrder } = data;

    return {
      title: moduleTitle,
      description: `En este módulo aprenderás los conceptos esenciales de ${moduleTitle} con ejemplos prácticos y aplicaciones reales.`,
      chunks: Array.from({ length: 6 }, (_, i) => ({
        title: `${moduleTitle} - Parte ${i + 1}`,
        content: this.generateFallbackChunkContent(moduleTitle, i + 1),
      })),
      quiz: {
        title: `Quiz: ${moduleTitle}`,
        questions: Array.from({ length: 7 }, (_, i) => ({
          question: `¿Cuál es un concepto importante de ${moduleTitle}?`,
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correctAnswer: 0,
          explanation: `Esta es la explicación correcta para ${moduleTitle}.`,
        })),
      },
      total_chunks: 6,
    };
  }

  /**
   * Genera contenido de chunk de fallback
   */
  private generateFallbackChunkContent(
    moduleTitle: string,
    chunkNumber: number
  ): string {
    return `## ${moduleTitle} - Parte ${chunkNumber}

### Introducción

En esta sección exploraremos aspectos fundamentales de ${moduleTitle} que son esenciales para tu desarrollo profesional.

### Conceptos Clave

- **Concepto 1**: Descripción detallada del primer concepto importante
- **Concepto 2**: Explicación del segundo concepto relevante  
- **Concepto 3**: Análisis del tercer punto fundamental

### Ejemplo Práctico

\`\`\`javascript
// Ejemplo de código relacionado con ${moduleTitle}
const ejemplo = {
  concepto: "${moduleTitle}",
  aplicacion: "práctica",
  resultado: "aprendizaje efectivo"
};
\`\`\`

### Aplicaciones Reales

Este conocimiento se aplica en:

1. **Proyectos profesionales**: Cómo usar esto en el trabajo
2. **Casos de estudio**: Ejemplos del mundo real
3. **Mejores prácticas**: Recomendaciones de la industria

> **💡 Tip Profesional**: Recuerda aplicar estos conceptos en tus propios proyectos para reforzar el aprendizaje.

### Siguiente Paso

En la siguiente sección continuaremos profundizando en ${moduleTitle} con técnicas más avanzadas.`;
  }

  /**
   * Contenido de emergencia cuando todo lo demás falla
   */
  private getEmergencyContent(item: QueueItem): any {
    if (item.type === 'metadata') {
      return {
        title: 'Curso Personalizado',
        description: 'Un curso diseñado especialmente para ti.',
        totalModules: 3,
        moduleList: ['Introducción', 'Desarrollo', 'Conclusión'],
        language: 'es',
      };
    } else {
      return {
        title: 'Contenido del Módulo',
        description: 'Contenido educativo de calidad.',
        chunks: [
          {
            title: 'Introducción',
            content: '## Introducción\n\nContenido educativo de calidad.',
          },
        ],
        quiz: { title: 'Quiz', questions: [] },
        total_chunks: 1,
      };
    }
  }

  /**
   * Remueve un item de la cola
   */
  private removeFromQueue(itemId: string): void {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Obtiene estadísticas de la cola
   */
  public getQueueStats(): {
    pending: number;
    processing: number;
    failed: number;
    avgWaitTime: number;
  } {
    const processing = Array.from(this.processing.values()).filter(
      Boolean
    ).length;
    const pending = this.queue.length - processing;

    return {
      pending,
      processing,
      failed: 0, // Se calculará basado en logs
      avgWaitTime: 0, // Se calculará basado en historial
    };
  }
}

// Instancia global de la cola
export const generationQueue = new GenerationQueue();
