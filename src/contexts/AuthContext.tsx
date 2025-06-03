
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  status: {
    text: string;
    emoji: string;
    expiration?: Date;
  };
  presence: 'active' | 'away' | 'offline' | 'dnd';
  timezone: string;
  role: string;
  workspaceId?: string;
}

export interface Workspace {
  id: string;
  name: string;
  url: string;
  icon?: string;
  isAdmin: boolean;
  slug?: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateUserStatus: (status: { text: string; emoji: string; expiration?: Date }) => void;
  updateUserPresence: (presence: 'active' | 'away' | 'offline' | 'dnd') => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  setWorkspace: (workspace: Workspace) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session && !!user;

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setWorkspaceState(null);
          localStorage.removeItem('slack_workspace');
          localStorage.removeItem('workspace_selected');
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        }
        
        // Also check localStorage for workspace selection
        const savedWorkspace = localStorage.getItem('slack_workspace');
        if (savedWorkspace && mounted) {
          try {
            setWorkspaceState(JSON.parse(savedWorkspace));
          } catch (error) {
            console.error('Error parsing saved workspace:', error);
            localStorage.removeItem('slack_workspace');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return;
      }

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        displayName: profile?.display_name || supabaseUser.email?.split('@')[0] || '',
        avatar: profile?.avatar,
        status: {
          text: profile?.status_text || '',
          emoji: profile?.status_emoji || ''
        },
        presence: profile?.presence || 'offline',
        timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        role: 'Member'
      };

      console.log('User profile loaded:', userData.email);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('Login successful:', data.user?.email);
      // Session will be handled by the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      console.log('Signup successful:', data.user?.email);
      
      // If user is created, the profile will be created automatically via trigger
      // Session will be handled by the auth state change listener
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error('Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setWorkspaceState(null);
      localStorage.removeItem('slack_workspace');
      localStorage.removeItem('workspace_selected');
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserStatus = async (status: { text: string; emoji: string; expiration?: Date }) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            status_text: status.text,
            status_emoji: status.emoji,
            status_expiration: status.expiration?.toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        const updatedUser = { ...user, status };
        setUser(updatedUser);
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  };

  const updateUserPresence = async (presence: 'active' | 'away' | 'offline' | 'dnd') => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ presence })
          .eq('id', user.id);

        if (error) throw error;

        const updatedUser = { ...user, presence };
        setUser(updatedUser);
      } catch (error) {
        console.error('Error updating user presence:', error);
      }
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      // Implementation would update workspace context
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  const setWorkspace = (newWorkspace: Workspace) => {
    setWorkspaceState(newWorkspace);
    localStorage.setItem('slack_workspace', JSON.stringify(newWorkspace));
    localStorage.setItem('workspace_selected', 'true');
  };

  const value: AuthContextType = {
    user,
    workspace,
    session,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUserStatus,
    updateUserPresence,
    switchWorkspace,
    setWorkspace
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
