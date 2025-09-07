export const APP_CONFIG = {
  name: 'Cursia',
  description: 'A modern Next.js application with TypeScript and TailwindCSS',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
} as const;

export const NAVIGATION = {
  marketing: [
    { name: 'Inicio', href: '/#inicio' },
    { name: 'Cómo funciona', href: '/#roadmap' },
  ],
  app: [{ name: 'Dashboard', href: '/dashboard' }],
} as const;

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com',
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
} as const;
