import { RepoAnalysisData } from '@/lib/types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';

// Common language colors mapping
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Rust: '#dea584',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

const DEFAULT_COLOR = '#8b949e';

export default function CodeInsightsTab({ analysis }: { analysis: RepoAnalysisData }) {
  const { languages, structure } = analysis;

  // Process language data for the chart
  const languageEntries = Object.entries(languages);
  const totalBytes = languageEntries.reduce((sum, [_, bytes]) => sum + bytes, 0);
  
  const chartData = languageEntries
    .map(([name, bytes]) => ({
      name,
      value: bytes,
      percentage: ((bytes / totalBytes) * 100).toFixed(1),
      color: LANGUAGE_COLORS[name] || DEFAULT_COLOR,
    }))
    .sort((a, b) => b.value - a.value);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle2 className="w-5 h-5 text-gh-green" />
    ) : (
      <XCircle className="w-5 h-5 text-gh-red" />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Language Composition
        </div>
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                  >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [`${props.payload.percentage}% (${(value / 1024).toFixed(1)} KB)`, name]}
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '6px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gh-text-muted">No language data available.</div>
          )}
        </div>
      </div>

      <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
          Repository Standards & Structure
        </div>
        <div className="p-6 flex-1 flex flex-col gap-6">
          <p className="text-gh-text-secondary">
            Analysis of essential repository files indicating adherence to community standards and best practices.
          </p>

          <div className="flex flex-col gap-4">
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-lg">README</span>
                <span className="text-sm text-gh-text-secondary">Provides project documentation and entry point</span>
              </div>
              <StatusIcon status={structure.hasReadme} />
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-lg">License</span>
                <span className="text-sm text-gh-text-secondary">Defines legal usage and distribution terms</span>
              </div>
              <StatusIcon status={structure.hasLicense} />
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-lg">Testing Framework</span>
                <span className="text-sm text-gh-text-secondary">Presence of test directories or files</span>
              </div>
              <StatusIcon status={structure.hasTests} />
            </div>

            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-white text-lg">CI / CD Workflows</span>
                <span className="text-sm text-gh-text-secondary">Automated pipelines (e.g., GitHub Actions)</span>
              </div>
              <StatusIcon status={structure.hasCi} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
