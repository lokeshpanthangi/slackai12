
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

interface WorkspaceMemberResult {
  workspace_id: string;
  workspaces: DatabaseWorkspace;
}

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<DatabaseWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchWorkspaces();
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          workspaces!inner(*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Extract workspace data from the joined query result
      const workspaceData = data
        ?.map((item: any) => item.workspaces)
        .filter((workspace): workspace is DatabaseWorkspace => workspace !== null) || [];
      
      setWorkspaces(workspaceData);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, url: string, slug?: string) => {
    try {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name,
          url,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          created_by: user?.id
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add the user as a member of the workspace (this should happen automatically via trigger)
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user?.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('Error adding workspace member:', memberError);
        // Don't throw here as the trigger should handle this
      }
      
      await fetchWorkspaces();
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  const joinWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user?.id,
          role: 'member'
        });

      if (error) throw error;
      
      await fetchWorkspaces();
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
