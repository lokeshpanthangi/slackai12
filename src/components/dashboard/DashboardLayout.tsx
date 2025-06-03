
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageProvider, useMessages } from '@/contexts/MessageContext';
import NavigationSidebar from './NavigationSidebar';
import Sidebar from './Sidebar';
import DMSidebar from './DMSidebar';
import ChatArea from './ChatArea';
import ThreadSidebar from './ThreadSidebar';
import UserProfile from './UserProfile';
import CreateChannelModal from './CreateChannelModal';
import SearchModal from './SearchModal';
import WorkspaceSettings from './WorkspaceSettings';
import AIChatbox from './AIChatbox';

// Define the Channel interface
interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  description?: string;
  unreadCount?: number;
  createdAt: string;
  createdBy?: string;
}

const DashboardContent: React.FC = () => {
  const { user, workspace, logout } = useAuth();
  const { selectedThread, setSelectedThread } = useMessages();
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDMSidebar, setShowDMSidebar] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [showAIChatbox, setShowAIChatbox] = useState(false);
  const [favoriteChannel, setFavoriteChannel] = useState('general');
  
  // Initialize channels from localStorage or use default channels
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      // Get channels from localStorage based on workspace ID
      const workspaceId = workspace?.id || 'default';
      const savedChannels = localStorage.getItem(`channels_${workspaceId}`);
      if (savedChannels) {
        return JSON.parse(savedChannels);
      }
    } catch (error) {
      console.error('Error loading channels from localStorage:', error);
    }
    
    // Default channels if none found in localStorage
    return [
      { id: 'general', name: 'general', isPrivate: false, unreadCount: 0, createdAt: new Date().toISOString() },
      { id: 'random', name: 'random', isPrivate: false, unreadCount: 0, createdAt: new Date().toISOString() }
    ];
  });

  const handleCreateChannel = (channelData: { name: string; description: string; isPrivate: boolean }) => {
    // Create new channel with all necessary properties
    const newChannel: Channel = {
      id: channelData.name,
      name: channelData.name,
      isPrivate: channelData.isPrivate,
      description: channelData.description,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: user?.id
    };
    
    // Update channels list
    const updatedChannels = [...channels, newChannel];
    setChannels(updatedChannels);
    
    // Store updated channels in localStorage
    try {
      const workspaceId = workspace?.id || 'default';
      localStorage.setItem(`channels_${workspaceId}`, JSON.stringify(updatedChannels));
    } catch (error) {
      console.error('Error saving channels to localStorage:', error);
    }
    
    // Select the new channel
    setSelectedChannel(newChannel.id);
    setShowCreateChannel(false);
  };

  const handleHomeClick = () => {
    setSelectedChannel(favoriteChannel);
    setSelectedThread(null);
    setShowDMSidebar(false);
  };

  const handleDMClick = () => {
    setShowDMSidebar(true);
    setSelectedThread(null);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedChannel(userId);
    setShowDMSidebar(false);
  };

  const handleBackToBrowse = () => {
    setShowDMSidebar(false);
    setSelectedChannel(favoriteChannel);
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handleSettingsClick = () => {
    setShowWorkspaceSettings(true);
  };

  const handleInviteTeammates = () => {
    console.log('Invite teammates clicked');
    // TODO: Implement invite teammates functionality
  };
  
  const handleLogout = () => {
    // Remove workspace selection flag
    localStorage.removeItem('workspace_selected');
    // Call the logout function from AuthContext
    logout();
  };

  const handleAIClick = () => {
    setShowAIChatbox(true);
  };

  return (
    <div className="flex h-screen bg-chat-dark overflow-hidden">
      <NavigationSidebar 
        onHomeClick={handleHomeClick}
        onDMClick={handleDMClick}
        onSearchClick={handleSearchClick}
        onSettingsClick={handleSettingsClick}
        onAIClick={handleAIClick}
      />
      
      {showDMSidebar ? (
        <DMSidebar
          user={user}
          workspace={workspace}
          selectedDM={selectedChannel}
          onUserSelect={handleUserSelect}
          onBackClick={handleBackToBrowse}
        />
      ) : (
        <Sidebar 
          user={user}
          workspace={workspace}
          currentChannel={selectedChannel}
          channels={channels}
          onChannelSelect={setSelectedChannel}
          onProfileClick={() => setShowUserProfile(true)}
          onCreateChannel={() => setShowCreateChannel(true)}
          onInviteTeammates={handleInviteTeammates}
          onLogout={handleLogout}
        />
      )}
      
      <div className="flex flex-1 relative">
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            selectedThread ? 'mr-[400px]' : ''
          }`}
        >
          <ChatArea 
            channel={selectedChannel}
            user={user}
            channels={channels}
          />
        </div>
        
        {selectedThread && (
          <div className="absolute right-0 top-0 h-full w-[400px] transition-all duration-300 ease-in-out">
            <ThreadSidebar />
          </div>
        )}
      </div>

      {showUserProfile && (
        <UserProfile 
          user={user}
          onClose={() => setShowUserProfile(false)}
        />
      )}

      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreateChannel={handleCreateChannel}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      <WorkspaceSettings
        isOpen={showWorkspaceSettings}
        onClose={() => setShowWorkspaceSettings(false)}
      />

      {/* AI Chatbox */}
      <AIChatbox
        isOpen={showAIChatbox}
        onClose={() => setShowAIChatbox(false)}
        channelNames={channels.reduce((acc, channel) => {
          acc[channel.id] = channel.name;
          return acc;
        }, {} as { [channelId: string]: string })}
      />
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  return (
    <MessageProvider>
      <DashboardContent />
    </MessageProvider>
  );
};

export default DashboardLayout;
