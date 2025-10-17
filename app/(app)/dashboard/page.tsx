'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect without loading state
    router.replace('/dashboard/courses');
  }, [router]);

  // Return null to avoid flash of loading content
  return null;
}
