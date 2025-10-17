'use client';

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
  Edit3,
  Check,
} from 'lucide-react';
import { useState } from 'react';

import { InterestSelector } from '@/components/auth/InterestSelector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Interest {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const interestMap: Record<string, Interest> = {
  tecnologia: {
    id: 'tecnologia',
    name: 'Tecnología e Innovación',
    icon: Brain,
    color: 'text-blue-500',
  },
  musica: {
    id: 'musica',
    name: 'Música y Artes Escénicas',
    icon: Music,
    color: 'text-purple-500',
  },
  ciencia: {
    id: 'ciencia',
    name: 'Ciencia y Conocimiento',
    icon: Microscope,
    color: 'text-green-500',
  },
  historia: {
    id: 'historia',
    name: 'Historia y Humanidades',
    icon: BookOpen,
    color: 'text-amber-500',
  },
  arte: {
    id: 'arte',
    name: 'Arte y Diseño',
    icon: Palette,
    color: 'text-pink-500',
  },
  deporte: {
    id: 'deporte',
    name: 'Deporte y Actividad Física',
    icon: Dumbbell,
    color: 'text-orange-500',
  },
  idiomas: {
    id: 'idiomas',
    name: 'Idiomas y Comunicación',
    icon: Languages,
    color: 'text-indigo-500',
  },
  viajes: {
    id: 'viajes',
    name: 'Viajes y Cultura Global',
    icon: Globe,
    color: 'text-cyan-500',
  },
  cocina: {
    id: 'cocina',
    name: 'Cocina y Gastronomía',
    icon: ChefHat,
    color: 'text-red-500',
  },
  salud: {
    id: 'salud',
    name: 'Salud y Bienestar',
    icon: Heart,
    color: 'text-rose-500',
  },
  negocios: {
    id: 'negocios',
    name: 'Negocios y Finanzas',
    icon: TrendingUp,
    color: 'text-emerald-500',
  },
  educacion: {
    id: 'educacion',
    name: 'Educación y Aprendizaje',
    icon: GraduationCap,
    color: 'text-violet-500',
  },
  naturaleza: {
    id: 'naturaleza',
    name: 'Naturaleza y Medio Ambiente',
    icon: Leaf,
    color: 'text-lime-500',
  },
  politica: {
    id: 'politica',
    name: 'Política y Sociedad',
    icon: Users,
    color: 'text-slate-500',
  },
  videojuegos: {
    id: 'videojuegos',
    name: 'Videojuegos y Entretenimiento Digital',
    icon: Gamepad2,
    color: 'text-fuchsia-500',
  },
  automoviles: {
    id: 'automoviles',
    name: 'Automóviles y Transporte',
    icon: Car,
    color: 'text-sky-500',
  },
  hogar: {
    id: 'hogar',
    name: 'Hogar y Estilo de Vida',
    icon: Home,
    color: 'text-teal-500',
  },
  relaciones: {
    id: 'relaciones',
    name: 'Relaciones y Desarrollo Personal',
    icon: UserPlus,
    color: 'text-amber-600',
  },
  fotografia: {
    id: 'fotografia',
    name: 'Fotografía y Audiovisual',
    icon: Camera,
    color: 'text-gray-500',
  },
  animales: {
    id: 'animales',
    name: 'Animales y Mascotas',
    icon: PawPrint,
    color: 'text-yellow-500',
  },
};

interface InterestsDisplayProps {
  interests: string[];
  onInterestsUpdate?: (interests: string[]) => void;
  editable?: boolean;
  className?: string;
}

export function InterestsDisplay({
  interests,
  onInterestsUpdate,
  editable = false,
  className,
}: InterestsDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>(interests);

  const handleSave = async () => {
    if (onInterestsUpdate) {
      await onInterestsUpdate(editedInterests);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInterests(interests);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Editar Intereses
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>

        <InterestSelector
          selectedInterests={editedInterests}
          onInterestChange={setEditedInterests}
          maxSelections={5}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Tus Intereses
        </h3>
        {editable && onInterestsUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      {interests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No has seleccionado intereses aún.</p>
          {editable && onInterestsUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="mt-2"
            >
              Seleccionar Intereses
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {interests.map(interestId => {
            const interest = interestMap[interestId];
            if (!interest) return null;

            const Icon = interest.icon;

            return (
              <div
                key={interestId}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600"
              >
                <div className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                  <Icon className={cn('h-5 w-5', interest.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                    {interest.name}
                  </h4>
                </div>
                <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {interests.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Estos intereses se usan para personalizar tus cursos y
          recomendaciones.
        </p>
      )}
    </div>
  );
}
