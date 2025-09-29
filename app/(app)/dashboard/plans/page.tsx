'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Zap, Crown, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { UserPlan, PLAN_NAMES, PLAN_PRICES } from '@/lib/plans';

const plans = [
  {
    id: UserPlan.FREE,
    name: 'Plan Gratuito',
    price: '$0',
    period: '/mes',
    description: 'Ideal para probar la plataforma',
    icon: CreditCard,
    color: 'from-gray-500 to-gray-600',
    features: [
      { text: '1 curso completo al mes', included: true },
      { text: 'Acceso ilimitado a cursos creados', included: true },
      { text: 'Lecciones + videos + quizzes', included: true },
      { text: 'Sin certificado', included: false },
      { text: 'Sin acceso a comunidad', included: false },
      { text: 'Sin posibilidad de publicar cursos', included: false },
    ],
    popular: false,
    cta: 'Plan Actual',
  },
  {
    id: UserPlan.APRENDIZ,
    name: 'Plan Aprendiz',
    price: '$29.900',
    period: '/mes',
    description: 'Perfecto para iniciar tu viaje de aprendizaje',
    icon: Star,
    color: 'from-blue-500 to-blue-600',
    features: [
      { text: '5 cursos al mes + 2 de bonificación', included: true },
      { text: 'Acceso ilimitado a cursos creados', included: true },
      { text: 'Lecciones + videos + quizzes', included: true },
      {
        text: 'Diplomas personalizados descargables y verificables',
        included: true,
      },
      { text: 'Sin acceso a comunidad', included: false },
      { text: 'Sin posibilidad de publicar cursos', included: false },
    ],
    popular: false,
    cta: 'Actualizar a Aprendiz',
  },
  {
    id: UserPlan.EXPERTO,
    name: 'Plan Experto',
    price: '$49.900',
    period: '/mes',
    description:
      'Para los más interesados en aprender y conectar con la comunidad',
    icon: Zap,
    color: 'from-purple-500 to-purple-600',
    features: [
      { text: '10 cursos al mes + 3 de bonificación', included: true },
      { text: 'Todo lo del Plan Aprendiz', included: true },
      { text: 'Acceso a todos los cursos de la comunidad', included: true },
      { text: 'Diplomas premium con verificación', included: true },
      { text: 'Soporte prioritario (respuesta rápida)', included: true },
      { text: 'Sin posibilidad de publicar cursos', included: false },
    ],
    popular: true,
    cta: 'Prueba Gratuita 7 Días',
    trialOffer: true,
  },
  {
    id: UserPlan.MAESTRO,
    name: 'Plan Maestro',
    price: '$69.900',
    period: '/mes',
    description: 'Para educadores y creadores de contenido',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    features: [
      {
        text: '20 cursos al mes + 5 de bonificación exclusiva',
        included: true,
      },
      { text: 'Todo lo del Plan Experto', included: true },
      { text: 'Publica y comparte tus cursos en la comunidad', included: true },
      { text: 'Soporte VIP 24/7', included: true },
    ],
    popular: false,
    cta: 'Actualizar a Maestro',
  },
];

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<UserPlan | null>(null);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/user/plan');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.currentPlan);
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleUpgrade = async (planId: UserPlan) => {
    if (planId === currentPlan) {
      toast({
        title: 'Plan Actual',
        description: 'Ya tienes este plan activo.',
      });
      return;
    }

    console.log('Attempting to upgrade to plan:', planId);
    setIsUpgrading(planId);

    try {
      const requestBody = { plan: planId };
      console.log('Sending request body:', requestBody);

      const response = await fetch('/api/user/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        setCurrentPlan(planId);
        toast({
          title: '¡Plan Actualizado!',
          description: data.message,
        });
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        toast({
          title: 'Error',
          description: error.error || 'No se pudo actualizar el plan.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al actualizar el plan.',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-amber-600 bg-clip-text text-transparent mb-6 leading-normal pb-2">
            Elige tu Plan de Aprendizaje
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Desbloquea todo el potencial de la educación personalizada con IA.
            Desde principiantes hasta maestros, tenemos el plan perfecto para
            ti.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map(plan => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;
            const isPlanUpgrading = isUpgrading === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-full',
                  plan.popular && 'ring-2 ring-purple-500 shadow-2xl scale-105',
                  isCurrentPlan &&
                    'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20',
                  selectedPlan === plan.id && 'ring-2 ring-blue-500'
                )}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1">
                      Más Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
                      Plan Actual
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div
                    className={cn(
                      'w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r flex items-center justify-center',
                      plan.color
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span
                          className={cn(
                            'text-xs',
                            feature.included
                              ? 'text-muted-foreground'
                              : 'text-red-500 line-through'
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="flex justify-center">
                  <Button
                    className={cn(
                      'w-full h-10 text-sm font-semibold transition-all duration-300',
                      isCurrentPlan
                        ? 'bg-green-500 hover:bg-green-600'
                        : plan.popular
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isPlanUpgrading || isCurrentPlan}
                  >
                    {isPlanUpgrading
                      ? 'Actualizando...'
                      : isCurrentPlan
                        ? 'Plan Actual'
                        : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Trust Signals Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
              Tu Tranquilidad es Nuestra Prioridad
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Cancela en Cualquier Momento
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sin cargos ocultos ni compromisos a largo plazo
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Pagos 100% Seguros
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Protección garantizada con Wompi y encriptación SSL
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Sin Compromiso
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Prueba sin riesgo, cancela cuando quieras
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  ⚡ Prueba Gratuita de 7 Días en Plan Experto
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                <strong>Tu plan estrella</strong> - Prueba todas las
                funcionalidades premium sin compromiso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
