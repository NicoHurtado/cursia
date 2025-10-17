'use client';

import { CreditCard, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PLAN_NAMES } from '@/lib/plans';

interface SubscriptionInfoProps {
  subscription: {
    id: string;
    plan: string;
    status: string;
    amountInCents: number;
    currency: string;
    nextPaymentDate: string;
    lastPaymentDate?: string;
    createdAt: string;
    cancelledAt?: string;
  };
  onCancel: () => void;
  showCancelButton?: boolean;
}

export default function SubscriptionInfo({
  subscription,
  onCancel,
  showCancelButton = true,
}: SubscriptionInfoProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        '¿Estás seguro de que quieres cancelar tu suscripción? Mantendrás acceso hasta el final del período pagado, pero no se renovará automáticamente.'
      )
    ) {
      return;
    }

    try {
      setIsCancelling(true);

      const response = await fetch(
        `/api/subscriptions/${subscription.id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: 'Suscripción cancelada',
        description:
          'Tu suscripción ha sido cancelada. Mantienes acceso hasta el final del período pagado.',
      });

      onCancel();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description:
          'No se pudo cancelar la suscripción. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amountInCents: number, currency: string = 'COP') => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'PAUSED':
        return 'Pausada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'FAILED':
        return 'Fallida';
      default:
        return status;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Información de Suscripción
        </CardTitle>
        <CardDescription>Detalles de tu suscripción actual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado:</span>
          <Badge className={getStatusColor(subscription.status)}>
            {getStatusText(subscription.status)}
          </Badge>
        </div>

        {/* Plan */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Plan:</span>
          <span className="font-medium">
            {PLAN_NAMES[subscription.plan as keyof typeof PLAN_NAMES]}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monto:</span>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">
              {formatAmount(subscription.amountInCents, subscription.currency)}
            </span>
          </div>
        </div>

        {/* Next Payment */}
        {subscription.nextPaymentDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Próximo cobro:</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {formatDate(subscription.nextPaymentDate)}
              </span>
            </div>
          </div>
        )}

        {/* Last Payment */}
        {subscription.lastPaymentDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Último pago:</span>
            <span className="font-medium">
              {formatDate(subscription.lastPaymentDate)}
            </span>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Fecha de creación:</span>
          <span className="font-medium">
            {formatDate(subscription.createdAt)}
          </span>
        </div>

        {/* Cancelled Date */}
        {subscription.cancelledAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Fecha de cancelación:</span>
            <span className="font-medium">
              {formatDate(subscription.cancelledAt)}
            </span>
          </div>
        )}

        {/* Actions */}
        {subscription.status === 'ACTIVE' && showCancelButton && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>
                Al cancelar tu suscripción, mantendrás acceso hasta el final del
                período pagado.
              </span>
            </div>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="w-full"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar Suscripción'}
            </Button>
          </div>
        )}

        {subscription.status === 'CANCELLED' && (
          <div className="pt-4 border-t">
            <div className="text-center text-sm text-muted-foreground">
              <p>Tu suscripción ha sido cancelada.</p>
              <p>
                Mantienes acceso a todos los beneficios hasta el final del
                período pagado.
              </p>
              <p>
                Puedes reactivarla en cualquier momento desde la página de
                planes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
