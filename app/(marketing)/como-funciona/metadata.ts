import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cómo funciona Cursia — Cursos personalizados con IA',
  description:
    'Descubre cómo Cursia crea cursos completos con IA, adaptados a tu nivel, tiempo y objetivos. Aprende con módulos, ejercicios y certificados.',
  openGraph: {
    title: 'Cómo funciona Cursia',
    description:
      'Descubre cómo Cursia crea cursos completos con IA, adaptados a tu nivel, tiempo y objetivos. Aprende con módulos, ejercicios y certificados.',
    type: 'website',
    images: [
      {
        url: '/og-cursia.png',
        width: 1200,
        height: 630,
        alt: 'Cómo funciona Cursia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cómo funciona Cursia',
    description:
      'Descubre cómo Cursia crea cursos completos con IA, adaptados a tu nivel, tiempo y objetivos.',
    images: ['/og-cursia.png'],
  },
  keywords: [
    'cursos con IA',
    'aprendizaje personalizado',
    'educación online',
    'cursos adaptativos',
    'certificados digitales',
    'plataforma educativa',
    'inteligencia artificial educativa',
  ],
  authors: [{ name: 'Cursia' }],
  creator: 'Cursia',
  publisher: 'Cursia',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
