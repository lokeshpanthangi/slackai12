
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  isPinned: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  reactions: { emoji: string; users: string[]; count: number }[];
  replies: Message[];
  replyCount: number;
  threadParticipants: string[];
  isPinned?: boolean;
}

export interface MessageContextType {
  messages: { [channelId: string]: Message[] };
  documents: { [channelId: string]: Document[] };
  addMessage: (channelId: string, message: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'replies' | 'replyCount'>) => void;
  addReply: (channelId: string, parentMessageId: string, reply: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'replies' | 'replyCount'>) => void;
  getMessages: (channelId: string) => Message[] | undefined;
  getAllPublicChannelMessages: () => { [channelId: string]: Message[] };
  getThreadReplies: (channelId: string, parentMessageId: string) => Message[];
  loadMessagesFromLocalStorage: () => { [channelId: string]: Message[] };
  selectedThread: { channelId: string; messageId: string } | null;
  setSelectedThread: React.Dispatch<React.SetStateAction<{ channelId: string; messageId: string } | null>>;
  pinMessage: (channelId: string, messageId: string) => void;
  unpinMessage: (channelId: string, messageId: string) => void;
  getPinnedMessages: (channelId: string) => Message[];
  addDocument: (channelId: string, document: Omit<Document, 'id'>) => void;
  getDocuments: (channelId: string) => Document[];
  getPinnedDocuments: (channelId: string) => Document[];
  pinDocument: (channelId: string, documentId: string) => void;
  unpinDocument: (channelId: string, documentId: string) => void;
  isPrivateChannel: (channelId: string) => boolean;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize messages from localStorage
  const [messages, setMessages] = useState<{ [channelId: string]: Message[] }>(() => {
    try {
      // Check for messages in localStorage for the current workspace
      // Try to load messages from Test01 workspace (id: 3)
      const savedMessages = localStorage.getItem('messages_3');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        Object.keys(parsedMessages).forEach(channelId => {
          parsedMessages[channelId] = parsedMessages[channelId].map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            replies: (msg.replies || []).map((reply: any) => ({
              ...reply,
              timestamp: new Date(reply.timestamp)
            }))
          }));
        });
        return parsedMessages;
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    }
    return {};
  });
  
  const [selectedThread, setSelectedThread] = useState<{ channelId: string; messageId: string } | null>(null);
  
  // Initialize documents state
  const [documents, setDocuments] = useState<{ [channelId: string]: Document[] }>(() => {
    try {
      const savedDocuments = localStorage.getItem('documents_3');
      if (savedDocuments) {
        const parsedDocuments = JSON.parse(savedDocuments);
        // Convert string timestamps back to Date objects
        Object.keys(parsedDocuments).forEach(channelId => {
          parsedDocuments[channelId] = parsedDocuments[channelId].map((doc: any) => ({
            ...doc,
            uploadedAt: new Date(doc.uploadedAt)
          }));
        });
        return parsedDocuments;
      }
    } catch (error) {
      console.error('Error loading documents from localStorage:', error);
    }
    return {};
  });

  // Helper function to save messages to localStorage
  const saveMessagesToLocalStorage = (updatedMessages: { [channelId: string]: Message[] }) => {
    try {
      localStorage.setItem('messages_3', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  };
  
  // Helper function to save documents to localStorage
  const saveDocumentsToLocalStorage = (updatedDocuments: { [channelId: string]: Document[] }) => {
    try {
      localStorage.setItem('documents_3', JSON.stringify(updatedDocuments));
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
    }
  };

  // Load messages from localStorage
  const loadMessagesFromLocalStorage = (): { [channelId: string]: Message[] } => {
    try {
      const savedMessages = localStorage.getItem('messages_3');
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    }
    return {};
  };

  const addMessage = (channelId: string, messageData: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'replies' | 'replyCount' | 'threadParticipants'>) => {
    const newMessage: Message = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      reactions: [],
      replies: [],
      replyCount: 0,
      threadParticipants: []
    };

    setMessages(prev => {
      const updatedMessages = {
        ...prev,
        [channelId]: [...(prev[channelId] || []), newMessage]
      };
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  const addReply = (channelId: string, messageId: string, replyData: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'replies' | 'replyCount' | 'threadParticipants'>) => {
    const reply: Message = {
      ...replyData,
      id: `reply-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      reactions: [],
      replies: [],
      replyCount: 0,
      threadParticipants: []
    };

    setMessages(prev => {
      const channelMessages = prev[channelId] || [];
      const updatedMessages = {
        ...prev,
        [channelId]: channelMessages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              replies: [...msg.replies, reply],
              replyCount: msg.replyCount + 1,
              threadParticipants: [...new Set([...msg.threadParticipants, replyData.userId])]
            };
          }
          return msg;
        })
      };
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  const addReaction = (channelId: string, messageId: string, emoji: string, userId: string) => {
    setMessages(prev => {
      const channelMessages = prev[channelId] || [];
      const updatedMessages = {
        ...prev,
        [channelId]: channelMessages.map(msg => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions.find(r => r.emoji === emoji);
            if (existingReaction) {
              if (!existingReaction.users.includes(userId)) {
                return {
                  ...msg,
                  reactions: msg.reactions.map(r => 
                    r.emoji === emoji 
                      ? { ...r, users: [...r.users, userId], count: r.count + 1 }
                      : r
                  )
                };
              }
            } else {
              return {
                ...msg,
                reactions: [...msg.reactions, { emoji, users: [userId], count: 1 }]
              };
            }
          }
          return msg;
        })
      };
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  const removeReaction = (channelId: string, messageId: string, emoji: string, userId: string) => {
    setMessages(prev => {
      const channelMessages = prev[channelId] || [];
      const updatedMessages = {
        ...prev,
        [channelId]: channelMessages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions.map(r => {
                if (r.emoji === emoji && r.users.includes(userId)) {
                  const newUsers = r.users.filter(u => u !== userId);
                  return { ...r, users: newUsers, count: r.count - 1 };
                }
                return r;
              }).filter(r => r.count > 0)
            };
          }
          return msg;
        })
      };
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  // Get messages for a specific channel
  const getMessages = (channelId: string): Message[] | undefined => {
    return messages[channelId];
  };

  // Get all messages from all public channels
  const getAllPublicChannelMessages = () => {
    // Create an object to hold messages by channel ID
    const channelMessages: { [channelId: string]: Message[] } = {};
    
    // Get all workspace channels
    const workspaceChannels = Object.keys(messages).filter(key => {
      // Check if the key contains a slash (workspace/channel format)
      if (key.includes('/')) {
        // Filter to include only public channels (those that don't start with '@')
        const [workspace, channel] = key.split('/');
        return channel && !channel.startsWith('@');
      }
      // Include regular channels (those without workspace prefix)
      return !key.startsWith('@');
    });
    
    // Get messages from each channel and organize them by channelId
    workspaceChannels.forEach(channelKey => {
      if (messages[channelKey] && Array.isArray(messages[channelKey])) {
        // Filter out any messages with invalid structure
        const validMessages = messages[channelKey].filter(msg => 
          msg && typeof msg === 'object' && msg.id && msg.channelId
        );
        
        // Add valid messages to the channelMessages object
        if (validMessages.length > 0) {
          channelMessages[channelKey] = validMessages;
        }
      }
    });
    
    return channelMessages;
  };
  
  // Get thread replies for a specific message
  const getThreadReplies = (channelId: string, parentMessageId: string) => {
    const channelMessages = getMessages(channelId);
    if (!channelMessages) return [];
    
    const parentMessage = channelMessages.find(msg => msg.id === parentMessageId);
    if (!parentMessage) return [];
    
    return parentMessage.replies || [];
  };

  // Pin a message
  const pinMessage = (channelId: string, messageId: string) => {
    setMessages(prev => {
      const channelMessages = prev[channelId] || [];
      const updatedMessages = {
        ...prev,
        [channelId]: channelMessages.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, isPinned: true };
          }
          return msg;
        })
      };
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  // Unpin a message
  const unpinMessage = (channelId: string, messageId: string) => {
    setMessages(prev => {
      const channelMessages = prev[channelId] || [];
      const updatedMessages = {
        ...prev,
        [channelId]: channelMessages.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, isPinned: false };
          }
          return msg;
        })
      };
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  // Get pinned messages for a channel
  const getPinnedMessages = (channelId: string): Message[] => {
    const channelMessages = messages[channelId] || [];
    return channelMessages.filter(msg => msg.isPinned);
  };

  // Add a document to a channel
  const addDocument = (channelId: string, documentData: Omit<Document, 'id'>) => {
    const newDocument: Document = {
      ...documentData,
      id: `doc-${Date.now()}-${Math.random()}`
    };

    setDocuments(prev => {
      const updatedDocuments = {
        ...prev,
        [channelId]: [...(prev[channelId] || []), newDocument]
      };
      saveDocumentsToLocalStorage(updatedDocuments);
      return updatedDocuments;
    });
  };

  // Get documents for a channel
  const getDocuments = (channelId: string): Document[] => {
    return documents[channelId] || [];
  };

  // Get pinned documents for a channel
  const getPinnedDocuments = (channelId: string): Document[] => {
    const channelDocuments = documents[channelId] || [];
    return channelDocuments.filter(doc => doc.isPinned);
  };

  // Pin a document
  const pinDocument = (channelId: string, documentId: string) => {
    setDocuments(prev => {
      const channelDocuments = prev[channelId] || [];
      const updatedDocuments = {
        ...prev,
        [channelId]: channelDocuments.map(doc => {
          if (doc.id === documentId) {
            return { ...doc, isPinned: true };
          }
          return doc;
        })
      };
      saveDocumentsToLocalStorage(updatedDocuments);
      return updatedDocuments;
    });
  };

  // Unpin a document
  const unpinDocument = (channelId: string, documentId: string) => {
    setDocuments(prev => {
      const channelDocuments = prev[channelId] || [];
      const updatedDocuments = {
        ...prev,
        [channelId]: channelDocuments.map(doc => {
          if (doc.id === documentId) {
            return { ...doc, isPinned: false };
          }
          return doc;
        })
      };
      saveDocumentsToLocalStorage(updatedDocuments);
      return updatedDocuments;
    });
  };

  // Check if a channel is private
  const isPrivateChannel = (channelId: string): boolean => {
    // Private channels start with '@' or have 'private' in their name
    return channelId.startsWith('@') || channelId.includes('private');
  };

  return (
    <MessageContext.Provider value={{
      messages,
      documents,
      addMessage,
      addReply,
      selectedThread,
      setSelectedThread,
      getMessages,
      getAllPublicChannelMessages,
      getThreadReplies,
      loadMessagesFromLocalStorage,
      pinMessage,
      unpinMessage,
      getPinnedMessages,
      addDocument,
      getDocuments,
      getPinnedDocuments,
      pinDocument,
      unpinDocument,
      isPrivateChannel
    }}>
      {children}
    </MessageContext.Provider>
  );
};
