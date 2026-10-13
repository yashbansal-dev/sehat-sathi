import React from 'react';
import { Home, Clock, FolderHeart, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewsCount = 0,
}) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
    },
    {
      id: 'documents',
      label: 'Records',
      icon: FolderHeart,
      highlight: true,
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: TrendingUp,
    },
    {
      id: 'share',
      label: 'Sharing',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center h-full transition-all duration-150 relative ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-teal-50 scale-110' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
                </div>

                {/* Badge for pending reviews on verify if mapped or notify on records */}
                {item.id === 'home' && pendingReviewsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-teal-800' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {/* Active Tab Pill Indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
