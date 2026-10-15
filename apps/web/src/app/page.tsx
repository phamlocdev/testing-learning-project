'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskList } from '@/components/TaskList';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!user || !token) {
    return null;
  }

  return (
    <main className="flex flex-1 justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Mini Task Manager
            </h1>
            <p className="text-sm text-slate-500">Keep track of what needs to get done.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TaskList token={token} />
        </div>
      </div>
    </main>
  );
}
