import { useState, useMemo } from 'react';
import { RepoAnalysisData } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertCircle } from 'lucide-react';

type DateRange = 'last30' | 'last90' | 'lastYear' | 'allTime' | 'custom';

export default function ActivityTab({ analysis }: { analysis: RepoAnalysisData }) {
  const repoFullName = analysis.metadata.full_name;
  const [rangeType, setRangeType] = useState<DateRange>('last90');
  const [customSince, setCustomSince] = useState('');
  const [customUntil, setCustomUntil] = useState('');

  const { since, until } = useMemo(() => {
    const now = new Date();
    if (rangeType === 'last30') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      return { since: d.toISOString(), until: now.toISOString() };
    }
    if (rangeType === 'last90') {
      const d = new Date(); d.setDate(d.getDate() - 90);
      return { since: d.toISOString(), until: now.toISOString() };
    }
    if (rangeType === 'lastYear') {
      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
      return { since: d.toISOString(), until: now.toISOString() };
    }
    if (rangeType === 'allTime') {
      return { since: '', until: '' };
    }
    // custom
    return { 
      since: customSince ? new Date(customSince).toISOString() : '', 
      until: customUntil ? new Date(customUntil).toISOString() : '' 
    };
  }, [rangeType, customSince, customUntil]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['activity', repoFullName, since, until],
    queryFn: async () => {
      const token = localStorage.getItem('repolens_github_token') || '';
      let url = `/api/activity?repo=${encodeURIComponent(repoFullName)}`;
      if (since) url += `&since=${since}`;
      if (until) url += `&until=${until}`;
      const res = await fetch(url, {
        headers: { 'x-github-token': token }
      });
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    enabled: rangeType !== 'custom' || !!customSince || !!customUntil,
  });

  const chartData = useMemo(() => {
    if (!data?.data?.commits) return [];
    const commits = data.data.commits;
    
    const isLongRange = rangeType === 'lastYear' || rangeType === 'allTime' || rangeType === 'custom';
    const groups: Record<string, number> = {};
    
    commits.forEach((c: { date: string }) => {
      const d = new Date(c.date);
      let key = '';
      if (isLongRange) {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      } else {
        const day = d.getDay() || 7; // Get current day number, converting Sun. to 7
        d.setHours(-24 * (day - 1)); // Adjust to previous Monday
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // Week of Monday
      }
      groups[key] = (groups[key] || 0) + 1;
    });

    return Object.keys(groups).sort().map(key => ({
      name: key,
      commits: groups[key]
    }));
  }, [data, rangeType]);

  const totalFetchedCommits = data?.data?.commits?.length || 0;
  const isSample = data?.data?.isSample;

  return (
    <div className="flex flex-col gap-6">
      {/* Date Controls */}
      <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto">
          {(['last30', 'last90', 'lastYear', 'allTime', 'custom'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRangeType(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                rangeType === r ? 'bg-gh-blue text-white' : 'bg-gh-bg border border-gh-border text-gh-text-secondary hover:text-white'
              }`}
            >
              {r === 'last30' && 'Last 30 Days'}
              {r === 'last90' && 'Last 90 Days'}
              {r === 'lastYear' && 'Last Year'}
              {r === 'allTime' && 'All Time'}
              {r === 'custom' && 'Custom Range'}
            </button>
          ))}
        </div>
        
        {rangeType === 'custom' && (
          <div className="flex items-center gap-2 text-sm w-full md:w-auto">
            <input 
              type="date" 
              value={customSince} 
              onChange={(e) => setCustomSince(e.target.value)}
              className="bg-gh-bg border border-gh-border rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-gh-blue"
            />
            <span className="text-gh-text-muted">to</span>
            <input 
              type="date" 
              value={customUntil} 
              onChange={(e) => setCustomUntil(e.target.value)}
              className="bg-gh-bg border border-gh-border rounded-md px-2 py-1.5 text-white focus:outline-none focus:border-gh-blue"
            />
          </div>
        )}
      </div>

      {isSample && (
        <div className="bg-[#2c2012] border border-[#d29922] text-[#d29922] rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Sample Data:</strong> Showing a sample of {totalFetchedCommits} commits for the selected date range. 
            Fetching all historical commits for large repositories is limited by the GitHub API.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden animate-pulse">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 h-12 w-full flex items-center">
            <div className="h-4 bg-[#30363d] rounded w-40"></div>
          </div>
          <div className="p-6 h-[300px] sm:h-[400px] w-full flex items-end justify-between gap-2 md:gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-[#30363d] w-full rounded-t-sm" 
                style={{ height: `${[55, 30, 75, 45, 65, 20, 80, 35, 60, 50, 40, 70, 25, 55, 45][i]}%` }}
              ></div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-gh-red">
          Failed to fetch activity data.
        </div>
      ) : (
        <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white flex justify-between items-center">
            <span>Commit Activity Trend</span>
            <span className="text-xs text-gh-text-muted font-normal">
              {rangeType === 'lastYear' || rangeType === 'allTime' ? 'Grouped by Month' : 'Grouped by Week'}
            </span>
          </div>
          <div className="p-4 h-[300px] sm:h-[400px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="name" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '6px', fontSize: '12px' }}
                    cursor={{ fill: '#21262d' }}
                  />
                  <Bar dataKey="commits" fill="#3fb950" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gh-text-muted">
                No commits found in the selected date range.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
