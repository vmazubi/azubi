
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TodoItem, FileDocument, UserProfile, Language } from '../types';
import { Send, User, Sparkles, StopCircle, RefreshCw, Key } from 'lucide-react';
import { createChatSession, sendMessageStream } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

interface AiAssistantProps {
  todos?: TodoItem[];
  files?: FileDocument[];
  user?: UserProfile | null;
  onOpenSettings: () => void;
  t: (key: any) => string;
  lang: Language;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ todos = [], files = [], user, onOpenSettings, t, lang }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    // Initial Welcome Message
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: lang === 'de' 
        ? "Hallo! Ich bin dein Azubi-Mentor. Ich kenne deine aktuellen Aufgaben und Dateien. Frag mich alles!" 
        : "Hi! I'm your Azubi Mentor. I know about your current tasks and files. Ask me anything!",
      timestamp: new Date(),
    }]);
  }, [lang]);

  useEffect(() => {
    // Attempt session init, might fail if no key, but we catch it later
    try {
       initSession();
    } catch (e) {
      // Ignore initial error, wait for interaction
    }
  }, [lang]); // Re-init if language changes

  const initSession = () => {
    setApiKeyError(false);
    chatSessionRef.current = createChatSession({
      todos,
      files,
      name: user?.name || 'Azubi'
    }, lang);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    setInputValue('');
    setApiKeyError(false);
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Re-init session if it doesn't exist or was cleared
      if (!chatSessionRef.current) {
         initSession();
      }

      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      const result = await sendMessageStream(chatSessionRef.current!, userText);
      
      let fullText = '';
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text;
        if (textChunk) {
          fullText += textChunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
      ));

    } catch (error: any) {
      console.error("Error communicating with Gemini:", error);
      
      const isKeyError = error.message?.includes("API Key");
      if (isKeyError) setApiKeyError(true);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: isKeyError 
          ? (lang === 'de' ? "Ich kann noch nicht antworten, da der API-Schlüssel fehlt. Bitte konfiguriere ihn in den Einstellungen." : "I can't answer yet because I'm missing the API Key. Please configure it to start chatting.")
          : (lang === 'de' ? "Entschuldigung, ich hatte Probleme mit der Verbindung. Bitte versuche es erneut." : "Sorry, I had trouble connecting to the server. Please try again."),
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = lang === 'de' ? [
    "Welche Aufgaben sind offen?",
    "Fasse meine Dateien zusammen",
    "Schreib einen Berichtsheft-Eintrag",
    "Tipps für die Prüfung"
  ] : [
    "What pending tasks do I have?",
    "Summarize my files",
    "Write a Berichtsheft entry",
    "Exam tips"
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white">{t('aiMentor')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Context Aware &bull; Powered by Gemini</p>
        </div>
        <button 
          onClick={() => {
            setMessages([]); 
            setApiKeyError(false);
            try { initSession(); } catch(e){}
            setMessages([{
              id: Date.now().toString(),
              role: 'model',
              text: lang === 'de' ? "Chat zurückgesetzt. Wie kann ich helfen?" : "Chat reset. How can I help?",
              timestamp: new Date(),
            }]);
          }} 
          className="ml-auto p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Reset Chat"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-slate-900">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            
            <div className={`
              max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-slate-900 dark:bg-brand-primary text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'}
            `}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.isStreaming && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1"/>}
              
              {/* Show button inside the message if it's the specific API key error message */}
              {msg.role === 'model' && msg.text.includes("API Key") && (
                <button 
                  onClick={onOpenSettings}
                  className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  <Key size={14} />
                  Set API Key
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
        {messages.length < 3 && !apiKeyError && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => { setInputValue(prompt); }}
                className="whitespace-nowrap px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={lang === 'de' ? "Schreib eine Nachricht..." : "Type a message..."}
            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white placeholder:text-slate-400 transition-all"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            {isTyping ? <StopCircle size={18} className="animate-pulse" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
