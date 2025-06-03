
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageProvider, useMessages } from '@/contexts/MessageContext';
import { useChannels } from '@/hooks/useChannels';
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

const DashboardContent: React.FC = () => {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();
  const { selectedThread, setSelectedThread } = useMessages();
  const { channels, loading: channelsLoading, createChannel } = useChannels(workspace?.id);
  
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDMSidebar, setShowDMSidebar] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [showAIChatbox, setShowAIChatbox] = useState(false);

  // Check if workspace is selected, if not redirect to workspaces page
  useEffect(() => {
    if (!workspace) {
      console.log('No workspace selected, redirecting to workspaces page');
      navigate('/workspaces', { replace: true });
      return;
    }
    console.log('Current workspace:', workspace);
  }, [workspace, navigate]);

  // Set default channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const generalChannel = channels.find(c => c.name === 'general') || channels[0];
      setSelectedChannel(generalChannel.id);
    }
  }, [channels, selectedChannel]);

  // Show loading state while workspace or channels are loading
  if (!workspace || channelsLoading) {
    return (
      <div className="min-h-screen bg-chat-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slack-aubergine rounded-slack-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white">
            {!workspace ? 'Loading workspace...' : 'Loading channels...'}
          </p>
        </div>
      </div>
    );
  }

  const handleCreateChannel = async (channelData: { name: string; description: string; isPrivate: boolean }) => {
    try {
      const newChannel = await createChannel(channelData.name, channelData.description, channelData.isPrivate);
      if (newChannel) {
        setSelectedChannel(newChannel.id);
      }
      setShowCreateChannel(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleHomeClick = () => {
    if (channels.length > 0) {
      const generalChannel = channels.find(c => c.name === 'general') || channels[0];
      setSelectedChannel(generalChannel.id);
    }
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
    if (channels.length > 0) {
      const generalChannel = channels.find(c => c.name === 'general') || channels[0];
      setSelectedChannel(generalChannel.id);
    }
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
    localStorage.removeItem('workspace_selected');
    logout();
  };

  const handleAIClick = () => {
    setShowAIChatbox(true);
  };

  // Convert database channels to the format expected by existing components
  const formattedChannels = channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    isPrivate: channel.is_private,
    description: channel.description,
    unreadCount: 0,
    createdAt: channel.created_at,
    createdBy: channel.created_by
  }));

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
          currentChannel={selectedChannel || ''}
          channels={formattedChannels}
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
            channels={formattedChannels}
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

      <AIChatbox
        isOpen={showAIChatbox}
        onClose={() => setShowAIChatbox(false)}
        channelNames={formattedChannels.reduce((acc, channel) => {
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
