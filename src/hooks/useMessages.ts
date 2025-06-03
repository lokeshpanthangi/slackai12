
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DatabaseMessage {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  parent_message_id?: string;
  message_type?: string;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  profiles?: {
    display_name: string;
    avatar?: string;
  };
}

export const useMessages = (channelId?: string) => {
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as DatabaseMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const fetchMessages = async () => {
    if (!channelId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(display_name, avatar)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, parentMessageId?: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          channel_id: channelId,
          user_id: user?.id,
          parent_message_id: parentMessageId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages
  };
};
