'use client';

import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Script from 'next/script';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UserPlan, PLAN_NAMES, PLAN_PRICES } from '@/lib/plans';

interface WompiPaymentFormProps {
  plan: UserPlan;
  onSuccess: (subscription: any) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export default function WompiPaymentForm({
  plan,
  onSuccess,
  onCancel,
}: WompiPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [wompiLoaded, setWompiLoaded] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [wompiToken, setWompiToken] = useState<string | null>(null);
  const { toast } = useToast();

  const planName = PLAN_NAMES[plan];
  const planPrice = PLAN_PRICES[plan];

  useEffect(() => {
    // Check if Wompi SDK is already loaded
    if (typeof window !== 'undefined' && window.WidgetCheckout) {
      setWompiLoaded(true);
    }
  }, []);

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/');
  };

  const createWompiToken = async () => {
    if (!wompiLoaded) {
      toast({
        title: 'Error',
        description:
          'El sistema de pagos aún está cargando. Por favor, espera un momento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Validar datos de tarjeta
      if (
        !cardData.number ||
        !cardData.expiry ||
        !cardData.cvc ||
        !cardData.name
      ) {
        throw new Error('Por favor, completa todos los campos de la tarjeta.');
      }

      // Separar mes y año de la fecha de vencimiento
      const [expMonth, expYear] = cardData.expiry.split('/');

      if (
        !expMonth ||
        !expYear ||
        expMonth.length !== 2 ||
        expYear.length !== 2
      ) {
        throw new Error('Fecha de vencimiento inválida. Usa el formato MM/AA.');
      }

      // Obtener la clave pública de Wompi desde el servidor
      const configResponse = await fetch('/api/payment/config');
      const { publicKey } = await configResponse.json();

      // Crear token usando Wompi SDK
      const tokenResponse = await fetch(
        'https://production.wompi.co/v1/tokens/cards',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicKey}`,
          },
          body: JSON.stringify({
            number: cardData.number.replace(/\s/g, ''), // Remover espacios
            cvc: cardData.cvc,
            exp_month: expMonth,
            exp_year: `20${expYear}`, // Convertir YY a YYYY
            card_holder: cardData.name,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          errorData.error?.message || 'No se pudo procesar la tarjeta.'
        );
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.status === 'CREATED' && tokenData.data?.id) {
        setWompiToken(tokenData.data.id);

        toast({
          title: 'Método de pago configurado',
          description: 'Tu tarjeta ha sido verificada correctamente.',
        });
      } else {
        throw new Error('No se pudo crear el token de pago.');
      }
    } catch (error: any) {
      console.error('Error creating payment token:', error);
      toast({
        title: 'Error',
        description:
          error.message ||
          'No se pudo verificar tu tarjeta. Por favor, verifica los datos.',
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
          paymentMethodToken: wompiToken,
        }),
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
        description:
          'No se pudo crear la suscripción. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.wompi.co/widget.js"
        onLoad={() => setWompiLoaded(true)}
        strategy="lazyOnload"
      />
      <div className="max-w-md mx-auto">
        {!wompiLoaded && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Cargando sistema de pagos...
            </span>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurar Pago
            </CardTitle>
            <CardDescription>
              Configura tu método de pago para {planName} - $
              {planPrice.toLocaleString()} COP/mes
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
                      onChange={e =>
                        handleCardInputChange('name', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber">Número de tarjeta</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardData.number}
                      onChange={e =>
                        handleCardInputChange(
                          'number',
                          formatCardNumber(e.target.value)
                        )
                      }
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
                        onChange={e =>
                          handleCardInputChange(
                            'expiry',
                            formatExpiry(e.target.value)
                          )
                        }
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={cardData.cvc}
                        onChange={e =>
                          handleCardInputChange(
                            'cvc',
                            e.target.value.replace(/\D/g, '')
                          )
                        }
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>
                    Tu información está protegida con encriptación SSL
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={createWompiToken}
                    disabled={
                      isLoading ||
                      !cardData.number ||
                      !cardData.expiry ||
                      !cardData.cvc ||
                      !cardData.name
                    }
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
                  <h4 className="font-medium mb-2">
                    Resumen de la suscripción:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <span className="font-medium">
                        ${planPrice.toLocaleString()} COP/mes
                      </span>
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
                    {isLoading
                      ? 'Creando suscripción...'
                      : 'Confirmar Suscripción'}
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
    </>
  );
}
