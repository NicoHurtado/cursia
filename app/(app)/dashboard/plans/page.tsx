'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Users, Globe, Award, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { UserPlan, PLAN_NAMES, PLAN_PRICES } from '@/lib/plans';

const plans = [
  {
    id: UserPlan.FREE,
    name: 'Plan Gratuito',
    price: '$0',
    period: '/mes',
    description: 'Perfecto para probar la plataforma',
    icon: CreditCard,
    color: 'from-gray-500 to-gray-600',
    features: [
      '1 curso al mes',
      'Funcionalidades básicas',
      'Soporte comunitario'
    ],
    popular: false,
    cta: 'Plan Actual'
  },
  {
    id: UserPlan.APRENDIZ,
    name: 'Plan Aprendiz',
    price: '$29.900',
    period: '/mes',
    description: 'Perfecto para comenzar tu viaje de aprendizaje',
    icon: Star,
    color: 'from-blue-500 to-blue-600',
    features: [
      '5 cursos al mes',
      'Diplomas personalizados',
      'Gustos personalizados',
      'Generación con IA avanzada',
      'Soporte por email'
    ],
    popular: false,
    cta: 'Actualizar a Aprendiz'
  },
  {
    id: UserPlan.EXPERTO,
    name: 'Plan Experto',
    price: '$49.900',
    period: '/mes',
    description: 'Para estudiantes serios que quieren más contenido',
    icon: Zap,
    color: 'from-purple-500 to-purple-600',
    features: [
      '10 cursos al mes',
      'Acceso a todos los cursos de la comunidad',
      'Todo lo del plan Aprendiz',
      'Contenido premium exclusivo',
      'Soporte prioritario'
    ],
    popular: true,
    cta: 'Actualizar a Experto'
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
      '20 cursos al mes',
      'Publica tus cursos en la comunidad',
      'Perfiles personalizados',
      'Todo lo del plan Experto',
      'Herramientas de creación avanzadas',
      'Soporte VIP'
    ],
    popular: false,
    cta: 'Actualizar a Maestro'
  }
];

const additionalFeatures = [
  {
    icon: Users,
    title: 'Comunidad Global',
    description: 'Conecta con estudiantes y educadores de todo el mundo'
  },
  {
    icon: Globe,
    title: 'Contenido Multilingüe',
    description: 'Accede a cursos en múltiples idiomas'
  },
  {
    icon: Award,
    title: 'Certificaciones Reconocidas',
    description: 'Obtén diplomas que respaldan tu conocimiento'
  }
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
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-amber-600 bg-clip-text text-transparent mb-6">
            Elige tu Plan de Aprendizaje
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Desbloquea todo el potencial de la educación personalizada con IA. 
            Desde principiantes hasta maestros, tenemos el plan perfecto para ti.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;
            const isPlanUpgrading = isUpgrading === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "relative transition-all duration-300 hover:scale-105 hover:shadow-2xl",
                  plan.popular && "ring-2 ring-purple-500 shadow-2xl scale-105",
                  isCurrentPlan && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20",
                  selectedPlan === plan.id && "ring-2 ring-blue-500"
                )}
              >
                {plan.popular && (
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
                  <div className={cn(
                    "w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r flex items-center justify-center",
                    plan.color
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={cn(
                      "w-full h-10 text-sm font-semibold transition-all duration-300",
                      isCurrentPlan 
                        ? "bg-green-500 hover:bg-green-600" 
                        : plan.popular 
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" 
                          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isPlanUpgrading || isCurrentPlan}
                  >
                    {isPlanUpgrading ? 'Actualizando...' : isCurrentPlan ? 'Plan Actual' : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Features */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Características Incluidas en Todos los Planes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-muted-foreground">
                Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de control.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">¿Los cursos se generan automáticamente?</h3>
              <p className="text-muted-foreground">
                Sí, nuestros cursos se generan automáticamente usando IA avanzada basada en tus intereses y nivel.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">¿Qué incluyen los diplomas personalizados?</h3>
              <p className="text-muted-foreground">
                Los diplomas incluyen tu nombre, el curso completado, fecha de finalización y son verificables digitalmente.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">¿Hay período de prueba gratuito?</h3>
              <p className="text-muted-foreground">
                Ofrecemos 7 días de prueba gratuita para que explores todas las funcionalidades sin compromiso.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para Transformar tu Aprendizaje?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a miles de estudiantes que ya están aprendiendo con IA personalizada
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
          >
            Comenzar Prueba Gratuita
          </Button>
        </div>
      </div>
    </div>
  );
}
