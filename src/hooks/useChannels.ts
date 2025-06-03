
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

  const fetchChannels = async () => {
    if (!workspaceId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching channels for workspace:', workspaceId);
      
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (error) {
        console.error('Error fetching channels:', error);
        throw error;
      }
      
      console.log('Fetched channels:', data);
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [user, workspaceId]);

  const createChannel = async (name: string, description?: string, isPrivate = false) => {
    if (!workspaceId || !user?.id) {
      throw new Error('Workspace ID and user required');
    }

    try {
      console.log('Creating channel:', { name, description, isPrivate, workspaceId });
      
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name,
          description,
          is_private: isPrivate,
          workspace_id: workspaceId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating channel:', error);
        throw error;
      }
      
      console.log('Channel created successfully:', data);
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
