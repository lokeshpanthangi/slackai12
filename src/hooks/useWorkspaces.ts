
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createWorkspace as apiCreateWorkspace, getUserWorkspaces } from '@/integrations/supabase/workspaceApi';

export interface DatabaseWorkspace {
  id: string;
  name: string;
  url: string;
  icon?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  slug?: string;
}

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<DatabaseWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to force a refresh of workspaces
  const refreshWorkspaces = () => {
    console.log('Manually triggering workspace refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    console.log('useWorkspaces effect triggered:', { 
      sessionExists: !!session, 
      userExists: !!user, 
      userId: session?.user?.id || user?.id,
      refreshTrigger 
    });

    // Try to get user ID from either session or user object
    const userId = session?.user?.id || user?.id;
    
    if (userId) {
      console.log('Found user ID, fetching workspaces:', userId);
      fetchWorkspaces(userId);
    } else {
      console.log('No user ID found, setting loading to false');
      setLoading(false);
      setWorkspaces([]);
    }
  }, [session, user, refreshTrigger]);

  const fetchWorkspaces = async (userId: string) => {
    try {
      console.log('Fetching workspaces for user ID:', userId);
      setLoading(true);
      
      const workspaceData = await getUserWorkspaces(userId);
      console.log('Fetched workspaces:', workspaceData);
      setWorkspaces(workspaceData);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, url: string, slug?: string) => {
    const userId = session?.user?.id || user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Generate a slug if not provided
      const workspaceSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
      
      console.log('Creating workspace for user:', userId);
      
      // Create the workspace data object
      const workspaceData = {
        name,
        url,
        slug: workspaceSlug,
        created_by: userId
      };
      
      console.log('Workspace data to create:', workspaceData);
      
      // Use our API function to create the workspace (this will also add the user as a member)
      const workspace = await apiCreateWorkspace(workspaceData);
      console.log('Workspace created successfully:', workspace);
      
      // Wait a moment for any triggers to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the workspaces list
      await fetchWorkspaces(userId);
      
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const joinWorkspace = async (workspaceUrl: string) => {
    const userId = session?.user?.id || user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('Joining workspace with URL:', workspaceUrl);
      
      // Find the workspace by URL
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('url', workspaceUrl)
        .single();

      if (error) throw error;
      
      // Add the user to the workspace_members table
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: userId,
          role: 'member'
        });
        
      if (memberError) throw memberError;
      
      await fetchWorkspaces(userId);
      return workspace;
    } catch (error) {
      console.error('Error joining workspace:', error);
      throw error;
    }
  };

  return {
    workspaces,
    setWorkspaces,
    loading,
    createWorkspace,
    joinWorkspace,
    refetch: () => {
      const userId = session?.user?.id || user?.id;
      if (userId) {
        fetchWorkspaces(userId);
      }
    },
    refreshWorkspaces
  };
};
