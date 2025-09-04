import Image from 'next/image';

interface BrowserFrameProps {
  imageSrc?: string;
}

export function BrowserFrame({
  imageSrc = '/mock/course-preview.svg',
}: BrowserFrameProps) {
  return (
    <div className="relative max-w-5xl mx-auto mt-20">
      {/* Browser frame */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border/50 overflow-hidden">
        {/* Browser header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
          {/* Browser controls */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>

          {/* Address bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm text-muted-foreground">
              cursia.app/course/python-fundamentals
            </div>
          </div>

          {/* Tab indicator */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
            <div className="w-2 h-2 rounded-full bg-primary"></div>
          </div>
        </div>

        {/* Browser content */}
        <div className="relative">
          <Image
            src={imageSrc}
            alt="Vista previa del curso generado con IA mostrando módulos, contenido y certificado"
            width={1200}
            height={720}
            className="w-full h-auto"
            role="img"
            aria-label="Captura de pantalla de un curso completo generado automáticamente con módulos, quizzes y certificado"
            priority
          />

          {/* Overlay gradient for better visual effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
