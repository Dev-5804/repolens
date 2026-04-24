import { RepoAnalysisData } from '@/lib/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Overview({ analysis }: { analysis: RepoAnalysisData }) {
  const { score, activity, contributors, languages, structure } = analysis;

  // Mock data for the chart, since we only have aggregated counts from the API.
  // In a real app with detailed commit histories, this would be a time series.
  const chartData = [
    { name: '90 Days Ago', commits: activity.commitsLast90Days - activity.commitsLast30Days },
    { name: '30 Days Ago', commits: Math.round(activity.commitsLast30Days / 2) },
    { name: 'Today', commits: activity.commitsLast30Days },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-gh-text-secondary text-sm font-medium">Composite Score</span>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${score.final >= 80 ? 'text-gh-green' : score.final >= 50 ? 'text-gh-yellow' : 'text-gh-red'}`}>
              {score.final}
            </span>
            <span className="text-gh-text-muted pb-1">/ 100</span>
          </div>
        </div>
        <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-gh-text-secondary text-sm font-medium">Commits (Last 30d)</span>
          <span className="text-2xl font-bold text-white">{activity.commitsLast30Days.toLocaleString()}</span>
        </div>
        <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-gh-text-secondary text-sm font-medium">Contributors</span>
          <span className="text-2xl font-bold text-white">{contributors.totalContributors.toLocaleString()}</span>
        </div>
        <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-gh-text-secondary text-sm font-medium">Last Commit</span>
          <span className="text-lg font-bold text-white truncate">
            {activity.lastCommitDate ? new Date(activity.lastCommitDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Charts & Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden">
            <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
              Activity Trend (Estimated)
            </div>
            <div className="p-4 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="name" stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis stroke="#8b949e" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', fontSize: '12px' }}
                    itemStyle={{ color: '#58a6ff' }}
                  />
                  <Line type="monotone" dataKey="commits" stroke="#3fb950" strokeWidth={3} dot={{ r: 4, fill: '#3fb950' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden">
            <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
              Score Breakdown
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-gh-text-secondary text-sm">Activity</span>
                <span className="font-semibold text-white">{score.breakdown.activity}/100</span>
              </div>
              <div className="w-full bg-gh-border rounded-full h-2">
                <div className="bg-gh-blue h-2 rounded-full" style={{ width: `${score.breakdown.activity}%` }}></div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gh-text-secondary text-sm">Maintainability</span>
                <span className="font-semibold text-white">{score.breakdown.maintainability}/100</span>
              </div>
              <div className="w-full bg-gh-border rounded-full h-2">
                <div className="bg-gh-blue h-2 rounded-full" style={{ width: `${score.breakdown.maintainability}%` }}></div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gh-text-secondary text-sm">Reliability</span>
                <span className="font-semibold text-white">{score.breakdown.reliability}/100</span>
              </div>
              <div className="w-full bg-gh-border rounded-full h-2">
                <div className="bg-gh-blue h-2 rounded-full" style={{ width: `${score.breakdown.reliability}%` }}></div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-gh-text-secondary text-sm">Documentation</span>
                <span className="font-semibold text-white">{score.breakdown.documentation}/100</span>
              </div>
              <div className="w-full bg-gh-border rounded-full h-2">
                <div className="bg-gh-blue h-2 rounded-full" style={{ width: `${score.breakdown.documentation}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden">
            <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
              Repository Structure
            </div>
            <div className="p-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${structure.hasReadme ? 'bg-gh-green' : 'bg-gh-red'}`}></div>
                <span className="text-gh-text">README</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${structure.hasLicense ? 'bg-gh-green' : 'bg-gh-red'}`}></div>
                <span className="text-gh-text">License</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${structure.hasTests ? 'bg-gh-green' : 'bg-gh-red'}`}></div>
                <span className="text-gh-text">Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${structure.hasCi ? 'bg-gh-green' : 'bg-gh-red'}`}></div>
                <span className="text-gh-text">CI Workflows</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
