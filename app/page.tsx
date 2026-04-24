"use client";

import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import { Suspense } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo');

  // Helper to extract owner/repo from a URL if the user pastes a full github.com URL
  const getCleanRepo = (input: string) => {
    if (!input) return null;
    let clean = input.trim();
    if (clean.includes('github.com/')) {
      clean = clean.split('github.com/')[1];
    }
    // Remove trailing slashes or extra paths
    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return clean;
  };

  const cleanRepo = getCleanRepo(repo || "");

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <main className="flex-1 flex flex-col items-center w-full">
        {!cleanRepo ? (
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl px-4 py-20 text-center gap-6">
            <h1 className="text-5xl font-bold text-white tracking-tight">Repolens</h1>
            <p className="text-gh-text-secondary text-lg">
              Instant, read-only dashboard for any public Git repository. 
              Search a repository to evaluate its health, activity, and quality.
            </p>
            <form className="w-full relative mt-4" action={(formData) => {
              const query = formData.get('query');
              if (query) window.location.href = `/?repo=${encodeURIComponent(query as string)}`;
            }}>
              <input
                type="text"
                name="query"
                placeholder="Enter repository URL or owner/repo..."
                className="w-full bg-gh-bg-secondary border border-gh-border rounded-md px-4 py-3 focus:outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue text-lg placeholder:text-gh-text-muted"
              />
              <button type="submit" className="absolute right-2 top-2 bg-gh-green hover:bg-green-600 text-white px-4 py-1.5 rounded-md font-medium transition-colors">
                Analyze
              </button>
            </form>
          </div>
        ) : (
          <Dashboard repo={cleanRepo} />
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
