/**
 * Sistema de métricas de calidad para monitorear el rendimiento de la IA
 */

export interface QualityReport {
  moduleTitle: string;
  courseTitle: string;
  timestamp: Date;
  qualityScore: number;
  metrics: {
    contentDepth: number;
    technicalAccuracy: number;
    practicalValue: number;
    structureQuality: number;
  };
  issues: string[];
  generationAttempts: number;
  processingTime: number;
}

export class QualityMetricsCollector {
  private static reports: QualityReport[] = [];

  /**
   * Registra un reporte de calidad
   */
  static recordQualityReport(report: QualityReport): void {
    this.reports.push(report);

    // Mantener solo los últimos 100 reportes en memoria
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }

    // Log para monitoreo
    console.log(
      `📊 Quality Report: ${report.moduleTitle} - Score: ${report.qualityScore.toFixed(1)}/100`
    );

    if (report.qualityScore < 85) {
      console.warn(
        `⚠️ Low quality detected: ${report.moduleTitle} (${report.qualityScore.toFixed(1)}/100)`
      );
    }
  }

  /**
   * Obtiene estadísticas de calidad
   */
  static getQualityStats(): {
    averageScore: number;
    totalReports: number;
    lowQualityCount: number;
    averageAttempts: number;
    averageProcessingTime: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  } {
    if (this.reports.length === 0) {
      return {
        averageScore: 0,
        totalReports: 0,
        lowQualityCount: 0,
        averageAttempts: 0,
        averageProcessingTime: 0,
        recentTrend: 'stable',
      };
    }

    const totalScore = this.reports.reduce(
      (sum, report) => sum + report.qualityScore,
      0
    );
    const averageScore = totalScore / this.reports.length;

    const lowQualityCount = this.reports.filter(
      report => report.qualityScore < 85
    ).length;

    const totalAttempts = this.reports.reduce(
      (sum, report) => sum + report.generationAttempts,
      0
    );
    const averageAttempts = totalAttempts / this.reports.length;

    const totalTime = this.reports.reduce(
      (sum, report) => sum + report.processingTime,
      0
    );
    const averageProcessingTime = totalTime / this.reports.length;

    // Calcular tendencia (últimos 10 vs anteriores 10)
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (this.reports.length >= 20) {
      const recent10 = this.reports.slice(-10);
      const previous10 = this.reports.slice(-20, -10);

      const recentAvg =
        recent10.reduce((sum, r) => sum + r.qualityScore, 0) / 10;
      const previousAvg =
        previous10.reduce((sum, r) => sum + r.qualityScore, 0) / 10;

      const difference = recentAvg - previousAvg;
      if (difference > 2) recentTrend = 'improving';
      else if (difference < -2) recentTrend = 'declining';
    }

    return {
      averageScore,
      totalReports: this.reports.length,
      lowQualityCount,
      averageAttempts,
      averageProcessingTime,
      recentTrend,
    };
  }

  /**
   * Obtiene reportes recientes
   */
  static getRecentReports(limit: number = 10): QualityReport[] {
    return this.reports.slice(-limit).reverse();
  }

  /**
   * Identifica patrones de problemas comunes
   */
  static getCommonIssues(): { issue: string; frequency: number }[] {
    const issueCount = new Map<string, number>();

    this.reports.forEach(report => {
      report.issues.forEach(issue => {
        const count = issueCount.get(issue) || 0;
        issueCount.set(issue, count + 1);
      });
    });

    return Array.from(issueCount.entries())
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Genera recomendaciones basadas en métricas
   */
  static getRecommendations(): string[] {
    const stats = this.getQualityStats();
    const commonIssues = this.getCommonIssues();
    const recommendations: string[] = [];

    if (stats.averageScore < 85) {
      recommendations.push(
        '🔴 Calidad promedio por debajo del estándar - revisar prompts de IA'
      );
    }

    if (stats.lowQualityCount / stats.totalReports > 0.2) {
      recommendations.push(
        '⚠️ Más del 20% del contenido es de baja calidad - optimizar sistema de generación'
      );
    }

    if (stats.averageAttempts > 2) {
      recommendations.push(
        '🔄 Múltiples intentos de generación - mejorar prompts para mayor consistencia'
      );
    }

    if (stats.recentTrend === 'declining') {
      recommendations.push(
        '📉 Tendencia de calidad en declive - investigar cambios recientes'
      );
    }

    if (commonIssues.length > 0) {
      const topIssue = commonIssues[0];
      recommendations.push(
        `🎯 Problema más común: "${topIssue.issue}" (${topIssue.frequency} veces)`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        '✅ Sistema funcionando dentro de parámetros normales'
      );
    }

    return recommendations;
  }

  /**
   * Exporta métricas para análisis externo
   */
  static exportMetrics(): {
    summary: ReturnType<typeof QualityMetricsCollector.getQualityStats>;
    commonIssues: ReturnType<typeof QualityMetricsCollector.getCommonIssues>;
    recommendations: string[];
    recentReports: QualityReport[];
  } {
    return {
      summary: this.getQualityStats(),
      commonIssues: this.getCommonIssues(),
      recommendations: this.getRecommendations(),
      recentReports: this.getRecentReports(20),
    };
  }
}
