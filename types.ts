
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TODOS = 'TODOS',
  FILES = 'FILES',
  AI_ASSISTANT = 'AI_ASSISTANT',
  BERICHTSHEFT = 'BERICHTSHEFT',
  KNOWLEDGE = 'KNOWLEDGE',
  ABOUT = 'ABOUT',
}

export type Language = 'en' | 'de';
export type AppTheme = 'green' | 'blue' | 'purple' | 'orange';

export interface UserProfile {
  id?: string; // Added for Supabase UUID
  name: string;
  email: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'Betrieb' | 'Berufsschule' | 'Sonstiges';
  dueDate?: string;
  completedAt?: string; // ISO Date string
}

// Runtime file object (used in UI)
export interface FileDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string; // Blob URL for preview/download
  isPersisted: boolean; // True if content is saved in storage
}

// Persisted file object (saved to localStorage or DB)
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  contentBase64: string | null; // Null if file was too large to save
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface DashboardStats {
  pendingTodos: number;
  filesStored: number;
  nextExam?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface UserData {
  todos: TodoItem[];
  files: StoredFile[];
  xp: number; // Experience points for gamification
  completedReports: string[]; // Array of strings like "2023-W40"
}
