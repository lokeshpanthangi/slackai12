
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    display_name: string;
    avatar?: string;
    presence?: string;
  };
}

export const useWorkspaceMembers = (workspaceId?: string) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMembers = async () => {
    if (!workspaceId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching workspace members for:', workspaceId);
      
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profiles(display_name, avatar, presence)
        `)
        .eq('workspace_id', workspaceId)
        .order('joined_at');

      if (error) {
        console.error('Error fetching workspace members:', error);
        throw error;
      }
      
      console.log('Fetched workspace members:', data);
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    
    // Set up real-time subscription for workspace member changes
    if (workspaceId) {
      const channel = supabase
        .channel(`workspace-members-${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workspace_members',
            filter: `workspace_id=eq.${workspaceId}`
          },
          () => {
            fetchMembers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, workspaceId]);

  return {
    members,
    loading,
    refetch: fetchMembers
  };
};
