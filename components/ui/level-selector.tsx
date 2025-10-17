'use client';

import { CheckCircle2, LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LevelOption {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface LevelSelectorProps {
  options: LevelOption[];
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LevelSelector({
  options,
  value,
  onChange,
  className,
}: LevelSelectorProps) {
  return (
    <div className={cn('grid md:grid-cols-3 gap-6', className)}>
      {options.map(option => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group cursor-pointer',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md bg-white dark:bg-slate-800/50'
            )}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}

            <div className="space-y-4">
              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                  option.color,
                  isSelected ? 'scale-110' : 'group-hover:scale-105'
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <div>
                <h3
                  className={cn(
                    'text-lg font-bold mb-2',
                    isSelected
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-800 dark:text-slate-200'
                  )}
                >
                  {option.label}
                </h3>
                <p
                  className={cn(
                    'text-sm leading-relaxed',
                    isSelected
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {option.description}
                </p>
              </div>

              {/* Progress indicator */}
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 rounded-full',
                    isSelected
                      ? 'w-full bg-gradient-to-r ' + option.color
                      : 'w-0 group-hover:w-1/3 bg-gradient-to-r ' + option.color
                  )}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
