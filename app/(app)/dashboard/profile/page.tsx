'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DeleteAccountModal } from '@/components/auth/DeleteAccountModal';
import { PlanStatus } from '@/components/dashboard/PlanStatus';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  amountInCents: number;
  currency: string;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  createdAt: string;
  cancelledAt?: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
      });
      fetchUserProfile();
      fetchUserSubscription();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleEditProfile = () => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setEditedName('');
    setEditedEmail('');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim() || !editedEmail.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'El nombre y email son obligatorios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName.trim(),
          email: editedEmail.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUser(prev =>
          prev
            ? {
                ...prev,
                name: editedName.trim(),
                email: editedEmail.trim(),
              }
            : null
        );
        setIsEditingProfile(false);
        toast({
          title: 'Perfil actualizado',
          description: 'Tu información se ha guardado correctamente.',
        });
      } else {
        throw new Error(result.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al actualizar tu perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription || !confirm('¿Estás seguro de que quieres cancelar tu suscripción? Mantendrás acceso hasta el final del período pagado, pero no se renovará automáticamente.')) {
      return;
    }

    try {
      setIsCancelling(true);

      const response = await fetch(`/api/subscriptions/${userSubscription.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: 'Suscripción cancelada',
        description: 'Tu suscripción ha sido cancelada. Mantienes acceso hasta el final del período pagado.',
      });

      fetchUserSubscription(); // Refresh subscription data
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Cargando información del perfil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal
        </p>
      </div>

      {/* Plan Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tu plan y uso mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanStatus />
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            {!isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedEmail}
                  onChange={e => setEditedEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              
              {/* Cancel Subscription Button - Only show when editing and user has active subscription */}
              {userSubscription && userSubscription.status === 'ACTIVE' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling || isSaving}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isCancelling ? 'Cancelando...' : 'Cancelar Suscripción'}
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  size="sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{user?.name || 'Usuario'}</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email || 'usuario@email.com'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trash Button */}
      <div className="max-w-md">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/trash')}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Ver Papelera de Cursos
        </Button>
      </div>

      {/* Delete Account Button - DISABLED */}
      {false && (
        <div className="max-w-md">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="w-full justify-start bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Eliminar Cuenta
          </Button>
        </div>
      )}

      {/* Delete Account Modal - DISABLED */}
      {false && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
