'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EnhancedCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  variant?: 'default' | 'premium' | 'glass';
  gradient?: string;
}

export function EnhancedCard({
  children,
  title,
  icon: Icon,
  iconColor = 'from-blue-500 to-purple-500',
  className,
  variant = 'premium',
  gradient,
}: EnhancedCardProps) {
  const variants = {
    default:
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    premium:
      'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-xl',
    glass:
      'bg-white/20 dark:bg-slate-800/20 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-2xl',
  };

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]',
        variants[variant],
        className
      )}
    >
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            {Icon && (
              <div
                className={cn(
                  'p-2 rounded-xl bg-gradient-to-r',
                  gradient || iconColor
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <span
              className={
                gradient
                  ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`
                  : ''
              }
            >
              {title}
            </span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
