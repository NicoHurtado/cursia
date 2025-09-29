import { CertificateVerification } from '@/components/certificate/CertificateVerification';

interface CertificateVerificationPageProps {
  params: Promise<{
    certificateId: string;
  }>;
}

export default async function CertificateVerificationPage({
  params,
}: CertificateVerificationPageProps) {
  const { certificateId } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Verificación de Certificado
          </h1>
          <p className="text-muted-foreground">
            Valida la autenticidad de un certificado de Cursia
          </p>
        </div>

        <CertificateVerification certificateId={certificateId} />

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <a href="/signup" className="text-primary hover:underline">
              Regístrate gratis
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
