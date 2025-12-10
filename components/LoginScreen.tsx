
import React, { useState } from 'react';
import { ArrowRight, User, Mail, Lock, AlertCircle, UserPlus, LogIn, Key, Database, CheckCircle, Globe } from 'lucide-react';
import { authService } from '../services/auth';
import { UserProfile, Language } from '../types';
import SettingsModal from './SettingsModal';
import { isBackendConfigured } from '../services/supabase';

interface LoginScreenProps {
  onLogin: (name: string, email: string) => void;
  onAuthenticatedUser?: (user: UserProfile) => void;
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any) => string;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onAuthenticatedUser, lang, setLanguage, t }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const validateForm = () => {
    if (mode === 'REGISTER' && formData.name.trim().length < 2) {
      setError("Please enter your full name.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (mode !== 'FORGOT_PASSWORD' && formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (mode === 'LOGIN') {
        const user = await authService.login(formData.email, formData.password);
        finishAuth(user);
      } else if (mode === 'REGISTER') {
        const result = await authService.register(formData.name, formData.email, formData.password);
        if (result.requiresConfirmation) {
          setSuccessMessage("Registration successful! Please check your email to confirm your account before logging in.");
          setMode('LOGIN');
          setFormData(prev => ({ ...prev, password: '' }));
        } else if (result.user) {
          finishAuth(result.user);
        }
      } else if (mode === 'FORGOT_PASSWORD') {
        await authService.resetPasswordForEmail(formData.email);
        setSuccessMessage("Password reset link sent! Check your email.");
        setMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const finishAuth = (user: UserProfile) => {
    if (onAuthenticatedUser) {
      onAuthenticatedUser(user);
    } else {
      onLogin(user.name, user.email);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-300">
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
           onClick={() => setLanguage(lang === 'en' ? 'de' : 'en')}
           className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-primary bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors font-bold uppercase"
        >
          <Globe size={16} />
          {lang}
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-primary bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <Key size={16} />
          <span className="hidden sm:inline">Config</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-24 h-24 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/30 mb-6 transform rotate-3">
          <span className="text-4xl font-extrabold tracking-tighter">V</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {mode === 'LOGIN' && (lang === 'de' ? 'Willkommen' : 'Welcome Back')}
          {mode === 'REGISTER' && (lang === 'de' ? 'Registrieren' : 'Join V-Markt Azubis')}
          {mode === 'FORGOT_PASSWORD' && (lang === 'de' ? 'Passwort Reset' : 'Reset Password')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {isBackendConfigured() ? (
             <span className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
               <Database size={12} /> Connected to Cloud Backend
             </span>
          ) : (
             <span>Sign in to access your digital report book</span>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary to-green-400"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fade-in">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="animate-fade-in">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="e.g. Max Mustermann"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  placeholder="name@v-markt.de"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {mode !== 'FORGOT_PASSWORD' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  {mode === 'LOGIN' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('FORGOT_PASSWORD')}
                      className="text-xs font-medium text-brand-primary hover:text-green-600 dark:hover:text-green-400"
                    >
                      {lang === 'de' ? 'Vergessen?' : 'Forgot?'}
                    </button>
                  )}
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'LOGIN' && (lang === 'de' ? 'Anmelden' : 'Sign In')}
                      {mode === 'REGISTER' && (lang === 'de' ? 'Account erstellen' : 'Create Account')}
                      {mode === 'FORGOT_PASSWORD' && (lang === 'de' ? 'Link senden' : 'Send Reset Link')}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'LOGIN') setMode('REGISTER');
                  else setMode('LOGIN');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-sm font-medium text-brand-primary hover:text-green-600 dark:hover:text-green-400 flex items-center justify-center gap-2 mx-auto w-full py-2"
              >
                {mode === 'LOGIN' 
                  ? (lang === 'de' ? <><UserPlus size={16} /> Neu hier? Account erstellen</> : <><UserPlus size={16} /> Don't have an account? Create one</>) 
                  : (lang === 'de' ? <><LogIn size={16} /> Bereits registriert? Anmelden</> : <><LogIn size={16} /> Already have an account? Sign In</>)
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
