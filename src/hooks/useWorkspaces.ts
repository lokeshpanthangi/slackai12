
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      console.log('Fetching workspaces for authenticated user');
      
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workspaces:', error);
        throw error;
      }

      console.log('Fetched workspaces:', data);
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id || user?.id;
    
    if (userId) {
      console.log('User authenticated, fetching workspaces:', userId);
      fetchWorkspaces();
    } else {
      console.log('No user authenticated');
      setLoading(false);
      setWorkspaces([]);
    }
  }, [session, user]);

  const createWorkspace = async (name: string, url: string, slug?: string) => {
    const userId = session?.user?.id || user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      const workspaceSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
      
      console.log('Creating workspace:', { name, url, slug: workspaceSlug });
      
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          url,
          slug: workspaceSlug,
          created_by: userId
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating workspace:', error);
        throw error;
      }
      
      console.log('Workspace created successfully:', workspace);
      
      // Refresh workspaces list
      await fetchWorkspaces();
      
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const joinWorkspace = async (identifier: string) => {
    try {
      console.log('Joining workspace with identifier:', identifier);
      
      const { data, error } = await supabase.rpc('join_workspace_by_identifier', {
        identifier: identifier
      });

      if (error) {
        console.error('Error joining workspace:', error);
        throw error;
      }

      const result = data?.[0];
      if (result?.success) {
        console.log('Successfully joined workspace:', result);
        await fetchWorkspaces();
        return result;
      } else {
        throw new Error(result?.message || 'Failed to join workspace');
      }
    } catch (error) {
      console.error('Error joining workspace:', error);
      throw error;
    }
  };

  return {
    workspaces,
    loading,
    createWorkspace,
    joinWorkspace,
    refetch: fetchWorkspaces
  };
};
