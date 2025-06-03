
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

  const fetchMessages = async () => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching messages for channel:', channelId);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(display_name, avatar)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }

    fetchMessages();
    
    // Set up real-time subscription for new messages
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
          console.log('New message received:', payload.new);
          setMessages(prev => [...prev, payload.new as DatabaseMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const sendMessage = async (content: string, parentMessageId?: string) => {
    if (!channelId || !user?.id) {
      throw new Error('Channel ID and user required');
    }

    try {
      console.log('Sending message:', { content, channelId, userId: user.id });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          channel_id: channelId,
          user_id: user.id,
          parent_message_id: parentMessageId
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully:', data);
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
