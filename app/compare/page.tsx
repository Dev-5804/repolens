"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Suspense, useState } from 'react';
import CompareDashboard from '@/components/CompareDashboard';
import { GitCompare } from 'lucide-react';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const repo1Url = searchParams.get('repo1') || '';
  const repo2Url = searchParams.get('repo2') || '';

  const [input1, setInput1] = useState(repo1Url);
  const [input2, setInput2] = useState(repo2Url);

  const getCleanRepo = (input: string) => {
    if (!input) return null;
    let clean = input.trim();
    if (clean.includes('github.com/')) {
      clean = clean.split('github.com/')[1];
    }
    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return clean;
  };

  const cleanRepo1 = getCleanRepo(repo1Url);
  const cleanRepo2 = getCleanRepo(repo2Url);

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (input1.trim() && input2.trim()) {
      router.push(`/compare?repo1=${encodeURIComponent(input1.trim())}&repo2=${encodeURIComponent(input2.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <main className="flex-1 flex flex-col items-center w-full">
        {(!cleanRepo1 || !cleanRepo2) ? (
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-3xl px-4 py-20 text-center gap-6">
            <div className="bg-gh-bg-secondary p-4 rounded-full mb-4 border border-gh-border">
              <GitCompare className="w-12 h-12 text-gh-blue" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Compare Repositories</h1>
            <p className="text-gh-text-secondary text-lg">
              Benchmark two GitHub repositories side-by-side to evaluate their health, activity, and technical differences.
            </p>
            
            <form onSubmit={handleCompare} className="w-full mt-6 bg-gh-bg-secondary border border-gh-border p-6 rounded-xl flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                <div className="flex-1 w-full">
                  <label className="block text-left text-sm font-medium text-gh-text mb-2">Repository A (e.g., facebook/react)</label>
                  <input
                    type="text"
                    value={input1}
                    onChange={(e) => setInput1(e.target.value)}
                    placeholder="Owner/Repo A..."
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-2.5 focus:outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue text-white"
                    required
                  />
                </div>
                <div className="text-gh-text-muted font-bold hidden md:block pt-6">VS</div>
                <div className="flex-1 w-full">
                  <label className="block text-left text-sm font-medium text-gh-text mb-2">Repository B (e.g., vuejs/core)</label>
                  <input
                    type="text"
                    value={input2}
                    onChange={(e) => setInput2(e.target.value)}
                    placeholder="Owner/Repo B..."
                    className="w-full bg-gh-bg border border-gh-border rounded-md px-4 py-2.5 focus:outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue text-white"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-gh-blue hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium transition-colors text-lg mt-2">
                Run Comparison
              </button>
            </form>
          </div>
        ) : (
          <CompareDashboard repo1={cleanRepo1} repo2={cleanRepo2} />
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
