import { Instagram, Mail } from 'lucide-react';
import Link from 'next/link';

import { APP_CONFIG } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-2xl bg-primary" />
              <span className="text-xl font-bold">{APP_CONFIG.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Genera cursos completos con IA en segundos
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.instagram.com/cursia.labs/"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:prompt2course@gmail.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#inicio"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Todo sobre Cursia
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Información legal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © 2024 {APP_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
