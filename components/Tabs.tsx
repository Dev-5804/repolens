import { BookOpen, Activity, Users, Code, ShieldCheck } from 'lucide-react';

const TABS = [
  { id: 'Overview', icon: BookOpen },
  { id: 'Activity', icon: Activity },
  { id: 'Contributors', icon: Users },
  { id: 'Code Insights', icon: Code },
  { id: 'Score', icon: ShieldCheck },
];

export default function Tabs({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  return (
    <div className="w-full bg-gh-bg border-b border-gh-border px-4 mt-2">
      <div className="w-full max-w-[1200px] mx-auto flex overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                ${isActive 
                  ? 'border-gh-red text-white' 
                  : 'border-transparent text-gh-text-secondary hover:text-white hover:border-gh-border'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-gh-text' : 'text-gh-text-muted'}`} />
              {tab.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
