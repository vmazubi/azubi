
import { UserProfile } from '../types';
import { getSupabase } from './supabase';

const DB_KEY = 'vmarkt_auth_db';

interface StoredUser extends UserProfile {
  password: string; 
}

export const authService = {
  // --- Local Mock Helpers (Fallback) ---
  getUsers: (): StoredUser[] => {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Auth DB Error", e);
      return [];
    }
  },

  // --- Supabase & Auth Methods ---

  register: async (name: string, email: string, password: string): Promise<{ user: UserProfile | null, session: any | null, requiresConfirmation: boolean }> => {
    const supabase = getSupabase();
    
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw new Error(error.message);
      
      // If data.user is present but data.session is null, email confirmation is required
      if (data.user && !data.session) {
        return { user: null, session: null, requiresConfirmation: true };
      }

      if (!data.user) throw new Error("Registration failed");

      return {
        user: {
          id: data.user.id,
          name: name,
          email: email
        },
        session: data.session,
        requiresConfirmation: false
      };
    } else {
      // Local Mock
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = authService.getUsers();
          if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            reject(new Error("User with this email already exists. Please sign in."));
            return;
          }
          const newUser: StoredUser = { id: Date.now().toString(), name, email, password };
          users.push(newUser);
          localStorage.setItem(DB_KEY, JSON.stringify(users));
          const { password: _, ...profile } = newUser;
          resolve({ user: profile, session: {}, requiresConfirmation: false });
        }, 1000);
      });
    }
  },

  login: async (email: string, password: string): Promise<UserProfile> => {
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please confirm your email address before signing in.");
        }
        throw new Error(error.message);
      }
      
      if (!data.user) throw new Error("Login failed");

      return {
        id: data.user.id,
        name: data.user.user_metadata.full_name || email.split('@')[0],
        email: email
      };
    } else {
      // Local Mock
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = authService.getUsers();
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (!user) {
            reject(new Error("Account not found. Please register first."));
            return;
          }
          if (user.password !== password) {
            reject(new Error("Incorrect password."));
            return;
          }
          const { password: _, ...profile } = user;
          resolve(profile);
        }, 1000);
      });
    }
  },

  resetPasswordForEmail: async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return; // Mock: Do nothing

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Redirects back to app with access token
    });

    if (error) throw new Error(error.message);
  },

  updateUserPassword: async (newPassword: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw new Error(error.message);
  },

  logout: async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
};
