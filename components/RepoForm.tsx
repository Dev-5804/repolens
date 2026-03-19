'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLES = ['vercel/next.js', 'facebook/react', 'tailwindlabs/tailwindcss'] as const;

function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return null;
  }

  if (parsed.hostname !== 'github.com') {
    return null;
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) {
    return null;
  }

  const owner = segments[0];
  const repo = segments[1];
  if (!owner || !repo || parsed.pathname.endsWith('/')) {
    return null;
  }

  return { owner, repo };
}

export default function RepoForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(value: string): string | null {
    if (!value.trim()) {
      return 'Please enter a GitHub repository URL.';
    }

    if (!parseGitHubUrl(value)) {
      return 'Use a valid URL like https://github.com/owner/repo (no trailing slash or subpaths).';
    }

    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const validationError = validate(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedUrl = url.trim();
    setError(null);

    startTransition(() => {
      router.push(`/analyze?url=${encodeURIComponent(normalizedUrl)}`);
    });
  }

  function onPickExample(example: string): void {
    setUrl(`https://github.com/${example}`);
    setError(null);
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex overflow-hidden rounded-xl border border-stone-700 bg-stone-900 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
          <input
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(null);
            }}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-stone-50 placeholder-stone-600 outline-none"
            disabled={isPending}
            autoFocus
            aria-label="GitHub repository URL"
          />
          <button
            type="submit"
            disabled={isPending || !url.trim()}
            className="min-w-14 bg-amber-500 px-5 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500"
            aria-label="Analyze repository"
          >
            {isPending ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone-950/30 border-t-stone-950" />
            ) : (
              <span aria-hidden="true">-&gt;</span>
            )}
          </button>
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-stone-600">
        <span>Try:</span>
        {EXAMPLES.map((example, index) => (
          <div key={example} className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPickExample(example)}
              className="transition-colors hover:text-amber-400"
            >
              {example}
            </button>
            {index < EXAMPLES.length - 1 ? <span className="text-stone-700">.</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
