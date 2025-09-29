'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { NormalLoadingScreen } from '@/components/ui/normal-loading-screen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to login...');
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return <NormalLoadingScreen message="Verificando sesión..." />;
  }

  // Show loading while redirecting unauthenticated users
  if (status === 'unauthenticated') {
    return <NormalLoadingScreen message="Redirigiendo al login..." />;
  }

  // Render children only if authenticated
  return <>{children}</>;
}
