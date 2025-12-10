
import React, { useMemo } from 'react';
import { TodoItem, FileDocument, AppView, UserProfile } from '../types';
import { Clock, CheckCircle2, FileText, ArrowRight, Sun, Sparkles, Trophy, Star, BookOpen, AlertCircle, Target, TrendingUp } from 'lucide-react';

interface DashboardProps {
  todos: TodoItem[];
  files: FileDocument[];
  onChangeView: (view: AppView) => void;
  user: UserProfile | null;
  xp: number;
  completedReports: string[];
  t: (key: any) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ todos, files, onChangeView, user, xp, completedReports, t }) => {
  const pendingTodos = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;
  const totalTasks = todos.length;
  const recentFiles = files.slice(0, 3);
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = user?.name ? user.name.split(' ')[0] : 'Azubi';

  // Gamification Logic
  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;
  const progressPercent = (xpInCurrentLevel / 100) * 100;

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Week Status Logic
  const { currentKw, daysRemaining, isReportDone } = useMemo(() => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const kw = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    // Deadline is usually Sunday night of the current week
    const currentDay = now.getDay(); // 0 is Sunday
    const daysLeft = currentDay === 0 ? 0 : 7 - currentDay;

    const id = `${now.getFullYear()}-W${kw}`;
    return {
      currentKw: kw,
      daysRemaining: daysLeft,
      isReportDone: completedReports.includes(id),
      reportId: id
    };
  }, [completedReports]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-dark dark:from-slate-950 dark:via-slate-900 dark:to-brand-dark/50 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
              <Sun size={18} className="text-yellow-400" />
              <span className="text-sm tracking-wide uppercase">{today}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{t('welcome')}, {firstName}!</h1>
            
            <div className="flex items-center gap-4">
               {/* Level Badge */}
               <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-2 pr-4 border border-white/10 shadow-inner">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-secondary to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-3">
                    {level}
                  </div>
                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <div className="flex justify-between text-xs font-bold text-yellow-100 mb-1.5 uppercase tracking-wider">
                      <span>{t('level')} {level}</span>
                      <span>{Math.floor(xpInCurrentLevel)} / 100 XP</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-secondary to-yellow-400 transition-all duration-700 ease-out rounded-full" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
               </div>
            </div>
          </div>
          
          <button 
            onClick={() => onChangeView(AppView.AI_ASSISTANT)}
            className="group relative bg-white text-slate-900 px-6 py-4 rounded-2xl font-bold transition-all hover:shadow-xl hover:shadow-brand-primary/20 hover:-translate-y-1 active:scale-95 flex items-center gap-3"
          >
            <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
               <Sparkles size={20} className="text-blue-600 group-hover:animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{t('needHelp')}</span>
              <span className="block text-sm">{t('askAi')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Deadline Alert Widget */}
      <div 
        onClick={() => onChangeView(AppView.BERICHTSHEFT)}
        className={`
          w-full p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:shadow-md active:scale-[0.99]
          ${isReportDone 
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-100 dark:border-emerald-800' 
            : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800'}
        `}
      >
        <div className="flex items-center gap-5">
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
            ${isReportDone ? 'bg-white dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'}
          `}>
            <BookOpen size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-lg ${isReportDone ? 'text-emerald-900 dark:text-emerald-200' : 'text-orange-900 dark:text-orange-200'}`}>
                Berichtsheft KW {currentKw}
              </h3>
              {isReportDone && <span className="text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-2 py-0.5 rounded-full font-bold">{t('done')}</span>}
            </div>
            <p className={`text-sm font-medium ${isReportDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {isReportDone 
                ? t('greatJob')
                : `${t('deadline')}: Sunday (${daysRemaining} ${t('daysLeft')})`}
            </p>
          </div>
        </div>
        <div className="pr-4 hidden sm:block">
          {isReportDone ? (
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
              <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-bold bg-white/60 dark:bg-black/20 px-4 py-2 rounded-full border border-orange-200/50 dark:border-orange-700/30">
               <span>Open Task</span>
               <AlertCircle size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending Tasks */}
        <div 
          onClick={() => onChangeView(AppView.TODOS)}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
             <Clock size={100} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <Clock size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg">
                <span>{t('toDo')}</span>
                <ArrowRight size={12} />
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-1">{pendingTodos}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('pendingTasks')}</p>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div 
          onClick={() => onChangeView(AppView.TODOS)}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-lg hover:border-brand-primary/30 transition-all group relative"
        >
           <div className="flex flex-col h-full justify-between relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3.5 bg-brand-light dark:bg-brand-dark/20 text-brand-primary dark:text-brand-light rounded-2xl border border-brand-primary/10 dark:border-brand-primary/20">
                  <Target size={24} />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                  <TrendingUp size={12} />
                  <span>{completionRate}%</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white">{completedCount}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('completed')}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5">{completedCount} / {totalTasks} Tasks</span>
                </div>
                
                {/* Linear Progress Bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${completionRate}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Documents */}
        <div 
          onClick={() => onChangeView(AppView.FILES)}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
             <FileText size={100} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <FileText size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                <span>{t('storage')}</span>
                <ArrowRight size={12} />
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-1">{files.length}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('savedDocs')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files & Quick Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            {t('recentDocs')}
          </h2>
          {recentFiles.length > 0 ? (
            <div className="space-y-4">
              {recentFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${file.type.includes('image') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {file.type.includes('image') ? 'IMG' : 'DOC'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{file.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{new Date(file.uploadDate).toLocaleDateString()} &bull; {Math.round(file.size/1024)} KB</p>
                    </div>
                  </div>
                  <a href={file.url} download={file.name} className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                     <ArrowRight size={18} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p>{t('noDocs')}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 dark:bg-yellow-900/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800 dark:text-white relative z-10">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <Star size={20} className="text-brand-secondary" />
            </div>
            {t('tips')}
          </h2>
          <div className="space-y-4 relative z-10">
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <div className="w-1.5 bg-brand-secondary rounded-full h-auto self-stretch"></div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Berichtsheft Hack</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Write short keywords daily in the 'Tasks' tab. The AI will turn them into full sentences for you later!</p>
              </div>
            </div>
             <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <div className="w-1.5 bg-brand-primary rounded-full h-auto self-stretch"></div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Ask Questions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">There are no stupid questions. If you don't understand a task, ask your instructor immediately.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <div className="w-1.5 bg-blue-500 rounded-full h-auto self-stretch"></div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">MHD Checks</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Always check the dates (MHD) when restocking shelves ("First In, First Out").</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
