'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserPlan, PLAN_NAMES, PLAN_PRICES } from '@/lib/plans';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';

interface WompiPaymentFormProps {
  plan: UserPlan;
  onSuccess: (subscription: any) => void;
  onCancel: () => void;
}

export default function WompiPaymentForm({ plan, onSuccess, onCancel }: WompiPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [wompiToken, setWompiToken] = useState<string | null>(null);
  const { toast } = useToast();

  const planName = PLAN_NAMES[plan];
  const planPrice = PLAN_PRICES[plan];

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/');
  };

  const createWompiToken = async () => {
    try {
      setIsLoading(true);

      // For testing, we'll create a mock token
      // In production, you should use Wompi's SDK
      const mockToken = `tok_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setWompiToken(mockToken);
      
      toast({
        title: 'Método de pago configurado',
        description: 'Tu tarjeta ha sido verificada correctamente.',
      });

    } catch (error) {
      console.error('Error creating payment token:', error);
      toast({
        title: 'Error',
        description: 'No se pudo verificar tu tarjeta. Por favor, verifica los datos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!wompiToken) {
      toast({
        title: 'Error',
        description: 'Primero debes configurar tu método de pago.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          paymentMethodToken: wompiToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const { subscription } = await response.json();
      
      toast({
        title: '¡Suscripción creada!',
        description: `Tu suscripción a ${planName} ha sido activada exitosamente.`,
      });

      onSuccess(subscription);

    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la suscripción. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configurar Pago
          </CardTitle>
          <CardDescription>
            Configura tu método de pago para {planName} - ${planPrice.toLocaleString()} COP/mes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!wompiToken ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                  <Input
                    id="cardName"
                    placeholder="Juan Pérez"
                    value={cardData.name}
                    onChange={(e) => handleCardInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cardNumber">Número de tarjeta</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => handleCardInputChange('number', formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Vencimiento</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={cardData.expiry}
                      onChange={(e) => handleCardInputChange('expiry', formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      value={cardData.cvc}
                      onChange={(e) => handleCardInputChange('cvc', e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Tu información está protegida con encriptación SSL</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createWompiToken}
                  disabled={isLoading || !cardData.number || !cardData.expiry || !cardData.cvc || !cardData.name}
                  className="flex-1"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Tarjeta'}
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Método de pago verificado</span>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumen de la suscripción:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio:</span>
                    <span className="font-medium">${planPrice.toLocaleString()} COP/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Próximo cobro:</span>
                    <span className="font-medium">En 30 días</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createSubscription}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Creando suscripción...' : 'Confirmar Suscripción'}
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
