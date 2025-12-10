
import React, { useState, useEffect } from 'react';
import { X, Key, Save, Trash2, Database, FileCode, Moon, Sun, Palette, Globe } from 'lucide-react';
import { SQL_SETUP_INSTRUCTIONS } from '../services/supabase';
import { Language, AppTheme } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
  lang: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  themeColor: AppTheme;
  setThemeColor: (color: AppTheme) => void;
  t: (key: any) => string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, onLogout, lang, setLanguage, darkMode, setDarkMode, themeColor, setThemeColor, t 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('azubi_custom_api_key') || '');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) localStorage.setItem('azubi_custom_api_key', apiKey.trim());
    else localStorage.removeItem('azubi_custom_api_key');

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure? This will delete all local tasks and files.")) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('vmarkt_')) localStorage.removeItem(key);
      });
      onLogout();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SETUP_INSTRUCTIONS);
    alert("SQL copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">{t('settings')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('appearance')}</h3>
            
            {/* Language */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                 <Globe size={18} className="text-slate-500" />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('language')}</span>
               </div>
               <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                 <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>EN</button>
                 <button onClick={() => setLanguage('de')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'de' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>DE</button>
               </div>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                 {darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{darkMode ? t('darkMode') : t('lightMode')}</span>
               </div>
               <button 
                 onClick={() => setDarkMode(!darkMode)}
                 className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
               >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
               </button>
            </div>

            {/* Theme Colors */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                 <Palette size={18} className="text-slate-500" />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('themeColor')}</span>
               </div>
               <div className="flex gap-2">
                 {[
                   { id: 'green', color: 'bg-green-600' },
                   { id: 'blue', color: 'bg-blue-600' },
                   { id: 'purple', color: 'bg-purple-600' },
                   { id: 'orange', color: 'bg-orange-600' },
                 ].map((t) => (
                   <button
                     key={t.id}
                     onClick={() => setThemeColor(t.id as AppTheme)}
                     className={`w-6 h-6 rounded-full ${t.color} border-2 transition-all ${themeColor === t.id ? 'border-white ring-2 ring-slate-400 dark:ring-slate-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                   />
                 ))}
               </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* AI Key Section */}
          <div className="bg-brand-light/30 dark:bg-brand-dark/20 p-4 rounded-xl border border-brand-light/50 dark:border-brand-dark/30">
            <h3 className="text-sm font-bold text-brand-primary dark:text-brand-secondary mb-2 flex items-center gap-2">
              <Key size={16} /> Gemini AI API Key
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Required for AI Chat & Report generation.</p>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl text-sm mb-2 focus:ring-2 focus:ring-brand-primary/50 outline-none"
            />
          </div>

          {/* Backend Status */}
          <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30 flex items-center gap-3">
             <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
               <Database size={20} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-green-800 dark:text-green-300">Cloud Backend Active</h3>
               <p className="text-xs text-green-600 dark:text-green-400/80">Your data is automatically synced.</p>
             </div>
          </div>

          {/* SQL Setup Helper */}
          <div>
            <button 
              onClick={() => setShowSql(!showSql)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 mb-2"
            >
              <FileCode size={12} />
              {showSql ? "Hide" : "Show"} Database Setup SQL
            </button>
            {showSql && (
              <div className="bg-slate-900 rounded-xl p-3 relative group border border-slate-800">
                <pre className="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap h-32 font-mono scrollbar-thin">
                  {SQL_SETUP_INSTRUCTIONS}
                </pre>
                <button 
                  onClick={copySql}
                  className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
             <button 
                onClick={handleSave}
                className="bg-brand-primary hover:bg-brand-dark text-white px-6 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-brand-primary/20"
              >
                {saved ? t('saved') : t('saveChanges')} <Save size={16} />
              </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Danger Zone */}
          <button 
            onClick={handleResetData}
            className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <Trash2 size={16} /> {t('clearData')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
