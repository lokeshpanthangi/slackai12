
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface User extends SupabaseUser {
  displayName: string;
  status: {
    text: string;
    emoji: string;
  };
  presence: 'active' | 'away' | 'offline' | 'dnd';
  timezone: string;
  role: string;
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  url: string;
  slug?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  setWorkspace: (workspace: Workspace | null) => void;
  updateUserStatus: (status: { text: string; emoji: string }) => void;
  updateUserPresence: (presence: 'active' | 'away' | 'offline' | 'dnd') => void;
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
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transform Supabase user to our User type
  const transformUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    
    return {
      ...supabaseUser,
      displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
      status: {
        text: supabaseUser.user_metadata?.status_text || '',
        emoji: supabaseUser.user_metadata?.status_emoji || '😀'
      },
      presence: supabaseUser.user_metadata?.presence || 'active',
      timezone: supabaseUser.user_metadata?.timezone || 'UTC',
      role: supabaseUser.user_metadata?.role || 'member',
      avatar: supabaseUser.user_metadata?.avatar
    };
  };

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, hasSession: !!session, hasUser: !!session?.user });
        
        setSession(session);
        setUser(session?.user ? transformUser(session.user) : null);
        
        // Load workspace from localStorage when user is authenticated
        if (session?.user) {
          try {
            const savedWorkspace = localStorage.getItem('slack_workspace');
            if (savedWorkspace) {
              const parsedWorkspace = JSON.parse(savedWorkspace);
              console.log('Loaded workspace from localStorage:', parsedWorkspace);
              setWorkspace(parsedWorkspace);
            }
          } catch (error) {
            console.error('Error loading workspace from localStorage:', error);
          }
        } else {
          // Clear workspace when user logs out
          setWorkspace(null);
          localStorage.removeItem('slack_workspace');
          localStorage.removeItem('workspace_selected');
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      console.log('Initial session check:', { hasSession: !!session, hasUser: !!session?.user });
      
      setSession(session);
      setUser(session?.user ? transformUser(session.user) : null);
      
      // Load workspace from localStorage if user is authenticated
      if (session?.user) {
        try {
          const savedWorkspace = localStorage.getItem('slack_workspace');
          if (savedWorkspace) {
            const parsedWorkspace = JSON.parse(savedWorkspace);
            console.log('Loaded workspace from localStorage on init:', parsedWorkspace);
            setWorkspace(parsedWorkspace);
          }
        } catch (error) {
          console.error('Error loading workspace from localStorage on init:', error);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        return { error };
      }
      
      console.log('Login successful:', { hasUser: !!data.user, hasSession: !!data.session });
      return { error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting signup for:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        return { error };
      }
      
      console.log('Signup successful:', { hasUser: !!data.user, hasSession: !!data.session });
      return { error: null };
    } catch (error) {
      console.error('Signup exception:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      setIsLoading(true);
      
      // Clear workspace data
      setWorkspace(null);
      localStorage.removeItem('slack_workspace');
      localStorage.removeItem('workspace_selected');
      localStorage.removeItem('navigation_state');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      } else {
        console.log('Logout successful');
      }
    } catch (error) {
      console.error('Logout exception:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = (status: { text: string; emoji: string }) => {
    console.log('Updating user status:', status);
    // This would typically update the user's status in the database
    // For now, just update local state
    if (user) {
      setUser({
        ...user,
        status
      });
    }
  };

  const updateUserPresence = (presence: 'active' | 'away' | 'offline' | 'dnd') => {
    console.log('Updating user presence:', presence);
    // This would typically update the user's presence in the database
    // For now, just update local state
    if (user) {
      setUser({
        ...user,
        presence
      });
    }
  };

  const handleSetWorkspace = (newWorkspace: Workspace | null) => {
    console.log('Setting workspace:', newWorkspace);
    setWorkspace(newWorkspace);
    
    if (newWorkspace) {
      localStorage.setItem('slack_workspace', JSON.stringify(newWorkspace));
      localStorage.setItem('workspace_selected', 'true');
    } else {
      localStorage.removeItem('slack_workspace');
      localStorage.removeItem('workspace_selected');
    }
  };

  const isAuthenticated = !!user && !!session;

  const value: AuthContextType = {
    user,
    session,
    workspace,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    setWorkspace: handleSetWorkspace,
    updateUserStatus,
    updateUserPresence,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
