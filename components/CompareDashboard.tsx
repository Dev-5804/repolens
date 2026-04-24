"use client";

import { useQueries } from '@tanstack/react-query';
import { RepoAnalysisData } from '@/lib/types';
import { useMemo } from 'react';
import { AlertCircle, GitCommit, GitFork, Star, CircleDot, CheckCircle2, XCircle } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';

export default function CompareDashboard({ repo1, repo2 }: { repo1: string, repo2: string }) {
  const since90 = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 90);
    return d.toISOString();
  }, []);

  const results = useQueries({
    queries: [
      {
        queryKey: ['repoAnalysis', repo1],
        queryFn: async () => {
          const res = await fetch(`/api/analyze?repo=${encodeURIComponent(repo1)}`);
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['repoAnalysis', repo2],
        queryFn: async () => {
          const res = await fetch(`/api/analyze?repo=${encodeURIComponent(repo2)}`);
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['repoActivity', repo1, since90],
        queryFn: async () => {
          const res = await fetch(`/api/activity?repo=${encodeURIComponent(repo1)}&since=${since90}`);
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['repoActivity', repo2, since90],
        queryFn: async () => {
          const res = await fetch(`/api/activity?repo=${encodeURIComponent(repo2)}&since=${since90}`);
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      }
    ]
  });

  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);

  const analysis1: RepoAnalysisData | undefined = results[0].data?.data;
  const analysis2: RepoAnalysisData | undefined = results[1].data?.data;
  const activity1 = results[2].data?.data?.commits || [];
  const activity2 = results[3].data?.data?.commits || [];

  const combinedActivityData = useMemo(() => {
    if (!activity1.length && !activity2.length) return [];
    const groups: Record<string, { name: string, repo1: number, repo2: number }> = {};
    
    // Helper to group by week
    const processCommits = (commits: any[], repoKey: 'repo1' | 'repo2') => {
      commits.forEach((c: any) => {
        const d = new Date(c.date);
        const day = d.getDay() || 7;
        d.setHours(-24 * (day - 1)); // Adjust to previous Monday
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (!groups[key]) groups[key] = { name: key, repo1: 0, repo2: 0 };
        groups[key][repoKey] += 1;
      });
    };

    processCommits(activity1, 'repo1');
    processCommits(activity2, 'repo2');

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [activity1, activity2]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center animate-pulse px-4 py-8">
        <div className="w-full max-w-[1200px] flex gap-4 mb-8">
          <div className="flex-1 h-32 bg-gh-bg border border-gh-border rounded-lg"></div>
          <div className="flex-1 h-32 bg-gh-bg border border-gh-border rounded-lg"></div>
        </div>
        <div className="w-full max-w-[1200px] h-[400px] bg-gh-bg border border-gh-border rounded-lg mb-8"></div>
        <div className="w-full max-w-[1200px] flex gap-4">
          <div className="flex-1 h-[300px] bg-gh-bg border border-gh-border rounded-lg"></div>
          <div className="flex-1 h-[300px] bg-gh-bg border border-gh-border rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full py-20 gap-4 text-center">
        <AlertCircle className="w-16 h-16 text-gh-red" />
        <h2 className="text-2xl font-semibold text-white">Comparison Failed</h2>
        <p className="text-gh-text-secondary">Could not fetch data for one or both repositories.</p>
      </div>
    );
  }

  if (!analysis1 || !analysis2) return null;

  // Radar Data preparation
  const getRadarData = (analysis: RepoAnalysisData) => [
    { subject: 'Activity', A: analysis.score.breakdown.activity, fullMark: 100 },
    { subject: 'Structure', A: analysis.score.breakdown.structure, fullMark: 100 },
    { subject: 'Maintainability', A: analysis.score.breakdown.maintainability, fullMark: 100 },
    { subject: 'Reliability', A: analysis.score.breakdown.reliability, fullMark: 100 },
    { subject: 'Docs', A: analysis.score.breakdown.documentation, fullMark: 100 },
  ];

  // Process languages
  const getLanguagesData = (languages: Record<string, number>) => {
    const entries = Object.entries(languages);
    if (!entries.length) return [];
    
    // Minimal set of colors for compare dashboard
    const LANGUAGE_COLORS: Record<string, string> = {
      TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Java: '#b07219',
      Go: '#00ADD8', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Ruby: '#701516',
      Rust: '#dea584', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883'
    };
    
    return entries
      .map(([name, bytes]) => ({ name, size: bytes, color: LANGUAGE_COLORS[name] || '#8b949e' }))
      .sort((a, b) => b.size - a.size);
  };

  const langs1 = getLanguagesData(analysis1.languages);
  const langs2 = getLanguagesData(analysis2.languages);

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center px-4 py-8 gap-8">
      {/* High-Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Repo 1 Stats */}
        <div className="bg-gh-bg border border-gh-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-6xl font-black">{analysis1.score.final}</span>
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-gh-blue truncate mb-2">{analysis1.metadata.full_name}</h2>
            <p className="text-gh-text-secondary text-sm mb-4 h-10 overflow-hidden line-clamp-2">{analysis1.metadata.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-medium relative z-10">
            <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-gh-yellow" /> {analysis1.metadata.stars.toLocaleString()}</div>
            <div className="flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5" /> {analysis1.metadata.forks.toLocaleString()}</div>
            <div className="flex items-center gap-1.5"><CircleDot className="w-3.5 h-3.5 text-gh-green" /> {analysis1.metadata.openIssues.toLocaleString()}</div>
          </div>
        </div>

        {/* Repo 2 Stats */}
        <div className="bg-gh-bg border border-gh-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-6xl font-black">{analysis2.score.final}</span>
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-purple-400 truncate mb-2">{analysis2.metadata.full_name}</h2>
            <p className="text-gh-text-secondary text-sm mb-4 h-10 overflow-hidden line-clamp-2">{analysis2.metadata.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-medium relative z-10">
            <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-gh-yellow" /> {analysis2.metadata.stars.toLocaleString()}</div>
            <div className="flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5" /> {analysis2.metadata.forks.toLocaleString()}</div>
            <div className="flex items-center gap-1.5"><CircleDot className="w-3.5 h-3.5 text-gh-green" /> {analysis2.metadata.openIssues.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Overlaid Commit Activity */}
      <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden">
        <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
          Commit Activity (Last 90 Days)
        </div>
        <div className="p-4 h-[400px] w-full">
          {combinedActivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedActivityData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                <XAxis dataKey="name" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '6px' }}
                  cursor={{ stroke: '#30363d', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="repo1" name={analysis1.metadata.name} stroke="#3fb950" fill="#3fb950" fillOpacity={0.2} strokeWidth={3} />
                <Area type="monotone" dataKey="repo2" name={analysis2.metadata.name} stroke="#a371f7" fill="#a371f7" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gh-text-muted">No commits found.</div>
          )}
        </div>
      </div>

      {/* Side-by-side Health Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Health Score: {analysis1.metadata.name}
          </div>
          <div className="h-[350px] w-full bg-[#0d1117] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={getRadarData(analysis1)}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#58a6ff" fill="#58a6ff" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Health Score: {analysis2.metadata.name}
          </div>
          <div className="h-[350px] w-full bg-[#0d1117] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={getRadarData(analysis2)}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#a371f7" fill="#a371f7" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-side Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Languages: {analysis1.metadata.name}
          </div>
          <div className="h-[300px] w-full p-4 flex">
            {langs1.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langs1} dataKey="size" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%">
                    {langs1.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => (value / 1024).toFixed(1) + ' KB'} contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="m-auto text-gh-text-muted">No language data</div>}
          </div>
        </div>

        <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Languages: {analysis2.metadata.name}
          </div>
          <div className="h-[300px] w-full p-4 flex">
            {langs2.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langs2} dataKey="size" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%">
                    {langs2.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => (value / 1024).toFixed(1) + ' KB'} contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="m-auto text-gh-text-muted">No language data</div>}
          </div>
        </div>
      </div>

      {/* Side-by-side Repository Standards & Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Repo 1 Standards */}
        <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden flex flex-col">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Repository Standards: {analysis1.metadata.name}
          </div>
          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between mb-1">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">Overall Health</span>
                <span className="text-xs text-gh-text-secondary">Composite repository score</span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
                <span className={`text-xl font-bold leading-none ${analysis1.score.final >= 80 ? 'text-gh-green' : analysis1.score.final >= 50 ? 'text-gh-yellow' : 'text-gh-red'}`}>
                  {analysis1.score.final}
                </span>
                <span className="text-xs text-gh-text-muted">/ 100</span>
              </div>
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">README</span>
                <span className="text-xs text-gh-text-secondary">Provides project documentation</span>
              </div>
              {analysis1.structure.hasReadme ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">License</span>
                <span className="text-xs text-gh-text-secondary">Defines legal usage terms</span>
              </div>
              {analysis1.structure.hasLicense ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">Testing Framework</span>
                <span className="text-xs text-gh-text-secondary">Presence of test files</span>
              </div>
              {analysis1.structure.hasTests ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">CI / CD Workflows</span>
                <span className="text-xs text-gh-text-secondary">Automated pipelines</span>
              </div>
              {analysis1.structure.hasCi ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>
          </div>
        </div>

        {/* Repo 2 Standards */}
        <div className="w-full bg-gh-bg border border-gh-border rounded-xl overflow-hidden flex flex-col">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Repository Standards: {analysis2.metadata.name}
          </div>
          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between mb-1">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">Overall Health</span>
                <span className="text-xs text-gh-text-secondary">Composite repository score</span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
                <span className={`text-xl font-bold leading-none ${analysis2.score.final >= 80 ? 'text-gh-green' : analysis2.score.final >= 50 ? 'text-gh-yellow' : 'text-gh-red'}`}>
                  {analysis2.score.final}
                </span>
                <span className="text-xs text-gh-text-muted">/ 100</span>
              </div>
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">README</span>
                <span className="text-xs text-gh-text-secondary">Provides project documentation</span>
              </div>
              {analysis2.structure.hasReadme ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">License</span>
                <span className="text-xs text-gh-text-secondary">Defines legal usage terms</span>
              </div>
              {analysis2.structure.hasLicense ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">Testing Framework</span>
                <span className="text-xs text-gh-text-secondary">Presence of test files</span>
              </div>
              {analysis2.structure.hasTests ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-base">CI / CD Workflows</span>
                <span className="text-xs text-gh-text-secondary">Automated pipelines</span>
              </div>
              {analysis2.structure.hasCi ? <CheckCircle2 className="w-4 h-4 text-gh-green" /> : <XCircle className="w-4 h-4 text-gh-red" />}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
