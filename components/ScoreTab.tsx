import { RepoAnalysisData } from '@/lib/types';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { ShieldCheck, Info } from 'lucide-react';

export default function ScoreTab({ analysis }: { analysis: RepoAnalysisData }) {
  const { score } = analysis;
  const breakdown = score.breakdown;

  const chartData = [
    { subject: 'Activity', A: breakdown.activity, fullMark: 100 },
    { subject: 'Maintainability', A: breakdown.maintainability, fullMark: 100 },
    { subject: 'Reliability', A: breakdown.reliability, fullMark: 100 },
    { subject: 'Documentation', A: breakdown.documentation, fullMark: 100 },
    { subject: 'Structure', A: breakdown.structure, fullMark: 100 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-gh-blue" />
            <h2 className="text-2xl font-bold text-white">Repository Health Score</h2>
          </div>
          <p className="text-gh-text-secondary max-w-2xl">
            This composite score is calculated using deterministic heuristics based on repository activity, community standards, structural integrity, and documentation quality.
          </p>
        </div>
        <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
          <span className={`text-6xl font-bold leading-none ${score.final >= 80 ? 'text-gh-green' : score.final >= 50 ? 'text-gh-yellow' : 'text-gh-red'}`}>
            {score.final}
          </span>
          <span className="text-2xl text-gh-text-muted">/ 100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Score Radar
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[400px]">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#c9d1d9', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '6px' }}
                />
                <Radar name="Score" dataKey="A" stroke="#58a6ff" fill="#58a6ff" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gh-bg border border-gh-border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gh-bg-secondary border-b border-gh-border px-4 py-3 font-medium text-white">
            Score Breakdown Explained
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6">
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Activity ({breakdown.activity}/100)</span>
              </div>
              <p className="text-sm text-gh-text-secondary flex items-start gap-2">
                <Info className="w-4 h-4 text-gh-blue shrink-0 mt-0.5" />
                Evaluates recent commit frequency and long-term activity over the last 90 days. High scores indicate an actively maintained project.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Maintainability ({breakdown.maintainability}/100)</span>
              </div>
              <p className="text-sm text-gh-text-secondary flex items-start gap-2">
                <Info className="w-4 h-4 text-gh-blue shrink-0 mt-0.5" />
                Assesses the contributor base and issue resolution metrics. A higher score means the workload is distributed among multiple contributors.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Reliability ({breakdown.reliability}/100)</span>
              </div>
              <p className="text-sm text-gh-text-secondary flex items-start gap-2">
                <Info className="w-4 h-4 text-gh-blue shrink-0 mt-0.5" />
                Scores deterministic quality signals such as tests, CI/CD workflows, linting, type-checking, lockfiles, and security policy files.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Documentation ({breakdown.documentation}/100)</span>
              </div>
              <p className="text-sm text-gh-text-secondary flex items-start gap-2">
                <Info className="w-4 h-4 text-gh-blue shrink-0 mt-0.5" />
                Validates the presence and size of a README file and repository description. Good documentation makes onboarding easier.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Structure ({breakdown.structure}/100)</span>
              </div>
              <p className="text-sm text-gh-text-secondary flex items-start gap-2">
                <Info className="w-4 h-4 text-gh-blue shrink-0 mt-0.5" />
                Rewards the inclusion of an open-source License, proper default branch configuration, and clean directory structure.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
