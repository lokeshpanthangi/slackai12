import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send,
  Paperclip,
  Smile,
  AtSign,
  Hash,
  Bold,
  Italic,
  Code,
  Link2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ToneImpactMeter from './ToneImpactMeter';
import { analyzeTone } from '@/services/toneAnalyzer';

interface MessageInputProps {
  channelId?: string;
  placeholder?: string;
  onSendMessage?: (content: string, parentMessageId?: string) => Promise<any>;
  threadParentId?: string;
  onFileUpload?: (files: FileList) => void;
  channelMessages?: any[];
  channelName?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  placeholder = "Type a message...",
  onSendMessage,
  threadParentId,
  onFileUpload,
  channelMessages = [],
  channelName = ''
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toneData, setToneData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const analyzeMessageTone = async () => {
      if (message.trim().length > 10) {
        try {
          setIsAnalyzing(true);
          const analysis = await analyzeTone(message, channelMessages, channelName);
          setToneData(analysis);
        } catch (error) {
          console.error('Tone analysis failed:', error);
          setToneData(null);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        setToneData(null);
        setIsAnalyzing(false);
      }
    };

    const debounceTimer = setTimeout(analyzeMessageTone, 500);
    return () => clearTimeout(debounceTimer);
  }, [message, channelMessages, channelName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting || !onSendMessage) return;

    setIsSubmitting(true);
    
    try {
      await onSendMessage(message.trim(), threadParentId);
      setMessage('');
      setToneData(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const insertFormatting = (type: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? -4 : -10;
        break;
    }
    
    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);
    
    setTimeout(() => {
      const newPosition = start + formattedText.length + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onFileUpload) {
      onFileUpload(files);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to send messages
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tone Impact Meter */}
      {(toneData || isAnalyzing) && (
        <div className="mb-2">
          <ToneImpactMeter 
            analysis={toneData} 
            isLoading={isAnalyzing}
            message={message}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-2 p-3">
          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-1 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFormatting(!showFormatting)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
            >
              <Bold className="w-3 h-3" />
            </Button>
            
            {showFormatting && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('bold')}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
                  title="Bold"
                >
                  <Bold className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('italic')}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
                  title="Italic"
                >
                  <Italic className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('code')}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
                  title="Code"
                >
                  <Code className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('link')}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
                  title="Link"
                >
                  <Link2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-end space-x-2 px-3 pb-3">
          {/* File Upload */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFileSelect}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-600 flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[40px] max-h-[120px] resize-none bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 focus:outline-none px-0 py-2"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Emoji Picker */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-600 flex-shrink-0"
          >
            <Smile className="w-4 h-4" />
          </Button>
          
          {/* Send Button */}
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || isSubmitting}
            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </form>
    </div>
  );
};

export default MessageInput;
