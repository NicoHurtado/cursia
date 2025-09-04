'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias de aprendizaje
        </p>
      </div>

      {/* Profile Info */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{user?.name || 'Usuario'}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email}
              </p>
            </div>
          </div>
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
          Ver Papelera
        </Button>
      </div>
    </div>
  );
}
