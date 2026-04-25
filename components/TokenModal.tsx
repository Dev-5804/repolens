"use client";

import { useState, useEffect } from "react";
import { KeyRound, ExternalLink, ShieldCheck } from "lucide-react";

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string) => void;
}

export default function TokenModal({ isOpen, onClose, onSave }: TokenModalProps) {
  const [token, setToken] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (isOpen) {
        const storedToken = localStorage.getItem("repolens_github_token");
        if (storedToken) setToken(storedToken);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (token.trim()) {
      localStorage.setItem("repolens_github_token", token.trim());
      onSave(token.trim());
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-gh-bg border border-gh-border rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gh-blue/10 rounded-lg">
            <KeyRound className="w-6 h-6 text-gh-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">GitHub Token Required</h2>
            <p className="text-gh-text-secondary text-sm">Bring your own key to analyze repositories.</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gh-text-muted text-sm">
            To prevent rate limiting and securely access repository data, Repolens requires a Personal Access Token.
          </p>
          
          <div className="bg-gh-bg-secondary border border-gh-border rounded-lg p-3 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-gh-green shrink-0 mt-0.5" />
            <div className="text-xs text-gh-text-secondary">
              <span className="font-semibold text-white block mb-1">Your token is secure</span>
              We do not store your token on our servers. It is kept locally in your browser&apos;s storage and sent directly to the GitHub API.
            </div>
          </div>

          <div>
            <label htmlFor="token-input" className="block text-sm font-medium text-white mb-2">
              Personal Access Token
            </label>
            <input
              id="token-input"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-white focus:outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue"
              autoComplete="off"
            />
          </div>
          
          <a 
            href="https://github.com/settings/tokens/new?description=Repolens&scopes=repo,read:org" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gh-blue hover:underline"
          >
            Generate a new token <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex justify-end gap-3">
          {localStorage.getItem("repolens_github_token") && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-gh-bg-secondary hover:bg-gh-border rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!token.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-gh-green hover:bg-gh-green/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Token
          </button>
        </div>
      </div>
    </div>
  );
}
