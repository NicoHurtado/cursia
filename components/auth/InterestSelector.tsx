'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain,
  Music,
  Microscope,
  BookOpen,
  Palette,
  Dumbbell,
  Languages,
  Globe,
  ChefHat,
  Heart,
  TrendingUp,
  GraduationCap,
  Leaf,
  Users,
  Gamepad2,
  Car,
  Home,
  UserPlus,
  Camera,
  PawPrint,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

interface Interest {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  subcategories: string[];
}

const interestCategories: Interest[] = [
  {
    id: 'tecnologia',
    name: 'Tecnología e Innovación',
    description:
      'Inteligencia Artificial, robótica, software, gadgets, internet, programación.',
    icon: Brain,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    subcategories: [
      'Inteligencia Artificial',
      'Robótica',
      'Software',
      'Gadgets',
      'Internet',
      'Programación',
    ],
  },
  {
    id: 'musica',
    name: 'Música y Artes Escénicas',
    description: 'Instrumentos, canto, géneros musicales, baile, teatro, cine.',
    icon: Music,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    subcategories: [
      'Instrumentos',
      'Canto',
      'Géneros Musicales',
      'Baile',
      'Teatro',
      'Cine',
    ],
  },
  {
    id: 'ciencia',
    name: 'Ciencia y Conocimiento',
    description:
      'Física, química, biología, astronomía, matemáticas, geología.',
    icon: Microscope,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    subcategories: [
      'Física',
      'Química',
      'Biología',
      'Astronomía',
      'Matemáticas',
      'Geología',
    ],
  },
  {
    id: 'historia',
    name: 'Historia y Humanidades',
    description:
      'Filosofía, literatura, historia universal, religión, antropología.',
    icon: BookOpen,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    subcategories: [
      'Filosofía',
      'Literatura',
      'Historia Universal',
      'Religión',
      'Antropología',
    ],
  },
  {
    id: 'arte',
    name: 'Arte y Diseño',
    description:
      'Pintura, escultura, arquitectura, fotografía, diseño gráfico, moda.',
    icon: Palette,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    subcategories: [
      'Pintura',
      'Escultura',
      'Arquitectura',
      'Fotografía',
      'Diseño Gráfico',
      'Moda',
    ],
  },
  {
    id: 'deporte',
    name: 'Deporte y Actividad Física',
    description:
      'Fútbol, baloncesto, natación, gimnasia, artes marciales, running, yoga.',
    icon: Dumbbell,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    subcategories: [
      'Fútbol',
      'Baloncesto',
      'Natación',
      'Gimnasia',
      'Artes Marciales',
      'Running',
      'Yoga',
    ],
  },
  {
    id: 'idiomas',
    name: 'Idiomas y Comunicación',
    description:
      'Aprendizaje de idiomas, escritura, oratoria, debate, periodismo.',
    icon: Languages,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    subcategories: [
      'Aprendizaje de Idiomas',
      'Escritura',
      'Oratoria',
      'Debate',
      'Periodismo',
    ],
  },
  {
    id: 'viajes',
    name: 'Viajes y Cultura Global',
    description:
      'Turismo, culturas del mundo, gastronomía, tradiciones, geografía.',
    icon: Globe,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    subcategories: [
      'Turismo',
      'Culturas del Mundo',
      'Gastronomía',
      'Tradiciones',
      'Geografía',
    ],
  },
  {
    id: 'cocina',
    name: 'Cocina y Gastronomía',
    description:
      'Recetas, técnicas culinarias, pastelería, bebidas, nutrición.',
    icon: ChefHat,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    subcategories: [
      'Recetas',
      'Técnicas Culinarias',
      'Pastelería',
      'Bebidas',
      'Nutrición',
    ],
  },
  {
    id: 'salud',
    name: 'Salud y Bienestar',
    description:
      'Medicina, psicología, nutrición, fitness, mindfulness, meditación.',
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
    subcategories: [
      'Medicina',
      'Psicología',
      'Nutrición',
      'Fitness',
      'Mindfulness',
      'Meditación',
    ],
  },
  {
    id: 'negocios',
    name: 'Negocios y Finanzas',
    description:
      'Emprendimiento, liderazgo, marketing, inversión, economía, ventas.',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    subcategories: [
      'Emprendimiento',
      'Liderazgo',
      'Marketing',
      'Inversión',
      'Economía',
      'Ventas',
    ],
  },
  {
    id: 'educacion',
    name: 'Educación y Aprendizaje',
    description: 'Métodos de estudio, pedagogía, didáctica, investigación.',
    icon: GraduationCap,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    subcategories: [
      'Métodos de Estudio',
      'Pedagogía',
      'Didáctica',
      'Investigación',
    ],
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza y Medio Ambiente',
    description:
      'Ecología, sostenibilidad, animales, plantas, energías renovables.',
    icon: Leaf,
    color: 'text-lime-500',
    bgColor: 'bg-lime-50 dark:bg-lime-950/20',
    borderColor: 'border-lime-200 dark:border-lime-800',
    subcategories: [
      'Ecología',
      'Sostenibilidad',
      'Animales',
      'Plantas',
      'Energías Renovables',
    ],
  },
  {
    id: 'politica',
    name: 'Política y Sociedad',
    description:
      'Gobierno, leyes, derechos humanos, sociología, relaciones internacionales.',
    icon: Users,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50 dark:bg-slate-950/20',
    borderColor: 'border-slate-200 dark:border-slate-800',
    subcategories: [
      'Gobierno',
      'Leyes',
      'Derechos Humanos',
      'Sociología',
      'Relaciones Internacionales',
    ],
  },
  {
    id: 'videojuegos',
    name: 'Videojuegos y Entretenimiento Digital',
    description: 'eSports, consolas, desarrollo de juegos, cultura geek.',
    icon: Gamepad2,
    color: 'text-fuchsia-500',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',
    borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
    subcategories: [
      'eSports',
      'Consolas',
      'Desarrollo de Juegos',
      'Cultura Geek',
    ],
  },
  {
    id: 'automoviles',
    name: 'Automóviles y Transporte',
    description:
      'Autos, motos, bicicletas, trenes, aviones, exploración espacial.',
    icon: Car,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/20',
    borderColor: 'border-sky-200 dark:border-sky-800',
    subcategories: [
      'Autos',
      'Motos',
      'Bicicletas',
      'Trenes',
      'Aviones',
      'Exploración Espacial',
    ],
  },
  {
    id: 'hogar',
    name: 'Hogar y Estilo de Vida',
    description:
      'Decoración, jardinería, bricolaje, minimalismo, moda de vida.',
    icon: Home,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    subcategories: [
      'Decoración',
      'Jardinería',
      'Bricolaje',
      'Minimalismo',
      'Moda de Vida',
    ],
  },
  {
    id: 'relaciones',
    name: 'Relaciones y Desarrollo Personal',
    description:
      'Habilidades sociales, inteligencia emocional, filosofía de vida.',
    icon: UserPlus,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    subcategories: [
      'Habilidades Sociales',
      'Inteligencia Emocional',
      'Filosofía de Vida',
    ],
  },
  {
    id: 'fotografia',
    name: 'Fotografía y Audiovisual',
    description: 'Cine, edición de video, animación, producción multimedia.',
    icon: Camera,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    subcategories: [
      'Cine',
      'Edición de Video',
      'Animación',
      'Producción Multimedia',
    ],
  },
  {
    id: 'animales',
    name: 'Animales y Mascotas',
    description: 'Cuidado, entrenamiento, especies, comportamiento.',
    icon: PawPrint,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    subcategories: ['Cuidado', 'Entrenamiento', 'Especies', 'Comportamiento'],
  },
];

interface InterestSelectorProps {
  selectedInterests: string[];
  onInterestChange: (interests: string[]) => void;
  maxSelections?: number;
  className?: string;
}

export function InterestSelector({
  selectedInterests,
  onInterestChange,
  maxSelections = 5,
  className,
}: InterestSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleInterestToggle = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onInterestChange(selectedInterests.filter(id => id !== interestId));
    } else if (selectedInterests.length < maxSelections) {
      onInterestChange([...selectedInterests, interestId]);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleCategoryClick = (category: any) => {
    const isSelected = selectedInterests.includes(category.id);
    const canSelect = !isSelected && selectedInterests.length < maxSelections;
    const isExpanded = expandedCategory === category.id;

    // Si está expandido, contraer
    if (isExpanded) {
      toggleCategory(category.id);
      return;
    }

    // Si está seleccionado, deseleccionar
    if (isSelected) {
      handleInterestToggle(category.id);
      return;
    }

    // Si se puede seleccionar, seleccionar
    if (canSelect) {
      handleInterestToggle(category.id);
      return;
    }

    // Si no se puede seleccionar, expandir para mostrar subcategorías
    toggleCategory(category.id);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Selecciona tus Intereses
        </h2>
        <p className="text-muted-foreground">
          Elige hasta {maxSelections} temas que te interesen para personalizar
          tus cursos
        </p>
        <div className="text-sm text-muted-foreground">
          {selectedInterests.length}/{maxSelections} seleccionados
        </div>
      </div>

      {/* Selected Interests Display */}
      {selectedInterests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Tus intereses seleccionados:
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map(interestId => {
              const interest = interestCategories.find(
                cat => cat.id === interestId
              );
              if (!interest) return null;

              return (
                <div
                  key={interestId}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  <interest.icon className="h-4 w-4" />
                  {interest.name}
                  <button
                    onClick={() => handleInterestToggle(interestId)}
                    className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full p-1 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interest Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interestCategories.map(category => {
          const isSelected = selectedInterests.includes(category.id);
          const isExpanded = expandedCategory === category.id;
          const canSelect =
            !isSelected && selectedInterests.length < maxSelections;

          return (
            <div
              key={category.id}
              className={cn(
                'rounded-2xl border-2 transition-all duration-200 overflow-hidden',
                isSelected
                  ? `${category.borderColor} ${category.bgColor} shadow-lg scale-105`
                  : canSelect
                    ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:scale-102'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-60'
              )}
            >
              {/* Category Header */}
              <button
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  'w-full p-4 text-left transition-all duration-200',
                  'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-xl',
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                          : category.bgColor
                      )}
                    >
                      <category.icon
                        className={cn(
                          'h-5 w-5',
                          isSelected ? 'text-white' : category.color
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Subcategories */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-3">
                    Subcategorías:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {category.subcategories.map((subcategory, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                      >
                        {subcategory}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection Limit Warning */}
      {selectedInterests.length >= maxSelections && (
        <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Has alcanzado el límite de {maxSelections} intereses. Deselecciona
            uno para elegir otro.
          </p>
        </div>
      )}
    </div>
  );
}
