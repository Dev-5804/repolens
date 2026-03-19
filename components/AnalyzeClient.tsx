'use client';

import { useEffect, useMemo, useState } from 'react';

import { AnalyzeErrorResponse, AnalyzeResponse } from '@/types';

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: AnalyzeResponse };

function parseRepoLabel(repoUrl: string): string {
  try {
    const parsed = new URL(repoUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 2) {
      return `${segments[0]}/${segments[1]}`;
    }
  } catch {
    return 'unknown/unknown';
  }

  return 'unknown/unknown';
}

export default function AnalyzeClient({ repoUrl }: { repoUrl: string }) {
  const [state, setState] = useState<PageState>(() =>
    repoUrl ? { status: 'loading' } : { status: 'error', message: 'No repository URL provided.' }
  );

  useEffect(() => {
    let cancelled = false;

    if (!repoUrl) {
      return;
    }

    async function loadAnalysis(): Promise<void> {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        });

        const payload = (await response.json()) as AnalyzeResponse | AnalyzeErrorResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const message = 'error' in payload ? payload.error : 'Failed to analyze repository.';
          setState({ status: 'error', message });
          return;
        }

        setState({ status: 'success', data: payload as AnalyzeResponse });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unexpected error while analyzing repository.',
        });
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [repoUrl]);

  const repoLabel = useMemo(() => parseRepoLabel(repoUrl), [repoUrl]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-900/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <span className="text-amber-400">◈</span>
          <span className="font-[var(--font-syne)] text-sm font-bold text-amber-400">RepoLens</span>
          <span className="text-stone-700">/</span>
          <span className="font-mono text-sm text-stone-200">{repoLabel}</span>
          <a
            href={repoUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto rounded-md border border-stone-700 px-3 py-1 text-xs text-stone-400 transition-colors hover:border-amber-500/60 hover:text-amber-400"
          >
            View on GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        {state.status === 'loading' ? <LoadingState /> : null}

        {state.status === 'error' ? (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-5">
            <p className="text-sm font-semibold text-red-400">Analysis failed</p>
            <p className="mt-2 text-sm text-stone-300">{state.message}</p>
          </div>
        ) : null}

        {state.status === 'success' ? <SuccessState data={state.data} /> : null}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-72 animate-pulse rounded-md bg-stone-800" />
      <div className="h-32 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
        <div className="h-24 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
        <div className="h-24 animate-pulse rounded-xl border border-stone-800 bg-stone-900" />
      </div>
      <p className="text-sm text-stone-500">Analyzing repository...</p>
    </div>
  );
}

function SuccessState({ data }: { data: AnalyzeResponse }) {
  const { analysis, summary } = data;
  const dependencyCount = Object.keys(analysis.dependencies).length;
  const devDependencyCount = Object.keys(analysis.devDependencies).length;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
        <p className="text-xs uppercase tracking-wider text-stone-500">Overview</p>
        <p className="mt-3 text-sm leading-6 text-stone-300">{summary.overview}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Architecture" value={summary.architecture} accent="amber" />
        <MetricCard label="Production Score" value={`${summary.productionScore}/100`} accent="lime" />
        <MetricCard
          label="Readiness Score"
          value={`${analysis.readinessScore.score}/100`}
          accent={analysis.readinessScore.score >= 60 ? 'lime' : 'amber'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">Tech Stack</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.techStack.length === 0 ? <span className="text-sm text-stone-500">Not detected</span> : null}
            {summary.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-lime-800 bg-lime-950 px-3 py-1 text-xs font-medium text-lime-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">Dependencies</p>
          <div className="mt-3 space-y-1 text-sm text-stone-300">
            <p>Production: {dependencyCount}</p>
            <p>Development: {devDependencyCount}</p>
            <p>Security Issues: {analysis.securityIssues.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
        <p className="text-xs uppercase tracking-wider text-stone-500">Key Observations</p>
        <ul className="mt-3 space-y-2 text-sm text-stone-300">
          {summary.observations.length === 0 ? <li>No observations generated.</li> : null}
          {summary.observations.map((observation) => (
            <li key={observation} className="flex items-start gap-2">
              <span className="mt-1 text-amber-500">◆</span>
              <span>{observation}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'amber' | 'lime';
}) {
  const accentClass = accent === 'lime' ? 'text-lime-400' : 'text-amber-400';

  return (
    <article className="rounded-xl border border-stone-800 bg-stone-900 p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${accentClass}`}>{value}</p>
    </article>
  );
}
