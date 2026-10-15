import { TaskList } from '@/components/TaskList';

export default function Home() {
  return (
    <main className="flex flex-1 justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-xl">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Mini Task Manager
          </h1>
          <p className="text-sm text-slate-500">Keep track of what needs to get done.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TaskList ownerId="demo-user" />
        </div>
      </div>
    </main>
  );
}
