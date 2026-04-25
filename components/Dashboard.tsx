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
      const token = localStorage.getItem('repolens_github_token');
      if (!token) {
        throw new Error('A GitHub Personal Access Token is required to analyze repositories. Please configure it in the header.');
      }

      const res = await fetch(`/api/analyze?repo=${encodeURIComponent(repo)}`, {
        headers: {
          'x-github-token': token
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          // You could potentially trigger a global event here to open the modal,
          // but throwing the error will show the error boundary UI.
          throw new Error('Your GitHub token is invalid or expired. Please update it in the settings.');
        }
        throw new Error(errorData.message || 'Failed to fetch analysis');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes client-side cache
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center animate-pulse">
        {/* Skeleton Info Bar */}
        <div className="w-full bg-gh-bg border-b border-gh-border py-6 px-4">
          <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-3">
            <div className="h-8 bg-[#30363d] rounded w-64"></div>
            <div className="h-4 bg-[#30363d] rounded w-full max-w-2xl mt-2"></div>
            <div className="h-4 bg-[#30363d] rounded w-3/4 max-w-xl"></div>
            <div className="flex gap-4 mt-4">
              <div className="h-5 bg-[#30363d] rounded w-20"></div>
              <div className="h-5 bg-[#30363d] rounded w-20"></div>
              <div className="h-5 bg-[#30363d] rounded w-24"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton Tabs */}
        <div className="w-full border-b border-gh-border">
           <div className="w-full max-w-[1200px] mx-auto flex gap-6 px-4 pt-4 pb-0">
             <div className="h-8 bg-[#30363d] rounded-t-md w-20"></div>
             <div className="h-8 bg-[#30363d] rounded-t-md w-24"></div>
             <div className="h-8 bg-[#30363d] rounded-t-md w-28"></div>
             <div className="h-8 bg-[#30363d] rounded-t-md w-28"></div>
           </div>
        </div>
        
        {/* Skeleton Content Grid */}
        <div className="w-full max-w-[1200px] px-4 py-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg h-24"></div>
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg h-24"></div>
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg h-24"></div>
            <div className="bg-gh-bg-secondary border border-gh-border rounded-lg h-24"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gh-bg border border-gh-border rounded-lg h-[400px]"></div>
            <div className="flex flex-col gap-6">
               <div className="bg-gh-bg border border-gh-border rounded-lg h-[250px]"></div>
               <div className="bg-gh-bg border border-gh-border rounded-lg h-[150px]"></div>
            </div>
          </div>
        </div>
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
      <RepoInfoBar analysis={analysis} />
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
