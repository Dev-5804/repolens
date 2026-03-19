import RepoForm from '@/components/RepoForm';

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 px-6 py-20">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-3xl" />

      <main className="relative z-10 w-full max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-3 text-amber-400">
          <span className="text-2xl">◈</span>
          <span className="font-[var(--font-syne)] text-5xl font-bold tracking-tight">RepoLens</span>
        </div>

        <p className="mx-auto mb-8 max-w-xl text-base text-stone-400">
          Understand any GitHub repository instantly.
        </p>

        <RepoForm />

        <p className="mt-8 text-xs text-stone-600">
          Public repositories only. Analysis may take 5-15 seconds depending on repository size.
        </p>
      </main>
    </div>
  );
}
