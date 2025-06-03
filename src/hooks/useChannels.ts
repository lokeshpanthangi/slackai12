
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DatabaseChannel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useChannels = (workspaceId?: string) => {
  const [channels, setChannels] = useState<DatabaseChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !workspaceId) {
      setLoading(false);
      return;
    }

    fetchChannels();
  }, [user, workspaceId]);

  const fetchChannels = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async (name: string, description?: string, isPrivate = false) => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name,
          description,
          is_private: isPrivate,
          workspace_id: workspaceId,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchChannels();
      return data;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  };

  return {
    channels,
    loading,
    createChannel,
    refetch: fetchChannels
  };
};
