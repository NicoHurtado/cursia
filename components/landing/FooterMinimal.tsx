import Link from 'next/link';

export function FooterMinimal() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-lg font-semibold">
              <span className="text-foreground">Curs</span>
              <span className="text-blue-600">ia</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-8 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors duration-200"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors duration-200"
            >
              Términos
            </Link>
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors duration-200"
            >
              Contacto
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © 2024 <span className="text-foreground">Curs</span>
            <span className="text-blue-600">ia</span>. Todos los derechos
            reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
