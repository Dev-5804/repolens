import { RepoAnalysisData } from '@/lib/types';
import { Star, GitFork, CircleDot, Share2, Download, Printer, Check } from 'lucide-react';
import { useState } from 'react';

export default function RepoInfoBar({ analysis }: { analysis: RepoAnalysisData }) {
  const metadata = analysis.metadata;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repolens-${metadata.full_name.replace('/', '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="w-full bg-gh-bg border-b border-gh-border py-6 px-4 print:py-4">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
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
        
        {/* Actions Menu */}
        <div className="flex items-center gap-2 mt-2 md:mt-0 print:hidden">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary hover:bg-[#30363d] border border-gh-border rounded-md text-sm font-medium transition-colors text-gh-text-secondary hover:text-white"
            title="Copy Shareable URL"
          >
            {copied ? <Check className="w-4 h-4 text-gh-green" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          
          <button 
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary hover:bg-[#30363d] border border-gh-border rounded-md text-sm font-medium transition-colors text-gh-text-secondary hover:text-white"
            title="Export Analysis as JSON"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
          
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-gh-bg-secondary hover:bg-[#30363d] border border-gh-border rounded-md text-sm font-medium transition-colors text-gh-text-secondary hover:text-white"
            title="Save Dashboard as PDF"
          >
            <Printer className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}
