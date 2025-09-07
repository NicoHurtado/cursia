'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, Home, Flame } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { APP_CONFIG, NAVIGATION } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavbarProps {
  variant?: 'marketing' | 'app';
}

export function Navbar({ variant = 'marketing' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const navigation = NAVIGATION[variant];
  const [streak, setStreak] = useState<number>(0);

  // Lazy import to avoid SSR localStorage issues
  if (typeof window !== 'undefined') {
    try {
      const { touchStreak } = require('@/lib/streak');
      const data = touchStreak();
      if (streak !== data.count) setStreak(data.count);
    } catch {}
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href={variant === 'app' && session ? '/dashboard' : '/'}
            className="flex items-center"
          >
            <span className="text-2xl font-bold">
              <span className="text-foreground">Curs</span>
              <span className="text-blue-600">ia</span>
            </span>
          </Link>

          {variant === 'marketing' && (
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {variant === 'marketing' ? (
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              {/* Dashboard button - only show on course pages */}
              {pathname.startsWith('/courses/') && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/courses">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
              {/* Streak button */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/streak" className="flex items-center">
                  <Flame className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm font-medium">{streak} días</span>
                </Link>
              </Button>
              {/* Profile */}
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/profile">{session?.user?.name || 'Perfil'}</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            {variant === 'marketing' ? (
              <>
                {navigation.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Dashboard button for mobile - only show on course pages */}
                {pathname.startsWith('/courses/') && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link href="/dashboard/courses">
                      <Home className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/streak">
                    <Flame className="h-4 w-4 mr-2 text-orange-500" />
                    {streak} días de racha
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/dashboard/profile">{session?.user?.name || 'Perfil'}</Link>
                </Button>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Tema</span>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
