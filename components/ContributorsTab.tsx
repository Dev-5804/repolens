import { RepoAnalysisData } from '@/lib/types';

export default function ContributorsTab({ analysis }: { analysis: RepoAnalysisData }) {
  const { contributors } = analysis;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-6 flex flex-col gap-2 max-w-sm">
        <span className="text-gh-text-secondary font-medium">Total Contributors</span>
        <span className="text-4xl font-bold text-white">{contributors.totalContributors.toLocaleString()}</span>
        <span className="text-gh-text-muted text-sm mt-1">
          {contributors.totalContributors >= 10 ? 'Based on the most active contributors list.' : 'Total number of active contributors.'}
        </span>
      </div>

      <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden">
        <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
          Top Contributors
        </div>
        
        {contributors.topContributors.length === 0 ? (
          <div className="p-8 text-center text-gh-text-muted">
            No contributor data found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {contributors.topContributors.map((contributor, index) => (
              <div 
                key={contributor.login} 
                className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center gap-4 hover:border-gh-blue transition-colors"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://github.com/${contributor.login}.png?size=100`} 
                    alt={`${contributor.login} avatar`}
                    className="w-12 h-12 rounded-full bg-gh-bg border border-gh-border"
                  />
                  {index < 3 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gh-bg flex items-center justify-center text-xs border border-gh-border shadow-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <a 
                    href={`https://github.com/${contributor.login}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-gh-blue hover:underline truncate"
                  >
                    {contributor.login}
                  </a>
                  <span className="text-sm text-gh-text-secondary">
                    {contributor.contributions.toLocaleString()} contributions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
