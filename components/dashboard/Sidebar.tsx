'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Plus, 
  BookOpen, 
  Award, 
  LogOut,
  Home,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Mi Perfil', href: '/dashboard/profile', icon: User },
  { name: 'Crear Curso', href: '/create-course', icon: Plus },
  { name: 'Mis Cursos', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Planes', href: '/dashboard/plans', icon: CreditCard },
  { name: 'Certificaciones', href: '/dashboard/certificates', icon: Award },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* User Profile Card */}
      <Card className="mb-6 flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {session?.user?.name || 'Usuario'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full justify-start h-12 px-4",
                isActive && "bg-primary/10 text-primary border-r-2 border-primary"
              )}
              onClick={() => handleNavigation(item.href)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </Button>
          );
        })}
      </nav>

      <div className="my-4 h-px bg-border flex-shrink-0" />

      {/* Logout Button */}
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="font-medium">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
}
