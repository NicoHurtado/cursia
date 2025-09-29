'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Download,
  ExternalLink,
  Calendar,
  Loader2,
  Award,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { downloadCertificatePDF } from '@/lib/certificate-pdf';

interface Certificate {
  id: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    description: string;
  };
  completedAt: string;
  createdAt: string;
  verificationUrl: string;
}

export default function CertificatesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user?.id) {
      loadCertificates();
    }
  }, [session?.user?.id]);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/certificates');

      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
      } else {
        console.error('Failed to load certificates');
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (certificate: Certificate) => {
    downloadCertificatePDF({
      userName: session?.user?.name || 'Usuario',
      courseName: certificate.course.title,
      completionDate: certificate.completedAt,
      certificateId: certificate.id,
    });

    toast({
      title: 'Descargando certificado',
      description: 'El certificado se está descargando como PDF.',
    });
  };

  const handleViewVerification = (certificate: Certificate) => {
    window.open(certificate.verificationUrl, '_blank');
  };

  const handleCopyLink = async (certificate: Certificate) => {
    try {
      await navigator.clipboard.writeText(certificate.verificationUrl);
      setCopiedIds(prev => new Set(prev).add(certificate.id));

      toast({
        title: 'Enlace copiado',
        description: 'El enlace de verificación se ha copiado al portapapeles.',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(certificate.id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el enlace.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-lg text-muted-foreground">
              Cargando certificados...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Mis Certificados
            </h1>
            <p className="text-muted-foreground">
              Certificados de cursos completados exitosamente
            </p>
          </div>
        </div>

        {certificates.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              {certificates.length} certificado
              {certificates.length !== 1 ? 's' : ''} obtenido
              {certificates.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Trophy className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No tienes certificados aún
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Completa cursos para obtener certificados que demuestren tus
              logros y conocimientos.
            </p>
            <Button
              onClick={() => (window.location.href = '/dashboard/courses')}
            >
              Ver mis cursos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(certificate => (
            <Card
              key={certificate.id}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">
                        Certificado de Completación
                      </CardTitle>
                      <Badge variant="outline" className="mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Course Info */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {certificate.course.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {certificate.course.description}
                  </p>
                </div>

                {/* Completion Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Completado el {formatDate(certificate.completedAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => handleDownloadPDF(certificate)}
                    className="w-full flex items-center gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVerification(certificate)}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Verificar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(certificate)}
                      className="flex items-center gap-2"
                    >
                      {copiedIds.has(certificate.id) ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
