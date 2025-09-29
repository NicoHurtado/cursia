'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  Calendar,
  User,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface CertificateVerificationProps {
  certificateId: string;
}

interface CertificateData {
  id: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  courseDescription: string;
  completionDate: string;
  issuedAt: string;
}

export function CertificateVerification({
  certificateId,
}: CertificateVerificationProps) {
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'valid' | 'invalid' | 'error'
  >('loading');
  const [certificateData, setCertificateData] =
    useState<CertificateData | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await fetch(
          `/api/certificates/${certificateId}/verify`
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setVerificationStatus('valid');
          setCertificateData(data.certificate);
        } else {
          setVerificationStatus('invalid');
        }
      } catch (error) {
        console.error('Error during certificate verification:', error);
        setVerificationStatus('error');
      }
    };

    verifyCertificate();
  }, [certificateId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewCourse = () => {
    // Redirect to Cursia homepage for new users to register or login
    window.open('/', '_blank');
  };

  if (verificationStatus === 'loading') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Verificando certificado...
          </h2>
          <p className="text-muted-foreground text-center">
            Validando la autenticidad del certificado
          </p>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <Card className="w-full max-w-2xl mx-auto border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-red-700">
            Error de verificación
          </h2>
          <p className="text-muted-foreground text-center mb-4">
            No se pudo verificar el certificado. Por favor, inténtalo de nuevo.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === 'invalid') {
    return (
      <Card className="w-full max-w-2xl mx-auto border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-red-700">
            Certificado no válido
          </h2>
          <p className="text-muted-foreground text-center">
            El certificado con ID{' '}
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {certificateId}
            </code>{' '}
            no existe o no es válido.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-green-700">
              Certificado Válido
            </CardTitle>
            <Badge
              variant="secondary"
              className="mt-1 bg-green-100 text-green-800"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Certificate Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Certificado de Completación
            </h3>
          </div>

          <div className="space-y-4">
            {/* Student Info */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {certificateData?.userName}
                </p>
                <p className="text-sm text-muted-foreground">Estudiante</p>
              </div>
            </div>

            {/* Course Info */}
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {certificateData?.courseName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Curso completado
                </p>
              </div>
            </div>

            {/* Completion Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {certificateData &&
                    formatDate(certificateData.completionDate)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Fecha de completación
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate ID */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">
            ID del Certificado:
          </p>
          <code className="bg-background px-3 py-2 rounded border text-sm font-mono">
            {certificateId}
          </code>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleViewCourse} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir a Cursia
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
          >
            Página Principal
          </Button>
        </div>

        {/* Issuer Info */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Emitido por <strong>Cursia</strong> - Plataforma de Aprendizaje
            Online
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Este certificado ha sido verificado y es auténtico
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
