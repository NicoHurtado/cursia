import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add your middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (
          req.nextUrl.pathname === '/' ||
          req.nextUrl.pathname.startsWith('/login') ||
          req.nextUrl.pathname.startsWith('/signup') ||
          req.nextUrl.pathname.startsWith('/api/auth')
        ) {
          return true;
        }

        // Require authentication for protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }

        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
