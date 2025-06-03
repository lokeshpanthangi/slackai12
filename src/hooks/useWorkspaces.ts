
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
    // Only fetch workspaces when we have a valid session
    if (session?.user?.id) {
      console.log('Session or refresh trigger changed, fetching workspaces...');
      fetchWorkspaces(session.user.id);
    } else {
      setLoading(false);
    }
  }, [session, refreshTrigger]);

  const fetchWorkspaces = async (userId: string) => {
    try {
      console.log('Fetching workspaces for user ID:', userId);
      setLoading(true);
      
      // Use our dedicated API function to get workspaces
      const data = await getUserWorkspaces(userId);
      console.log('Workspaces fetched:', data.length || 0);
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, url: string, slug?: string) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const userId = session.user.id;
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
      
      console.log('Workspace data to insert:', workspaceData);
      
      // Use our dedicated API function to create the workspace
      const workspace = await apiCreateWorkspace(workspaceData);
      console.log('Workspace created successfully:', workspace);
      
      // Force a refresh of the workspaces list
      console.log('Forcing workspace refresh after creation');
      refreshWorkspaces();
      
      // Also directly fetch to ensure we have the latest data
      console.log('Also directly fetching workspaces to ensure latest data');
      await fetchWorkspaces(userId);
      
      // Manually add the new workspace to the state if it's not already there
      setWorkspaces(currentWorkspaces => {
        // Check if the workspace is already in the list
        const exists = currentWorkspaces.some(w => w.id === workspace.id);
        if (!exists) {
          console.log('Manually adding new workspace to state');
          return [...currentWorkspaces, workspace];
        }
        return currentWorkspaces;
      });
      
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const joinWorkspace = async (workspaceUrl: string) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    try {
      const userId = session.user.id;
      console.log('Joining workspace with URL:', workspaceUrl);
      
      // For now, we'll just search for a workspace with the given URL
      // In a real implementation, you would need a proper invitation system
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('url', workspaceUrl)
        .single();

      if (error) throw error;
      
      // In a real implementation, you would add the user to a workspace_members table
      // For now, we'll just return the found workspace
      await fetchWorkspaces(userId);
      return data;
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
    refetch: fetchWorkspaces
  };
};
