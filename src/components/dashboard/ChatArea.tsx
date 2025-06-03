
import React, { useState, useEffect, useRef } from 'react';
import { Hash, Users, Pin, Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useMessages } from '@/hooks/useMessages';
import { useMessages as useMessageContext } from '@/contexts/MessageContext';
import { User } from '@/contexts/AuthContext';

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  description?: string;
  unreadCount?: number;
  createdAt: string;
  createdBy?: string;
}

interface ChatAreaProps {
  channel: string | null;
  user: User | null;
  channels: Channel[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ channel, user, channels }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useMessages(channel || undefined);
  const { setSelectedThread } = useMessageContext();
  
  const currentChannel = channels.find(c => c.id === channel);
  const isDM = channel?.startsWith('dm-');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!channel || !user?.id) return;
    
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleThreadClick = (messageId: string) => {
    if (channel) {
      setSelectedThread({
        channelId: channel,
        messageId: messageId
      });
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-dark text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to your workspace!</h2>
          <p className="text-gray-400">Select a channel to start messaging.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-dark text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-dark">
      {/* Header */}
      <div className="h-16 bg-chat-dark border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center">
          {isDM ? (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-medium text-sm">
                  {channel.replace('dm-', '').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">
                  {channel.replace('dm-', '')}
                </h1>
                <p className="text-green-400 text-sm">● Active</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {currentChannel?.isPrivate ? (
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-white" />
                </div>
              ) : (
                <Hash className="w-6 h-6 text-gray-400 mr-3" />
              )}
              <div>
                <h1 className="text-white font-semibold text-lg">
                  {currentChannel?.name || channel}
                </h1>
                {currentChannel?.description && (
                  <p className="text-gray-400 text-sm">{currentChannel.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Pin className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <h3 className="text-lg font-medium mb-2">
              {isDM ? 'Start a conversation' : `Welcome to #${currentChannel?.name || channel}`}
            </h3>
            <p className="text-sm">
              {isDM 
                ? 'Send a direct message to get the conversation started.'
                : 'This is the beginning of your conversation in this channel.'
              }
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              showAvatar={true}
              onThreadClick={() => handleThreadClick(message.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg border border-gray-600">
          <MessageInput
            channelId={channel}
            placeholder={isDM ? "Message..." : `Message #${currentChannel?.name || channel}`}
            onSendMessage={handleSendMessage}
            channelMessages={messages}
            channelName={currentChannel?.name || channel}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
