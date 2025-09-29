'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useAuthenticatedFetch() {
  const router = useRouter();

  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);

      // If we get a 401 (Unauthorized), redirect to login
      if (response.status === 401) {
        console.log('Session expired, redirecting to login...');

        // Sign out the user and redirect to login
        await signOut({
          redirect: false,
          callbackUrl: '/login',
        });

        // Redirect to login page
        router.push('/login');

        // Throw an error to prevent further processing
        throw new Error('Session expired');
      }

      // If we get a 403 (Forbidden), it might also be an auth issue
      if (response.status === 403) {
        console.log('Access forbidden, checking session...');

        // Check if it's a session issue by trying to get session
        const sessionResponse = await fetch('/api/auth/session');
        if (!sessionResponse.ok || sessionResponse.status === 401) {
          console.log('Session invalid, redirecting to login...');
          await signOut({
            redirect: false,
            callbackUrl: '/login',
          });
          router.push('/login');
          throw new Error('Session expired');
        }
      }

      return response;
    } catch (error) {
      // If it's a network error or session expired, handle appropriately
      if (error instanceof Error && error.message === 'Session expired') {
        throw error;
      }

      // For network errors that might indicate server issues
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error:', error);
        throw new Error('Network error');
      }

      // For other fetch errors, check if it might be an auth issue
      console.error('Fetch error:', error);
      throw error;
    }
  };

  return { authenticatedFetch };
}
