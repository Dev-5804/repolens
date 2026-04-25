"use client";

import { Search, GitCompare, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TokenModal from "./TokenModal";

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Header() {
  const [search, setSearch] = useState("");
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Use a timeout to defer the state update outside the synchronous effect body
    const id = setTimeout(() => {
      const token = localStorage.getItem("repolens_github_token");
      if (!token) setIsTokenModalOpen(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?repo=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between gap-4 bg-gh-bg-secondary px-4 py-3 border-b border-gh-border text-gh-text text-sm w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-semibold hover:text-white cursor-pointer transition-colors" onClick={() => router.push('/')}>
            <Github className="w-8 h-8" />
            <span className="text-lg hidden sm:block">Repolens</span>
          </div>
          
          <Link href="/compare" className="flex items-center gap-2 text-gh-text-secondary hover:text-white transition-colors font-medium">
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:block">Compare</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search repository (e.g., owner/repo)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-1.5 pl-8 focus:outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue"
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gh-text-muted" />
          </form>
          <button 
            onClick={() => setIsTokenModalOpen(true)}
            className="p-1.5 text-gh-text-secondary hover:text-white border border-transparent hover:border-gh-border hover:bg-gh-bg rounded-md transition-all"
            title="Configure GitHub Token"
          >
            <KeyRound className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <TokenModal 
        isOpen={isTokenModalOpen} 
        onClose={() => setIsTokenModalOpen(false)} 
        onSave={() => setIsTokenModalOpen(false)} 
      />
    </>
  );
}
