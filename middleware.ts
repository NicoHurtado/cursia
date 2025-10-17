import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware - Path:', pathname);
  
  // Check if it's a dashboard route
  if (pathname.startsWith('/dashboard')) {
    console.log('🏠 Dashboard route detected');
    
    // Get the token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token:', token);
    
    if (!token) {
      console.log('❌ No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('✅ Token found, allowing access');
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
