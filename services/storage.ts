
import { TodoItem, StoredFile, FileDocument, UserData } from '../types';
import { getSupabase } from './supabase';

const STORAGE_PREFIX = 'vmarkt_user_';
const MAX_FILE_SIZE_BYTES = 500 * 1024; 

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};

const getUserKey = (email: string) => {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${STORAGE_PREFIX}${safeEmail}`;
};

export const storageService = {
  // Load All Data (Async now)
  loadUserData: async (email: string, userId?: string): Promise<UserData> => {
    const supabase = getSupabase();

    if (supabase && userId) {
      try {
        // Parallel Fetch
        const [todosRes, filesRes, progressRes] = await Promise.all([
          supabase.from('todos').select('*').eq('user_id', userId),
          supabase.from('files').select('*').eq('user_id', userId),
          supabase.from('user_progress').select('*').eq('user_id', userId).single()
        ]);

        const todos: TodoItem[] = (todosRes.data || []).map((t: any) => ({
          id: t.id,
          text: t.text,
          completed: t.completed,
          category: t.category,
          dueDate: t.due_date,
          completedAt: t.completed_at
        }));

        const files: StoredFile[] = (filesRes.data || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          uploadDate: f.upload_date,
          contentBase64: f.content_base64
        }));

        const progress = progressRes.data || { xp: 0, completed_reports: [] };

        return {
          todos,
          files,
          xp: progress.xp || 0,
          completedReports: progress.completed_reports || []
        };
      } catch (e) {
        console.error("Supabase Load Error", e);
        // Fallback to local if fetch fails? No, return empty or cached.
      }
    }

    // Local Storage Fallback
    try {
      const key = getUserKey(email);
      const dataStr = localStorage.getItem(key);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (typeof parsed.xp === 'undefined') parsed.xp = 0;
        if (!Array.isArray(parsed.completedReports)) parsed.completedReports = [];
        return parsed;
      }
    } catch (e) {
      console.error("Local Load Error", e);
    }
    
    // Default Data
    return {
      todos: [
        { id: '1', text: 'Regale aufgefüllt (Molkerei)', completed: true, category: 'Betrieb', completedAt: new Date().toISOString() },
        { id: '2', text: 'Kassenschulung absolviert', completed: false, category: 'Betrieb' },
        { id: '3', text: 'Rechnungswesen: Buchungssätze', completed: true, category: 'Berufsschule', completedAt: new Date().toISOString() },
      ],
      files: [],
      xp: 150,
      completedReports: []
    };
  },

  saveTodos: async (email: string, userId: string | undefined, todos: TodoItem[]) => {
    const supabase = getSupabase();
    if (supabase && userId) {
      const rows = todos.map(t => ({
        id: t.id,
        user_id: userId,
        text: t.text,
        completed: t.completed,
        category: t.category,
        due_date: t.dueDate,
        completed_at: t.completedAt
      }));
      
      if (todos.length > 0) {
         await supabase.from('todos').upsert(rows);
      }
    }
    
    updateLocalPartial(email, { todos });
  },

  saveProgress: async (email: string, userId: string | undefined, xp: number, completedReports: string[]) => {
    const supabase = getSupabase();
    if (supabase && userId) {
      await supabase.from('user_progress').upsert({
        user_id: userId,
        xp,
        completed_reports: completedReports
      });
    }
    updateLocalPartial(email, { xp, completedReports });
  },

  saveFiles: async (email: string, userId: string | undefined, files: StoredFile[]) => {
    const supabase = getSupabase();
    if (supabase && userId) {
      for (const f of files) {
        // Metadata Payload
        const payload: any = {
           id: f.id,
           user_id: userId,
           name: f.name,
           type: f.type,
           size: f.size,
           upload_date: f.uploadDate,
        };

        // Decision: Upload to bucket or save to DB?
        if (f.contentBase64) {
             let uploadSuccess = false;
             try {
               const blob = await base64ToBlob(f.contentBase64);
               const filePath = `${userId}/${f.id}`;
               
               const { error: uploadError } = await supabase.storage
                 .from('azubidocument')
                 .upload(filePath, blob, { upsert: true, contentType: f.type });
               
               if (uploadError) {
                 console.error("Storage upload failed (Check RLS Policies):", uploadError);
               } else {
                 uploadSuccess = true;
               }
             } catch (e) {
               console.error("Blob conversion error:", e);
             }

             if (uploadSuccess) {
               // Success: Content in bucket, DB col is null
               payload.content_base64 = null;
             } else {
               // Failure: Fallback to DB if small enough
               if (f.size <= 500 * 1024) {
                 console.warn(`Fallback: Saving ${f.name} to DB because Storage upload failed.`);
                 payload.content_base64 = f.contentBase64;
               } else {
                 console.error(`Error: Could not upload ${f.name} (Too large for DB fallback). Data lost.`);
                 payload.content_base64 = null;
               }
             }
        } else {
             // If contentBase64 is null, we assume it's already stored (in DB or Bucket).
             // We do NOT include content_base64 in the payload to avoid overwriting existing data with null.
             // Unless we explicitly want to clear it, but here we are just syncing metadata usually.
             delete payload.content_base64;
        }

        await supabase.from('files').upsert(payload);
      }
    }
    // For local, we save ALL files list (with base64 for offline access)
    updateLocalPartial(email, { files });
  },

  hydrateFiles: async (storedFiles: StoredFile[], userId?: string): Promise<FileDocument[]> => {
    const supabase = getSupabase();

    if (supabase && !userId) {
      // Try to get current user to construct paths if not passed
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user.id;
    }

    const hydrated: FileDocument[] = [];
    for (const f of storedFiles) {
      let url = '';
      let isPersisted = false;
      
      // 1. Check for legacy/fallback DB content (Base64) first
      if (f.contentBase64) {
        try {
          const blob = await base64ToBlob(f.contentBase64);
          url = URL.createObjectURL(blob);
          isPersisted = true;
        } catch (e) { console.error(e); }
      }
      // 2. Fallback to Supabase Storage Signed URL
      else if (supabase && userId) {
        try {
          // Construct path: user_id/file_id
          const { data, error } = await supabase.storage
            .from('azubidocument')
            .createSignedUrl(`${userId}/${f.id}`, 60 * 60 * 24, {
              download: f.name // Force browser to download instead of navigate
            });

          if (data?.signedUrl) {
            url = data.signedUrl;
            isPersisted = true;
          }
        } catch (e) {
           console.error("Error creating signed URL", e);
        }
      }

      hydrated.push({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        uploadDate: f.uploadDate,
        url: url,
        isPersisted
      });
    }
    return hydrated;
  },
  
  processFileUpload: async (file: File): Promise<{ contentBase64: string | null, isPersisted: boolean }> => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { contentBase64: null, isPersisted: false };
    }
    try {
      const base64 = await blobToBase64(file);
      return { contentBase64: base64, isPersisted: true };
    } catch (e) {
      return { contentBase64: null, isPersisted: false };
    }
  }
};

const updateLocalPartial = (email: string, partial: Partial<UserData>) => {
  try {
    const key = getUserKey(email);
    const existingStr = localStorage.getItem(key);
    const existing = existingStr ? JSON.parse(existingStr) : { todos: [], files: [], xp: 0, completedReports: [] };
    const merged = { ...existing, ...partial };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) { console.error("Local Save Error", e); }
};
