'use client';

import { Download, Home, Trophy, Share2, Copy, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface CertificateProps {
  userName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  topics?: string[];
  modules?: Array<{
    title: string;
    description?: string;
  }>;
  onSavePDF: () => void;
  onGoToDashboard: () => void;
}

export function Certificate({
  userName,
  courseName,
  completionDate,
  certificateId,
  topics = [],
  modules = [],
  onSavePDF,
  onGoToDashboard,
}: CertificateProps) {
  console.log('Certificate component - certificateId received:', certificateId);
  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate shareable link
  const shareableLink = `${window.location.origin}/verify-certificate/${certificateId}`;

  useEffect(() => {
    // Load external scripts for PDF generation
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const initializePDF = async () => {
      try {
        await Promise.all([
          loadScript(
            'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
          ),
          loadScript(
            'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
          ),
        ]);
      } catch (error) {
        console.error('Error loading PDF libraries:', error);
      }
    };

    initializePDF();
  }, []);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      // Wait for scripts to load
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;

      if (!jsPDF || !html2canvas) {
        throw new Error('PDF libraries not loaded');
      }

      const cert = certificateRef.current;

      // Wait for fonts and layout
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise(r => requestAnimationFrame(r));

      // Render certificate
      const scale = Math.max(2, window.devicePixelRatio || 2);
      const canvas = await html2canvas(cert, {
        scale,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        W,
        H,
        undefined,
        'FAST'
      );

      // Generate filename
      const cleanUserName = userName.trim().replace(/\s+/g, '_');
      const cleanCourseName = courseName
        .replace(/[""]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      pdf.save(`Certificado_${cleanUserName}_${cleanCourseName}.pdf`);

      toast({
        title: '¡PDF Descargado!',
        description: 'Tu certificado ha sido descargado exitosamente.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error al descargar',
        description: 'Hubo un problema al generar el PDF. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      // Fallback: try the original function
      onSavePDF();
    } finally {
      setIsDownloading(false);
    }
  };

  const copyShareableLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      toast({
        title: '¡Link copiado!',
        description:
          'El enlace del certificado ha sido copiado al portapapeles.',
      });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar el enlace. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const shareCertificate = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificado de ${userName}`,
          text: `¡Mira mi certificado de completación del curso "${courseName}" en Cursia!`,
          url: shareableLink,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          copyShareableLink();
        }
      }
    } else {
      copyShareableLink();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-green-600">
              ¡Felicitaciones!
            </h1>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-lg text-muted-foreground">
            Has completado exitosamente el curso
          </p>
        </div>

        {/* Certificate */}
        <div className="flex justify-center mb-8">
          <div className="certificate-container" ref={certificateRef}>
            <section className="page ribbons" id="cert">
              <div className="frame"></div>
              <div className="brand-word">
                <span className="curs">Curs</span>
                <span className="ia">ia</span>
              </div>

              <div className="inner">
                <header>
                  <div className="kicker">Certificado de completación</div>
                  <h1 className="title">{courseName.toUpperCase()}</h1>
                </header>

                <section className="centered-section">
                  <div className="presented">
                    El presente certificado se otorga a
                  </div>
                  <div className="recipient">{userName}</div>
                </section>

                <main>
                  {modules.length > 0 && (
                    <div className="centered-modules">
                      <h4>Contenido del curso:</h4>
                      {modules.map((module, index) => (
                        <div key={index} className="mb-2">
                          {module.title}
                        </div>
                      ))}
                    </div>
                  )}
                </main>

                <div className="meta">
                  <div className="centered-date">
                    <strong>Fecha:</strong>{' '}
                    {new Date(completionDate).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={downloadPDF}
            disabled={isDownloading}
            size="lg"
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            {isDownloading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar Certificado
              </>
            )}
          </Button>

          <Button
            onClick={shareCertificate}
            variant="outline"
            size="lg"
            className="px-8"
          >
            {linkCopied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir Certificado
              </>
            )}
          </Button>

          <Button
            onClick={onGoToDashboard}
            variant="outline"
            size="lg"
            className="px-8"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al Dashboard
          </Button>
        </div>

        {/* Share Link Info */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Enlace para compartir
            </h4>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono text-blue-600 dark:text-blue-400 border">
                {shareableLink}
              </code>
              <Button
                onClick={copyShareableLink}
                size="sm"
                variant="outline"
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Comparte este enlace para que otros puedan ver y verificar tu
              certificado
            </p>
          </div>
        </div>
      </div>

      {/* Certificate Styles */}
      <style jsx>{`
        .certificate-container {
          transform: scale(0.8);
          transform-origin: center;
        }

        :root {
          --primary: #1f6fd1;
          --primary-dark: #0f3a6f;
          --ink: #0b1220;
          --muted: #64748b;
        }

        .page {
          width: 297mm;
          height: 210mm;
          margin: 12px auto;
          position: relative;
          background: #fff;
          color: var(--ink);
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.15);
        }

        .ribbons::before,
        .ribbons::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
        }

        .ribbons::before {
          left: 0;
          top: 0;
          border-top: 36mm solid #1f6fd1;
          border-right: 36mm solid transparent;
          opacity: 0.95;
        }

        .ribbons::after {
          right: 0;
          bottom: 0;
          border-bottom: 36mm solid #0f3a6f;
          border-left: 36mm solid transparent;
          opacity: 0.95;
        }

        .frame {
          position: absolute;
          inset: 10mm;
          border-radius: 10mm;
          background:
            linear-gradient(#fff, #fff) padding-box,
            linear-gradient(135deg, #cbd5e1, #94a3b8) border-box;
          border: 3px solid transparent;
          box-shadow:
            inset 0 0 0 2px #f3f4f6,
            inset 0 8px 32px rgba(15, 58, 111, 0.08);
        }

        .inner {
          position: absolute;
          inset: 18mm 22mm;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          row-gap: 12mm;
        }

        .brand-word {
          position: absolute;
          right: 22mm;
          top: 16mm;
          font: 900 16pt/1 system-ui;
          letter-spacing: 0.02em;
        }

        .brand-word .curs {
          color: #0b1220;
        }

        .brand-word .ia {
          color: #1f6fd1;
        }

        .kicker {
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #64748b;
          font: 600 12pt/1.1 system-ui;
        }

        .title {
          margin: 8mm 0 4mm;
          font: 900 28pt/1.05 system-ui;
          text-align: center;
          word-wrap: break-word;
          hyphens: auto;
        }

        .subtitle {
          margin-top: 2mm;
          color: #64748b;
          font: 600 12pt/1.2 system-ui;
        }

        .presented {
          margin-top: 2mm;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #64748b;
          font: 700 10pt/1.1 system-ui;
        }

        .recipient {
          font:
            700 30pt/1.15 Georgia,
            'Times New Roman',
            serif;
          color: #0f3a6f;
        }

        .desc {
          margin-top: 6mm;
          font: 400 11pt/1.5 system-ui;
          color: #374151;
        }

        .desc h4 {
          margin: 4mm 0 2mm;
          font: 700 10pt/1.3 system-ui;
          color: #111827;
        }

        .desc strong {
          font-weight: 700;
          color: #0f3a6f;
        }

        .centered-section {
          text-align: center;
          margin: 6mm 0;
        }

        .centered-modules {
          text-align: center;
          margin: 4mm 0;
        }

        .centered-modules h4 {
          margin-bottom: 4mm;
          font: 700 12pt/1.3 system-ui;
          color: #111827;
        }

        .topics {
          margin-top: 8mm;
          padding: 8mm;
          border-radius: 8mm/9mm;
          background:
            linear-gradient(#fafafa, #fafafa) padding-box,
            repeating-linear-gradient(135deg, #e5e7eb 0 8px, #f3f4f6 8px 16px)
              border-box;
          border: 2px solid transparent;
          box-shadow: inset 0 1px 0 #fff;
        }

        .topics h4 {
          margin: 0 0 4mm;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font: 800 10.5pt/1.2 system-ui;
          color: #111827;
        }

        .topics ul {
          columns: 2;
          gap: 16mm;
          margin: 0;
          padding-left: 18px;
        }

        .topics li {
          break-inside: avoid;
          font: 500 11pt/1.5 system-ui;
          color: #1f2937;
        }

        .meta {
          margin-top: 8mm;
          display: flex;
          justify-content: center;
          padding: 0 10mm;
          font: 500 10.5pt/1.4 system-ui;
          color: #374151;
        }

        .centered-date {
          text-align: center;
        }
      `}</style>
    </div>
  );
}
