'use client';

import { X, LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InterestCategory {
  name: string;
  icon: LucideIcon;
  color: string;
  interests: string[];
}

interface InterestSelectorProps {
  categories: InterestCategory[];
  selectedInterests: string[];
  maxSelections?: number;
  onInterestAdd: (interest: string) => void;
  onInterestRemove: (interest: string) => void;
  selectedCategory?: string | null;
  onCategorySelect: (category: string | null) => void;
}

export function InterestSelector({
  categories,
  selectedInterests,
  maxSelections = 6,
  onInterestAdd,
  onInterestRemove,
  selectedCategory,
  onCategorySelect,
}: InterestSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tus intereses seleccionados:
          </h4>
          <div className="flex flex-wrap gap-3">
            {selectedInterests.map(interest => (
              <Badge
                key={interest}
                variant="secondary"
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-slate-700 dark:text-slate-300 border-0 rounded-full hover:shadow-md transition-all duration-200"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => onInterestRemove(interest)}
                  className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-1 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
          Categorías disponibles:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map(category => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.name;

            return (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  onCategorySelect(isSelected ? null : category.name)
                }
                className={cn(
                  'p-4 rounded-2xl border-2 transition-all duration-300 group hover:shadow-lg',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md scale-105'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm hover:scale-102'
                )}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl mx-auto w-8 h-8 flex items-center justify-center">
                    <Icon
                      className={cn(
                        'h-8 w-8 transition-colors',
                        isSelected ? 'text-blue-500' : category.color
                      )}
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {category.interests.length} opciones
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interest Options */}
      {selectedCategory && (
        <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-in slide-in-from-top-2 duration-300">
          <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
            Selecciona de {selectedCategory}:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories
              .find(cat => cat.name === selectedCategory)
              ?.interests.map(interest => {
                const isSelected = selectedInterests.includes(interest);
                const canSelect =
                  !isSelected && selectedInterests.length < maxSelections;

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => canSelect && onInterestAdd(interest)}
                    disabled={!canSelect}
                    className={cn(
                      'p-3 rounded-xl border transition-all duration-200 text-sm font-medium hover:shadow-md',
                      isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md scale-105'
                        : canSelect
                          ? 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-700 dark:text-slate-300 hover:scale-102'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    )}
                  >
                    {interest}
                  </button>
                );
              })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedInterests.length}/{maxSelections} intereses seleccionados
          </p>
        </div>
      )}
    </div>
  );
}
