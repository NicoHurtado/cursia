'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, Home } from 'lucide-react';
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-2xl bg-primary" />
            <span className="text-xl font-bold">{APP_CONFIG.name}</span>
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
              <span className="text-sm font-medium text-foreground">
                {session?.user?.name || 'Usuario'}
              </span>
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
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/dashboard/courses">
                      <Home className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {session?.user?.name || 'Usuario'}
                  </span>
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
