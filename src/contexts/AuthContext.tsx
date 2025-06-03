
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

  // Debug authentication state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      hasWorkspace: !!workspace,
      userEmail: user?.email
    });
    
    // Store workspace selection state
    if (workspace) {
      localStorage.setItem('workspace_selected', 'true');
      localStorage.setItem('current_workspace_id', workspace.id);
      localStorage.setItem('slack_workspace', JSON.stringify(workspace));
    } else {
      localStorage.removeItem('workspace_selected');
      localStorage.removeItem('current_workspace_id');
    }
  }, [isAuthenticated, isLoading, user, session, workspace]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'User:', session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading profile...');
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state...');
          setUser(null);
          setWorkspaceState(null);
          localStorage.removeItem('slack_workspace');
          localStorage.removeItem('workspace_selected');
          localStorage.removeItem('current_workspace_id');
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
          console.log('Found existing session, loading user profile...');
          await loadUserProfile(session.user);
        }
        
        // Check localStorage for workspace selection
        const savedWorkspace = localStorage.getItem('slack_workspace');
        if (savedWorkspace && mounted) {
          try {
            console.log('Found saved workspace in localStorage');
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
      console.log('Loading profile for user:', supabaseUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              display_name: supabaseUser.email?.split('@')[0] || '',
              email: supabaseUser.email,
              presence: 'online',
              status_text: '',
              status_emoji: ''
            });
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            return;
          }
        } else {
          return;
        }
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
        presence: profile?.presence || 'online',
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
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error details:', error);
        throw error;
      }

      console.log('Login successful:', data.user?.email);
      // The auth state listener will handle setting user and session
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting signup for:', email);
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
      
      // Manually create profile if user is created
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            display_name: displayName,
            email: email,
            presence: 'online',
            status_text: '',
            status_emoji: ''
          });
          
        if (profileError) {
          console.error('Error creating profile during signup:', profileError);
        }
        
        // The auth state listener will handle setting user and session
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error?.message || 'Signup failed');
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
      localStorage.removeItem('current_workspace_id');
      
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
