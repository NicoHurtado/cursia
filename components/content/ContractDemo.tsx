'use client';

import { useState } from 'react';
import { ContractRenderer } from './ContractRenderer';
import {
  ContentDocument,
  ContentContractUtils,
  ContentContractValidator,
} from '@/lib/content-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * DEMO DEL CONTRATO DE CONTENIDO
 *
 * Muestra cómo funciona el sistema determinista:
 * "si es H1 se vea como H1"
 */
export function ContractDemo() {
  const [showValidation, setShowValidation] = useState(false);

  // Ejemplo de documento válido
  const validDocument: ContentDocument = {
    version: '1.0.0',
    locale: 'es',
    content_id: 'demo-document-001',
    meta: {
      topic: 'Fundamentos de NumPy para Análisis Financiero',
      audience: 'Desarrolladores Python',
      level: 'beginner',
      created_at: new Date().toISOString(),
    },
    blocks: [
      ContentContractUtils.createHeading(
        'Fundamentos de NumPy para Análisis Financiero',
        1
      ),
      ContentContractUtils.createParagraph(
        'En el análisis financiero, trabajamos constantemente con matrices de datos: precios históricos, rendimientos, correlaciones entre activos. NumPy proporciona la estructura perfecta para estos datos: el array multidimensional. A diferencia de las listas de Python, los arrays de NumPy están optimizados para operaciones matemáticas y ocupan menos memoria.'
      ),
      ContentContractUtils.createHeading('¿Por qué es importante?', 2),
      ContentContractUtils.createParagraph(
        'La vectorización no solo hace el código más rápido, sino también más legible y menos propenso a errores. Cuando trabajas con datos financieros, cada milisegundo cuenta.'
      ),
      ContentContractUtils.createList('bulleted', [
        'Procesamiento ultra-rápido de datos',
        'Operaciones vectorizadas eficientes',
        'Integración perfecta con Pandas',
        'Soporte para arrays multidimensionales',
      ]),
      ContentContractUtils.createHeading('Ejemplo Práctico', 3),
      ContentContractUtils.createParagraph(
        'Veamos cómo calcular rendimientos de múltiples activos de forma vectorizada:'
      ),
      ContentContractUtils.createCode(
        'python',
        `import numpy as np

# Crear array de precios (3 activos, 5 días)
precios = np.array([
    [100, 102, 105, 103, 108],  # Activo A
    [50, 51, 49, 52, 53],       # Activo B
    [200, 198, 201, 205, 203]   # Activo C
])

# Calcular rendimientos diarios
rendimientos = (precios[:, 1:] - precios[:, :-1]) / precios[:, :-1]
print(rendimientos)`
      ),
      ContentContractUtils.createCallout(
        'tip',
        'Consejo Práctico',
        'Siempre usa operaciones vectorizadas de NumPy en lugar de bucles cuando trabajes con datos financieros.'
      ),
      ContentContractUtils.createHeading('Comparación de Métodos', 3),
      ContentContractUtils.createTable(
        ['Método', 'Velocidad', 'Legibilidad', 'Uso de Memoria'],
        [
          ['Iterativo', 'Lento', 'Baja', 'Alta'],
          ['Vectorizado', 'Rápido', 'Alta', 'Baja'],
        ]
      ),
      ContentContractUtils.createParagraph(
        'Los arrays de NumPy son fundamentales para el análisis financiero eficiente. Su capacidad de vectorización permite procesar grandes volúmenes de datos de manera rápida y elegante.'
      ),
    ],
  };

  // Ejemplo de documento inválido (para demostrar validación)
  const invalidDocument: ContentDocument = {
    version: '1.0.0',
    locale: 'es',
    content_id: 'demo-document-002',
    meta: {
      topic: 'Documento con Errores',
      audience: 'Ejemplo',
      level: 'beginner',
      created_at: new Date().toISOString(),
    },
    blocks: [
      {
        id: 'block_1',
        type: 'heading',
        data: {
          text: 'Título muy largo que excede el límite de 100 caracteres permitidos para títulos en el contrato de contenido de Cursia',
          level: 4, // Nivel inválido (solo 1-3 permitidos)
        },
      },
      {
        id: 'block_1', // ID duplicado
        type: 'paragraph',
        data: {
          text: '', // Texto vacío
        },
      },
      {
        id: 'block_3',
        type: 'table',
        data: {
          headers: ['Col1', 'Col2'],
          rows: [
            ['Celda1'], // Solo 1 celda cuando debería tener 2
            ['Celda1', 'Celda2', 'Celda3'], // 3 celdas cuando debería tener 2
          ],
        },
      },
    ],
  };

  const [currentDocument, setCurrentDocument] = useState(validDocument);

  const validation = ContentContractValidator.validateDocument(currentDocument);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Contrato de Contenido - Demo
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Sistema determinista que garantiza:{' '}
          <strong>"si es H1 se vea como H1"</strong>
        </p>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Controles de Demostración</span>
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Documento Válido
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {validation.errors.length} Errores
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setCurrentDocument(validDocument)}
              variant={
                currentDocument === validDocument ? 'default' : 'outline'
              }
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Documento Válido
            </Button>
            <Button
              onClick={() => setCurrentDocument(invalidDocument)}
              variant={
                currentDocument === invalidDocument ? 'default' : 'outline'
              }
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Documento con Errores
            </Button>
            <Button
              onClick={() => setShowValidation(!showValidation)}
              variant={showValidation ? 'default' : 'outline'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {showValidation ? 'Ocultar' : 'Mostrar'} Validación
            </Button>
          </div>

          {validation.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700 dark:text-red-300">
                Errores de Validación:
              </h4>
              {validation.errors.map((error, index) => (
                <div
                  key={index}
                  className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/10 p-2 rounded border border-red-200 dark:border-red-800"
                >
                  {error}
                </div>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300">
                Advertencias:
              </h4>
              {validation.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/10 p-2 rounded border border-yellow-200 dark:border-yellow-800"
                >
                  {warning}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renderizado del documento */}
      <Card>
        <CardHeader>
          <CardTitle>Renderizado del Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractRenderer
            document={currentDocument}
            showValidation={showValidation}
          />
        </CardContent>
      </Card>

      {/* Información del contrato */}
      <Card>
        <CardHeader>
          <CardTitle>Características del Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">
                ✅ Ventajas
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>
                  • <strong>Determinismo:</strong> Un tipo = un componente
                  visual
                </li>
                <li>
                  • <strong>Consistencia:</strong> Cualquier curso se ve
                  ordenado
                </li>
                <li>
                  • <strong>Validación:</strong> Errores detectados antes del
                  renderizado
                </li>
                <li>
                  • <strong>Escalabilidad:</strong> Fácil agregar nuevos tipos
                </li>
                <li>
                  • <strong>Accesibilidad:</strong> Jerarquía clara y semántica
                </li>
                <li>
                  • <strong>Versionado:</strong> Compatibilidad hacia atrás
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-300">
                🔧 Tipos de Bloque
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>
                  • <code>heading</code> - Títulos (H1, H2, H3)
                </li>
                <li>
                  • <code>paragraph</code> - Párrafos de texto
                </li>
                <li>
                  • <code>list</code> - Listas numeradas o con viñetas
                </li>
                <li>
                  • <code>table</code> - Tablas estructuradas
                </li>
                <li>
                  • <code>quote</code> - Citas y referencias
                </li>
                <li>
                  • <code>code</code> - Bloques de código
                </li>
                <li>
                  • <code>callout</code> - Notas especiales
                </li>
                <li>
                  • <code>highlight</code> - Texto destacado
                </li>
                <li>
                  • <code>divider</code> - Separadores visuales
                </li>
                <li>
                  • <code>link</code> - Enlaces externos
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
