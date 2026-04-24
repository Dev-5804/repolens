"use client";

import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/lib/types';
import RepoInfoBar from './RepoInfoBar';
import Tabs from './Tabs';
import Overview from './Overview';
import ActivityTab from './ActivityTab';
import ContributorsTab from './ContributorsTab';
import CodeInsightsTab from './CodeInsightsTab';
import ScoreTab from './ScoreTab';
import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Dashboard({ repo }: { repo: string }) {
  const [activeTab, setActiveTab] = useState('Overview');

  const { data, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: ['repoAnalysis', repo],
    queryFn: async () => {
      const res = await fetch(`/api/analyze?repo=${encodeURIComponent(repo)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch analysis');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes client-side cache
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full py-20 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-gh-blue" />
        <p className="text-gh-text-secondary text-lg">Analyzing {repo}...</p>
        <p className="text-gh-text-muted text-sm">This may take a few seconds.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 w-full py-20 gap-4 max-w-2xl text-center">
        <AlertCircle className="w-16 h-16 text-gh-red" />
        <h2 className="text-2xl font-semibold text-white">Analysis Failed</h2>
        <p className="text-gh-text-secondary text-lg">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!data?.data) {
    return null;
  }

  const analysis = data.data;

  return (
    <div className="w-full flex flex-col items-center">
      <RepoInfoBar metadata={analysis.metadata} />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="w-full max-w-[1200px] px-4 py-6">
        {activeTab === 'Overview' && <Overview analysis={analysis} />}
        {activeTab === 'Activity' && <ActivityTab analysis={analysis} />}
        {activeTab === 'Contributors' && <ContributorsTab analysis={analysis} />}
        {activeTab === 'Code Insights' && <CodeInsightsTab analysis={analysis} />}
        {activeTab === 'Score' && <ScoreTab analysis={analysis} />}
      </div>
    </div>
  );
}
