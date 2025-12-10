
import React, { useState, useEffect } from 'react';
import { AppView, FileDocument, TodoItem, UserProfile, StoredFile, Language, AppTheme } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TodoList from './components/TodoList';
import FileManager from './components/FileManager';
import AiAssistant from './components/AiAssistant';
import Berichtsheft from './components/Berichtsheft';
import LoginScreen from './components/LoginScreen';
import KnowledgeBase from './components/KnowledgeBase';
import SettingsModal from './components/SettingsModal';
import AboutSection from './components/AboutSection';
import { storageService, blobToBase64 } from './services/storage';
import { authService } from './services/auth';
import { getSupabase } from './services/supabase';
import { Menu, Save, Lock } from 'lucide-react';
import { translations } from './services/i18n';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Appearance & Locale
  const [language, setLanguage] = useState<Language>('de'); // Default to German for Azubis
  const [darkMode, setDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState<AppTheme>('green');

  // App State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [xp, setXp] = useState(0);
  const [completedReports, setCompletedReports] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Password Reset State
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // --- Theme & Language Effects ---
  useEffect(() => {
    // Load preferences
    const savedLang = localStorage.getItem('azubi_lang') as Language;
    if (savedLang) setLanguage(savedLang);
    
    const savedDark = localStorage.getItem('azubi_dark');
    if (savedDark === 'true') setDarkMode(true);
    
    const savedTheme = localStorage.getItem('azubi_theme') as AppTheme;
    if (savedTheme) setThemeColor(savedTheme);
  }, []);

  useEffect(() => {
    // Apply Dark Mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('azubi_dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    // Apply Theme Color via Class
    document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-orange');
    if (themeColor !== 'green') {
      document.documentElement.classList.add(`theme-${themeColor}`);
    }
    localStorage.setItem('azubi_theme', themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('azubi_lang', language);
  }, [language]);

  // --- Auth & Data Logic ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key');
    if (urlKey) {
      localStorage.setItem('azubi_custom_api_key', urlKey);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const supabase = getSupabase();

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          handleAuthenticatedUser({
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || ''
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
           handleAuthenticatedUser({
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || ''
          });
        } else if (event === 'SIGNED_OUT') {
           if (isAuthenticated) {
             handleLogout();
           }
        } else if (event === 'PASSWORD_RECOVERY') {
           setIsResettingPassword(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      const savedSession = localStorage.getItem('azubi_session');
      const savedUser = localStorage.getItem('azubi_user');
      
      if (savedSession && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          loadDataForUser(parsedUser.email, parsedUser.id);
        } catch (e) {
          console.error("Failed to parse user", e);
          localStorage.removeItem('azubi_session');
        }
      }
    }
  }, [isAuthenticated]); 

  const loadDataForUser = async (email: string, userId?: string) => {
    setIsLoadingData(true);
    try {
      const userData = await storageService.loadUserData(email, userId);
      setTodos(userData.todos);
      setXp(userData.xp || 0);
      setCompletedReports(userData.completedReports || []);
      
      const hydratedFiles = await storageService.hydrateFiles(userData.files, userId);
      setFiles(hydratedFiles);
    } catch (e) {
      console.error("Error loading user data", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAuthenticatedUser = (profile: UserProfile) => {
    localStorage.setItem('azubi_session', 'true');
    localStorage.setItem('azubi_user', JSON.stringify(profile));
    
    setUser(profile);
    setIsAuthenticated(true);
    if (!user || user.id !== profile.id) {
       loadDataForUser(profile.email, profile.id);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('azubi_session');
    localStorage.removeItem('azubi_user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView(AppView.DASHBOARD);
    setShowSettings(false);
    setTodos([]);
    setFiles([]);
    setCompletedReports([]);
    setXp(0);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetMessage("Password must be at least 6 characters.");
      return;
    }
    try {
      await authService.updateUserPassword(newPassword);
      setResetMessage("Success! Password updated.");
      setTimeout(() => {
        setIsResettingPassword(false);
        setResetMessage(null);
        setNewPassword('');
      }, 1500);
    } catch (e: any) {
      setResetMessage("Error: " + e.message);
    }
  };

  const handleSetTodos = (action: React.SetStateAction<TodoItem[]>) => {
    setTodos(prev => {
      const nextTodos = typeof action === 'function' ? action(prev) : action;
      const prevCompleted = prev.filter(t => t.completed).length;
      const nextCompleted = nextTodos.filter(t => t.completed).length;
      if (nextCompleted > prevCompleted) {
         setXp(currentXp => currentXp + 50); 
      }
      return nextTodos;
    });
  };

  const handleXpGain = (amount: number) => {
    setXp(prev => prev + amount);
  };

  const toggleReportComplete = (reportId: string) => {
    setCompletedReports(prev => {
      const isComplete = prev.includes(reportId);
      const newReports = isComplete 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId];
      if (!isComplete) {
        setXp(x => x + 100); 
      }
      return newReports;
    });
  };

  useEffect(() => {
    if (!user || isLoadingData) return;
    storageService.saveTodos(user.email, user.id, todos);
  }, [todos, user]);

  useEffect(() => {
    if (!user || isLoadingData) return;
    storageService.saveProgress(user.email, user.id, xp, completedReports);
  }, [xp, completedReports, user]);

  const handleUpdateFiles = (newFiles: FileDocument[]) => {
    setFiles(newFiles);
    if (!user) return;
    (async () => {
      const storedFiles: StoredFile[] = [];
      const currentStored = await storageService.loadUserData(user.email, user.id);
      const supabase = getSupabase();
      const sizeLimit = supabase ? 50 * 1024 * 1024 : 500 * 1024;

      for (const f of newFiles) {
        try {
          if (f.url.startsWith('blob:') && !f.isPersisted) {
             const blob = await (await fetch(f.url)).blob();
             if (blob.size <= sizeLimit) {
               const base64 = await blobToBase64(blob);
               storedFiles.push({
                 id: f.id,
                 name: f.name,
                 type: f.type,
                 size: f.size,
                 uploadDate: f.uploadDate,
                 contentBase64: base64
               });
             } else {
               storedFiles.push({
                 id: f.id,
                 name: f.name,
                 type: f.type,
                 size: f.size,
                 uploadDate: f.uploadDate,
                 contentBase64: null
               });
             }
          } else {
             const oldFile = currentStored.files.find(old => old.id === f.id);
             storedFiles.push({
                 id: f.id,
                 name: f.name,
                 type: f.type,
                 size: f.size,
                 uploadDate: f.uploadDate,
                 contentBase64: oldFile ? oldFile.contentBase64 : null
             });
          }
        } catch (e) {
          storedFiles.push({
             id: f.id,
             name: f.name,
             type: f.type,
             size: f.size,
             uploadDate: f.uploadDate,
             contentBase64: null
           });
        }
      }
      storageService.saveFiles(user.email, user.id, storedFiles);
    })();
  };

  // Translation Helper
  const t = (key: keyof typeof translations['en']) => translations[language][key] || key;

  const renderContent = () => {
    const props = { 
      user, 
      todos, 
      files, 
      xp, 
      completedReports,
      onOpenSettings: () => setShowSettings(true),
      lang: language,
      t
    };

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard {...props} onChangeView={setCurrentView} />;
      case AppView.TODOS:
        return <TodoList todos={todos} setTodos={handleSetTodos} onOpenSettings={props.onOpenSettings} lang={language} t={t} />;
      case AppView.BERICHTSHEFT:
        return <Berichtsheft todos={todos} completedReports={completedReports} onToggleReport={toggleReportComplete} onOpenSettings={props.onOpenSettings} t={t} />;
      case AppView.KNOWLEDGE:
        return <KnowledgeBase onXpGain={handleXpGain} onOpenSettings={props.onOpenSettings} t={t} />;
      case AppView.FILES:
        return <FileManager files={files} setFiles={handleUpdateFiles} t={t} />;
      case AppView.AI_ASSISTANT:
        return <AiAssistant todos={todos} files={files} user={user} onOpenSettings={props.onOpenSettings} t={t} lang={language} />;
      case AppView.ABOUT:
        return <AboutSection />;
      default:
        return <Dashboard {...props} onChangeView={setCurrentView} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onLogin={(name, email) => handleAuthenticatedUser({ name, email, id: 'local-temp' })} 
        onAuthenticatedUser={handleAuthenticatedUser}
        lang={language}
        setLanguage={setLanguage}
        t={t}
      />
    );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettings(true)}
        user={user}
        t={t}
      />
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-white text-sm">V</div>
            <span className="font-bold text-slate-800 dark:text-white">V-Markt Azubis</span>
          </div>
          <button 
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto scroll-smooth">
          {renderContent()}
        </main>
      </div>

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          onLogout={handleLogout} 
          lang={language}
          setLanguage={setLanguage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          t={t}
        />
      )}

      {/* Password Reset Modal */}
      {isResettingPassword && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold text-lg">
               <Lock className="text-brand-primary" />
               <h2>Update Password</h2>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Please enter your new password below.</p>
             <form onSubmit={handlePasswordUpdate}>
               <input 
                 type="password" 
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 placeholder="New Password (min 6 chars)"
                 className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl mb-4 focus:ring-brand-primary focus:border-brand-primary"
               />
               {resetMessage && (
                 <div className={`text-sm mb-4 ${resetMessage.includes("Success") ? "text-green-600" : "text-red-600"}`}>
                   {resetMessage}
                 </div>
               )}
               <button 
                 type="submit"
                 className="w-full bg-brand-primary text-white py-2 rounded-xl font-medium hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"
               >
                 <Save size={18} /> Update Password
               </button>
             </form>
           </div>
         </div>
      )}
    </div>
  );
};

export default App;
