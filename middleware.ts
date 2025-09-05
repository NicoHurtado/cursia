import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Minimal middleware logic for better performance
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Fast path for public routes
        const publicPaths = ['/', '/login', '/signup'];
        const isPublicPath = publicPaths.includes(req.nextUrl.pathname) || 
                           req.nextUrl.pathname.startsWith('/api/auth');
        
        if (isPublicPath) {
          return true;
        }

        // Require authentication for dashboard routes only
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
