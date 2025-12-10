
import React from 'react';
import { Home, CheckSquare, FolderOpen, Sparkles, BookOpen, LogOut, GraduationCap, Settings, Info } from 'lucide-react';
import { AppView, UserProfile } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  user: UserProfile | null;
  t: (key: any) => string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isMobileOpen, setIsMobileOpen, onLogout, onOpenSettings, user, t }) => {
  
  const navItems = [
    { view: AppView.DASHBOARD, label: t('dashboard'), icon: Home },
    { view: AppView.TODOS, label: t('tasks'), icon: CheckSquare },
    { view: AppView.BERICHTSHEFT, label: t('reportBook'), icon: BookOpen },
    { view: AppView.KNOWLEDGE, label: t('knowledge'), icon: GraduationCap },
    { view: AppView.FILES, label: t('documents'), icon: FolderOpen },
    { view: AppView.AI_ASSISTANT, label: t('aiMentor'), icon: Sparkles },
    { view: AppView.ABOUT, label: t('about'), icon: Info },
  ];

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    setIsMobileOpen(false);
  };

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'AZ';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        md:translate-x-0 md:static md:h-screen border-r border-slate-800
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-primary/40">
              V
            </div>
            <span className="text-lg font-bold tracking-tight">V-Markt Azubis</span>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${currentView === item.view 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer User Info */}
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-brand-primary">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.name || 'Azubi'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={t('settings')}
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title={t('logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
