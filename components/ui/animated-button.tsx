'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  variant?: 'default' | 'premium' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  [key: string]: any;
}

export function AnimatedButton({
  children,
  isLoading = false,
  className,
  variant = 'premium',
  size = 'lg',
  ...props
}: AnimatedButtonProps) {
  const variants = {
    default: 'bg-primary hover:bg-primary/90',
    premium:
      'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-blue-500/25',
    gradient:
      'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-xl hover:shadow-emerald-500/25',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-12 py-6 text-xl',
  };

  return (
    <Button
      className={cn(
        'relative overflow-hidden border-0 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-3">
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            {variant === 'premium' && (
              <Sparkles className="h-5 w-5 animate-pulse" />
            )}
            {children}
          </>
        )}
      </span>
    </Button>
  );
}
