/**
 * Gestor de concurrencia para optimizar el uso de APIs con múltiples usuarios
 * Evita sobrecargas y distribuye la carga inteligentemente
 */

interface ConcurrentRequest {
  id: string;
  userId: string;
  type: 'metadata' | 'module';
  priority: number;
  timestamp: Date;
  retries: number;
}

class ConcurrencyManager {
  private activeRequests: Map<string, ConcurrentRequest> = new Map();
  private requestQueue: ConcurrentRequest[] = [];
  private maxConcurrent = 5; // Máximo 5 requests simultáneos a la API
  private userConcurrentLimit = 1; // Máximo 1 request por usuario simultáneo
  private apiCallDelays = [1000, 2000, 5000]; // Delays escalonados entre calls

  /**
   * Registra una nueva solicitud y la procesa si es posible
   */
  public async registerRequest(
    userId: string,
    type: 'metadata' | 'module',
    priority: number = 2
  ): Promise<{ canProceed: boolean; waitTime?: number; position?: number }> {
    const requestId = `${type}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: ConcurrentRequest = {
      id: requestId,
      userId,
      type,
      priority,
      timestamp: new Date(),
      retries: 0,
    };

    // Verificar si el usuario ya tiene una request activa
    const userActiveRequests = Array.from(this.activeRequests.values()).filter(
      req => req.userId === userId
    );

    if (userActiveRequests.length >= this.userConcurrentLimit) {
      // Usuario ya tiene request activa - agregar a cola
      this.addToQueue(request);
      const position = this.getQueuePosition(requestId);
      const estimatedWaitTime = this.calculateWaitTime(position);

      console.log(
        `🚦 User ${userId} queued - position ${position}, wait ~${estimatedWaitTime}ms`
      );

      return {
        canProceed: false,
        waitTime: estimatedWaitTime,
        position,
      };
    }

    // Verificar capacidad global
    if (this.activeRequests.size >= this.maxConcurrent) {
      // Sistema al límite - agregar a cola
      this.addToQueue(request);
      const position = this.getQueuePosition(requestId);
      const estimatedWaitTime = this.calculateWaitTime(position);

      console.log(
        `⏳ System at capacity - request queued at position ${position}`
      );

      return {
        canProceed: false,
        waitTime: estimatedWaitTime,
        position,
      };
    }

    // Puede proceder inmediatamente
    this.activeRequests.set(requestId, request);
    console.log(`✅ Request ${requestId} approved for immediate processing`);

    return { canProceed: true };
  }

  /**
   * Marca una solicitud como completada y procesa la cola
   */
  public completeRequest(requestId: string): void {
    if (this.activeRequests.has(requestId)) {
      this.activeRequests.delete(requestId);
      console.log(`✅ Request ${requestId} completed`);

      // Procesar siguiente en cola
      this.processQueue();
    }
  }

  /**
   * Marca una solicitud como fallida e intenta reintento
   */
  public failRequest(requestId: string, error: Error): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    request.retries++;
    this.activeRequests.delete(requestId);

    if (request.retries < 3) {
      // Reintento con prioridad alta
      request.priority = 1;
      request.timestamp = new Date();
      this.addToQueue(request);

      console.log(
        `🔄 Request ${requestId} failed, requeued with high priority (attempt ${request.retries + 1})`
      );
    } else {
      console.error(
        `💥 Request ${requestId} failed permanently after ${request.retries} attempts:`,
        error
      );
    }

    // Procesar cola
    this.processQueue();
  }

  /**
   * Agrega request a la cola ordenada por prioridad
   */
  private addToQueue(request: ConcurrentRequest): void {
    // Insertar en orden de prioridad (1 = más alta)
    const insertIndex = this.requestQueue.findIndex(
      req => req.priority > request.priority
    );

    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }
  }

  /**
   * Procesa la cola y activa requests disponibles
   */
  private processQueue(): void {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests.size < this.maxConcurrent
    ) {
      const nextRequest = this.requestQueue.shift();
      if (!nextRequest) break;

      // Verificar si el usuario aún puede procesar
      const userActiveRequests = Array.from(
        this.activeRequests.values()
      ).filter(req => req.userId === nextRequest.userId);

      if (userActiveRequests.length >= this.userConcurrentLimit) {
        // Usuario ya tiene request activa - devolver a cola
        this.requestQueue.unshift(nextRequest);
        break;
      }

      // Activar request
      this.activeRequests.set(nextRequest.id, nextRequest);
      console.log(
        `🚀 Activated queued request ${nextRequest.id} for user ${nextRequest.userId}`
      );

      // Notificar que puede proceder (esto se manejaría con eventos en producción)
      this.notifyRequestActivated(nextRequest);
    }
  }

  /**
   * Notifica que una request puede proceder
   */
  private notifyRequestActivated(request: ConcurrentRequest): void {
    // En una implementación real, esto sería un event emitter o callback
    console.log(`📢 Request ${request.id} can now proceed`);
  }

  /**
   * Obtiene la posición en cola de una request
   */
  private getQueuePosition(requestId: string): number {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    return index === -1 ? 0 : index + 1;
  }

  /**
   * Calcula tiempo estimado de espera
   */
  private calculateWaitTime(position: number): number {
    // Estimación basada en tiempo promedio de procesamiento
    const avgProcessingTime = 30000; // 30 segundos promedio
    const concurrentSlots = this.maxConcurrent;

    return Math.ceil(position / concurrentSlots) * avgProcessingTime;
  }

  /**
   * Obtiene estadísticas del sistema
   */
  public getStats(): {
    activeRequests: number;
    queuedRequests: number;
    totalCapacity: number;
    utilizationPercent: number;
    averageWaitTime: number;
  } {
    const activeRequests = this.activeRequests.size;
    const queuedRequests = this.requestQueue.length;
    const totalCapacity = this.maxConcurrent;
    const utilizationPercent = (activeRequests / totalCapacity) * 100;

    // Calcular tiempo promedio de espera
    let totalWaitTime = 0;
    this.requestQueue.forEach((req, index) => {
      totalWaitTime += this.calculateWaitTime(index + 1);
    });
    const averageWaitTime =
      queuedRequests > 0 ? totalWaitTime / queuedRequests : 0;

    return {
      activeRequests,
      queuedRequests,
      totalCapacity,
      utilizationPercent: Math.round(utilizationPercent),
      averageWaitTime: Math.round(averageWaitTime),
    };
  }

  /**
   * Ajusta dinámicamente los límites basado en la carga
   */
  public adjustLimits(): void {
    const stats = this.getStats();

    // Si utilización es muy alta, reducir concurrencia para evitar overload
    if (stats.utilizationPercent > 90 && stats.queuedRequests > 10) {
      this.maxConcurrent = Math.max(2, this.maxConcurrent - 1);
      console.log(
        `📉 Reduced max concurrent requests to ${this.maxConcurrent} due to high load`
      );
    }

    // Si utilización es baja, puede aumentar concurrencia
    else if (stats.utilizationPercent < 50 && stats.queuedRequests === 0) {
      this.maxConcurrent = Math.min(8, this.maxConcurrent + 1);
      console.log(
        `📈 Increased max concurrent requests to ${this.maxConcurrent} due to low load`
      );
    }
  }

  /**
   * Limpia requests antiguas que pueden haber quedado colgadas
   */
  public cleanupStaleRequests(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutos

    const staleRequests: string[] = [];

    this.activeRequests.forEach((request, id) => {
      if (now - request.timestamp.getTime() > maxAge) {
        staleRequests.push(id);
      }
    });

    staleRequests.forEach(id => {
      console.warn(`🧹 Cleaning up stale request ${id}`);
      this.activeRequests.delete(id);
    });

    if (staleRequests.length > 0) {
      this.processQueue();
    }
  }
}

// Instancia global del gestor de concurrencia
export const concurrencyManager = new ConcurrencyManager();

// Ejecutar limpieza y ajuste cada minuto
setInterval(() => {
  concurrencyManager.cleanupStaleRequests();
  concurrencyManager.adjustLimits();
}, 60000);
