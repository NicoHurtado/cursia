'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 h-[calc(100vh-4rem)] fixed left-0 top-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-10">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 ml-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
