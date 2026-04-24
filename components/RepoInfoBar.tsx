import { RepoMetadata } from '@/lib/types';
import { Star, GitFork, CircleDot } from 'lucide-react';

export default function RepoInfoBar({ metadata }: { metadata: RepoMetadata }) {
  return (
    <div className="w-full bg-gh-bg border-b border-gh-border py-6 px-4">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gh-blue break-all">
          <a href={`https://github.com/${metadata.full_name}`} target="_blank" rel="noreferrer" className="hover:underline">
            {metadata.full_name}
          </a>
        </h1>
        {metadata.description && (
          <p className="text-gh-text-secondary text-base max-w-3xl">
            {metadata.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gh-text-muted">
          <div className="flex items-center gap-1.5 hover:text-gh-blue cursor-pointer transition-colors">
            <Star className="w-4 h-4" />
            <span className="font-medium">{metadata.stars.toLocaleString()} stars</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-gh-blue cursor-pointer transition-colors">
            <GitFork className="w-4 h-4" />
            <span className="font-medium">{metadata.forks.toLocaleString()} forks</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-gh-blue cursor-pointer transition-colors">
            <CircleDot className="w-4 h-4 text-gh-green" />
            <span className="font-medium">{metadata.openIssues.toLocaleString()} issues</span>
          </div>
          {metadata.license && (
            <div className="flex items-center gap-1.5 border border-gh-border px-2 py-0.5 rounded-full text-xs">
              {metadata.license}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
