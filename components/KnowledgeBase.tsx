
import React, { useState } from 'react';
import { Flashcard } from '../types';
import { generateStudyMaterial } from '../services/geminiService';
import { Search, BrainCircuit, Check, X, RotateCcw, GraduationCap, Lightbulb, Key } from 'lucide-react';

interface KnowledgeBaseProps {
  onXpGain: (amount: number) => void;
  onOpenSettings: () => void;
  t: (key: any) => string;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onXpGain, onOpenSettings, t }) => {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [keyError, setKeyError] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setSessionComplete(false);
    setSessionScore(0);
    setCurrentIndex(0);
    setShowAnswer(false);
    setKeyError(false);
    
    try {
      const newCards = await generateStudyMaterial(topic);
      setCards(newCards);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("API Key")) {
        setKeyError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (correct: boolean) => {
    if (correct) {
      setSessionScore(s => s + 1);
      onXpGain(20); // 20 XP per correct answer
    }
    
    // Move to next card
    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(c => c + 1);
        setShowAnswer(false);
      }, 300);
    } else {
      setSessionComplete(true);
      onXpGain(50); // Bonus for finishing set
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="text-blue-600" />
          {t('knowledge')} & Quiz
        </h2>
        <p className="text-slate-500">Master product knowledge and exam topics.</p>
      </div>

      {/* Search / Generate Bar */}
      <form onSubmit={handleGenerate} className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 mb-8">
        <div className="flex-1 relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g., 'Exotic Fruits', 'Checkout Codes', 'Fire Safety')" 
            className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
           />
        </div>
        <button 
          type="submit" 
          disabled={loading || !topic.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <BrainCircuit size={20} />
          )}
          <span className="hidden sm:inline">Generate Quiz</span>
        </button>
      </form>

      {/* Game Area */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
        {keyError ? (
           <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-200">
             <Key size={32} className="mx-auto mb-4 text-red-400" />
             <h3 className="text-lg font-bold text-red-600 mb-2">API Key Missing</h3>
             <p className="text-red-500 mb-4">You need to set an API Key to generate quiz questions.</p>
             <button
               onClick={onOpenSettings}
               className="bg-white text-red-600 border border-red-200 px-6 py-2 rounded-xl font-medium hover:bg-red-50 transition-colors"
             >
               Configure Key
             </button>
           </div>
        ) : loading ? (
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BrainCircuit size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-700">Generating Study Material...</h3>
            <p className="text-slate-400">Consulting the retail gods.</p>
          </div>
        ) : !cards.length ? (
          <div className="text-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl w-full">
            <Lightbulb size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-slate-500">Need to study?</p>
            <p className="text-sm">Type a topic above to generate instant flashcards.</p>
          </div>
        ) : sessionComplete ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center w-full max-w-md animate-fade-in">
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
               <GraduationCap size={40} />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Quiz Complete!</h3>
             <p className="text-slate-500 mb-6">You scored {sessionScore} out of {cards.length}.</p>
             <button 
               onClick={() => { setCards([]); setTopic(''); }}
               className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
             >
               <RotateCcw size={18} />
               Study Something Else
             </button>
          </div>
        ) : (
          <div className="w-full max-w-lg perspective-1000">
            {/* Progress */}
            <div className="flex justify-between text-sm font-medium text-slate-400 mb-4 px-1">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span>Score: {sessionScore}</span>
            </div>

            {/* The Card */}
            <div 
              className="group relative h-80 w-full cursor-pointer perspective-1000"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <div className={`
                relative w-full h-full duration-500 preserve-3d transition-all
                ${showAnswer ? 'rotate-y-180' : ''}
              `}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                  <span className="absolute top-6 left-6 text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    Question
                  </span>
                  <h3 className="text-2xl font-bold text-slate-800 leading-snug">
                    {cards[currentIndex].question}
                  </h3>
                  <p className="absolute bottom-6 text-xs text-slate-400 font-medium">Click to reveal answer</p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                   <span className="absolute top-6 left-6 text-xs font-bold text-green-400 bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    Answer
                  </span>
                  <p className="text-xl font-medium leading-relaxed">
                    {cards[currentIndex].answer}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            {showAnswer && (
              <div className="flex gap-4 mt-8 animate-fade-in">
                <button 
                  onClick={() => handleResponse(false)}
                  className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <X size={20} />
                  Missed it
                </button>
                <button 
                  onClick={() => handleResponse(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                >
                  <Check size={20} />
                  Got it!
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
