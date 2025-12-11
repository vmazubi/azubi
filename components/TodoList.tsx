import React, { useState } from 'react';
import { TodoItem, Language } from '../types';
import { Plus, Trash2, Calendar, Briefcase, GraduationCap, User, Check, Wand2, Key } from 'lucide-react';
import { generateTodoSuggestions } from '../services/geminiService';
import { supabase } from "../services/supabase"; // ⬅️ ADD THIS

interface TodoListProps {
  todos: TodoItem[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  onOpenSettings: () => void;
  lang: Language;
  t: (key: any) => string;
}

const TodoList: React.FC<TodoListProps> = ({ todos, setTodos, onOpenSettings, lang, t }) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [category, setCategory] = useState<TodoItem['category']>('Betrieb');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'All' | 'Betrieb' | 'Berufsschule' | 'Sonstiges'>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyError, setKeyError] = useState(false);

  // ---------------------------
  // ADD TODO (Supabase Insert)
  // ---------------------------
  const addTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText,
      completed: false,
      category: category,
      dueDate: dueDate || undefined,
    };

    // Insert into Supabase
    const { error } = await supabase.from('todos').insert([newTodo]);

    if (error) {
      console.error('Supabase Insert Error:', error);
    } else {
      setTodos(prev => [newTodo, ...prev]);
    }

    setNewTodoText('');
    setDueDate('');
  };

  // ---------------------------
  // TOGGLE TODO (Supabase Update)
  // ---------------------------
  const toggleTodo = async (id: string) => {
    const updated = todos.find(t => t.id === id);
    if (!updated) return;

    const isCompleted = !updated.completed;

    // Update in Supabase
    const { error } = await supabase
      .from('todos')
      .update({
        completed: isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase Update Error:', error);
      return;
    }

    // Update UI
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              completed: isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
  };

  // ---------------------------
  // DELETE TODO (Supabase Delete)
  // ---------------------------
  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      console.error('Supabase Delete Error:', error);
      return;
    }

    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // ---------------------------
  // AI Generator (unchanged)
  // ---------------------------
  const handleGenerate = async () => {
    setIsGenerating(true);
    setKeyError(false);
    try {
      const jsonStr = await generateTodoSuggestions(
        'I am a retail apprentice (V-Markt). Suggest typical tasks for Betrieb (e.g. MHD control, Cashier) and Berufsschule.'
      );

      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(jsonStr);
      } catch {
        suggestions = ['Warenverräumung Getränke', 'MHD-Kontrolle Molkerei', 'Kassenschulung'];
      }

      const newItems: TodoItem[] = suggestions.map((s, idx) => ({
        id: Date.now().toString() + idx,
        text: s,
        completed: false,
        category: 'Betrieb',
      }));

      // Insert all items into Supabase
      const { error } = await supabase.from('todos').insert(newItems);
      if (!error) {
        setTodos(prev => [...newItems, ...prev]);
      }
    } catch (e: any) {
      if (e.message?.includes('API Key')) setKeyError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTodos = filter === 'All' ? todos : todos.filter(t => t.category === filter);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Betrieb':
        return <Briefcase size={14} />;
      case 'Berufsschule':
        return <GraduationCap size={14} />;
      default:
        return <User size={14} />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Betrieb':
        return 'bg-green-100 text-green-700';
      case 'Berufsschule':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  // ---------------------------
  // UI Rendering (unchanged)
  // ---------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('tasks')}</h2>
          <p className="text-slate-500">Log your daily tasks for Betrieb and Berufsschule.</p>
        </div>

        {keyError ? (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Key size={16} />
            Set API Key
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Wand2 size={16} />
            {isGenerating ? t('thinking') : t('suggestTasks')}
          </button>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={addTodo}
        className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2"
      >
        <input
          type="text"
          value={newTodoText}
          onChange={e => setNewTodoText(e.target.value)}
          placeholder={t('addTaskPlaceholder')}
          className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />
        <div className="flex gap-2 p-2 md:p-0 items-center">
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value as any)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
          >
            <option value="Betrieb">Betrieb</option>
            <option value="Berufsschule">Berufsschule</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden md:inline">{t('add')}</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Betrieb', 'Berufsschule', 'Sonstiges'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === f
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {f === 'All' ? t('filterAll') : f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
              <Check size={24} />
            </div>
            <p className="text-slate-500 font-medium">{t('noTasks')}</p>
            <p className="text-sm text-slate-400">Track your work to auto-generate your Berichtsheft!</p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <div
              key={todo.id}
              className={`group flex items-center gap-4 p-4 rounded-xl border ${
                todo.completed
                  ? 'bg-slate-50 border-slate-100 opacity-75'
                  : 'bg-white border-slate-200 shadow-sm hover:border-green-300'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  todo.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 text-transparent hover:border-green-500'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-base font-medium truncate ${
                    todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {todo.text}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${getCategoryColor(
                      todo.category
                    )}`}
                  >
                    {getCategoryIcon(todo.category)}
                    {todo.category}
                  </span>

                  {todo.dueDate && !todo.completedAt && (
                    <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                      <Calendar size={12} />
                      Due: {formatDate(todo.dueDate)}
                    </span>
                  )}

                  {todo.completedAt && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check size={12} />
                      Done{' '}
                      {new Date(todo.completedAt).toLocaleDateString(
                        lang === 'de' ? 'de-DE' : 'en-US'
                      )}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;
