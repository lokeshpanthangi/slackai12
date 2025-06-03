
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Hash, 
  Lock, 
  Plus, 
  Search, 
  ChevronDown, 
  MoreHorizontal,
  MessageSquare,
  Users,
  Bell,
  Settings,
  LogOut,
  Home
} from 'lucide-react';
import { User, Workspace } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  description?: string;
  unreadCount?: number;
  createdAt: string;
  createdBy?: string;
}

interface SidebarProps {
  user: User | null;
  workspace: Workspace | null;
  currentChannel: string;
  channels: Channel[];
  onChannelSelect: (channelId: string) => void;
  onProfileClick: () => void;
  onCreateChannel: () => void;
  onInviteTeammates: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  workspace,
  currentChannel,
  channels,
  onChannelSelect,
  onProfileClick,
  onCreateChannel,
  onInviteTeammates,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChannels, setShowChannels] = useState(true);
  const [showDirectMessages, setShowDirectMessages] = useState(true);

  // Start with completely empty direct messages - no mock data at all
  const [directMessages, setDirectMessages] = useState<Array<{
    id: string;
    name: string;
    presence: string;
    unreadCount: number;
    avatar: string;
  }>>([]);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectMessages = directMessages.filter(dm =>
    dm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case 'active': return 'bg-green-500';
      case 'away': return 'border-2 border-green-500 bg-transparent';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="w-64 bg-slack-dark-aubergine text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-18">{workspace?.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-1"
            onClick={onProfileClick}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center mt-1">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="ml-2 text-13 opacity-80">{user?.displayName}</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-md h-8 text-13"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Channels Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowChannels(!showChannels)}
            className="flex items-center justify-between w-full text-left text-13 font-semibold text-white/70 mb-2 hover:text-white/90"
          >
            <div className="flex items-center">
              <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showChannels ? '' : '-rotate-90'}`} />
              Channels
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCreateChannel();
              }}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1 h-auto"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </button>
          
          {showChannels && (
            <div className="space-y-1">
              {filteredChannels.map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  onClick={() => onChannelSelect(channel.id)}
                  className={`w-full justify-start text-white hover:bg-white/10 h-7 text-13 font-normal px-2 ${
                    currentChannel === channel.id ? 'bg-blue-600 hover:bg-blue-600' : ''
                  }`}
                >
                  {channel.isPrivate ? <Lock className="w-4 h-4 mr-2" /> : <Hash className="w-4 h-4 mr-2" />}
                  <span className="truncate">{channel.name}</span>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-1 min-w-0 h-4">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowDirectMessages(!showDirectMessages)}
            className="flex items-center justify-between w-full text-left text-13 font-semibold text-white/70 mb-2 hover:text-white/90"
          >
            <div className="flex items-center">
              <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showDirectMessages ? '' : '-rotate-90'}`} />
              Direct messages
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Add direct message clicked');
              }}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1 h-auto"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </button>
          
          {showDirectMessages && (
            <div className="space-y-1">
              {filteredDirectMessages.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-white/60 text-13">
                    No direct messages yet.
                  </p>
                </div>
              ) : (
                filteredDirectMessages.map((dm) => (
                  <Button
                    key={dm.id}
                    variant="ghost"
                    onClick={() => onChannelSelect(dm.id)}
                    className={`w-full justify-start text-white hover:bg-white/10 h-8 text-13 font-normal px-2 ${
                      currentChannel === dm.id ? 'bg-blue-600 hover:bg-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <div className="relative mr-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden">
                          <UserAvatar 
                            name={dm.name} 
                            size="sm" 
                            className="w-full h-full"
                          />
                        </div>
                        <div className={`absolute -bottom-0 -right-0 w-2 h-2 rounded-full ${getPresenceColor(dm.presence)}`} />
                      </div>
                      <span className="truncate flex-1">{dm.name}</span>
                      {dm.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1 min-w-0 h-4">
                          {dm.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onInviteTeammates}
              className="text-white hover:bg-white/10 p-1"
              title="Invite teammates"
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-white hover:bg-white/10 p-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
