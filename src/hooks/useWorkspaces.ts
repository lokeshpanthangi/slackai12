
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

      // Fix: properly extract workspace data from the joined query result
      const workspaceData = data?.map(item => item.workspaces as DatabaseWorkspace).filter(Boolean) || [];
      setWorkspaces(workspaceData);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, url: string) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          url,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchWorkspaces();
      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  };

  return {
    workspaces,
    loading,
    createWorkspace,
    refetch: fetchWorkspaces
  };
};
