'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Clock, Star, Trophy } from 'lucide-react';

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Certificaciones</h1>
        <p className="text-muted-foreground">
          Tus logros y certificados de cursos completados
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6">
            <Award className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">¡Próximamente!</h2>
          
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Estamos trabajando en un sistema de certificaciones que te permitirá obtener 
            certificados oficiales al completar tus cursos.
          </p>

          <Badge variant="secondary" className="mb-6">
            <Clock className="h-3 w-3 mr-1" />
            En desarrollo
          </Badge>

          {/* Features Preview */}
          <div className="grid gap-4 md:grid-cols-3 w-full max-w-2xl">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Certificados Oficiales</h3>
              <p className="text-sm text-muted-foreground">
                Obtén certificados verificables al completar cursos
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Logros Especiales</h3>
              <p className="text-sm text-muted-foreground">
                Desbloquea insignias por logros únicos
              </p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Portafolio Digital</h3>
              <p className="text-sm text-muted-foreground">
                Comparte tus logros en redes sociales
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future certificates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Próximas Funcionalidades</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certificado de Completación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Certificado oficial al completar cualquier curso
              </p>
            </CardContent>
          </Card>
          
          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Certificado de Excelencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Certificado especial por obtener 90%+ en todos los quizzes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
