
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown,
  ChevronRight,
  Hash,
  Lock,
  Plus,
  Search,
  MoreVertical,
  UserPlus,
  MessageSquare,
  Bell,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { User, Workspace } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessageContext';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import DirectMessageModal from './DirectMessageModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  onChannelSelect: (channel: string) => void;
  onCreateChannel: () => void;
  onInviteTeammates: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  workspace,
  currentChannel,
  channels,
  onChannelSelect,
  onCreateChannel,
  onInviteTeammates,
  onProfileClick,
  onLogout
}) => {
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [directMessagesExpanded, setDirectMessagesExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const { messages } = useMessages();
  const { members } = useWorkspaceMembers(workspace?.id);

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case 'active': return 'bg-green-500';
      case 'away': return 'border-2 border-green-500 bg-transparent';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getUnreadCount = (channelId: string) => {
    return 0;
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter workspace members for direct messages (exclude current user)
  const directMessages = members
    .filter(member => member.user_id !== user?.id)
    .filter(member =>
      member.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(member => ({
      id: `dm-${member.user_id}`,
      name: member.profiles?.display_name || 'User',
      presence: member.profiles?.presence || 'offline',
      role: member.role
    }));

  const handleDirectMessageSelect = (userId: string) => {
    onChannelSelect(userId);
  };

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-[#2c0e36] text-white flex flex-col shadow-xl">
      {/* Workspace Header */}
      <motion.div 
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        className="p-4 border-b border-white/10 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <motion.h1 
              className="font-bold text-xl truncate"
              whileHover={{ scale: 1.02 }}
            >
              {workspace?.name}
            </motion.h1>
          </div>
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-5 h-5 text-white/60" />
          </motion.div>
        </div>
        
        <div className="flex items-center mt-2">
          <motion.div 
            className="w-3 h-3 bg-green-500 rounded-full"
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.2 }}
          />
          <span className="ml-2 text-base opacity-80">{user?.displayName}</span>
        </div>
      </motion.div>

      {/* Search */}
      <div className="p-4">
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            type="text"
            placeholder="Search channels"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-md h-9 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </motion.div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4 pt-0 sidebar-content">
        <div className="mb-4">
          {/* Channels Section */}
          <motion.div whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} className="rounded-md">
            <Button
              variant="ghost"
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full justify-between text-white hover:bg-white/10 h-10 px-2 mb-1 transition-all duration-200"
            >
              <div className="flex items-center text-base font-semibold text-white/70">
                <motion.div
                  animate={{ rotate: channelsExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 mr-1" />
                </motion.div>
                Channels
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateChannel();
                        }}
                        className="hover:bg-white/20 h-7 w-7 p-0 rounded-full"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Create a new channel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
          </motion.div>
          
          <AnimatePresence>
            {channelsExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pt-1">
                  {filteredChannels.map((channel) => {
                    const isActive = currentChannel === channel.id;
                    return (
                      <motion.div
                        key={channel.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => onChannelSelect(channel.id)}
                          className={`w-full justify-start text-white hover:bg-white/10 h-9 text-base font-normal px-2 transition-all duration-200 ${
                            isActive ? 'bg-white/20 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center min-w-0">
                              <motion.div
                                whileHover={{ rotate: isActive ? 0 : 10, scale: 1.1 }}
                                className="mr-2 flex-shrink-0"
                              >
                                {channel.isPrivate ? (
                                  <Lock className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-white/70'}`} />
                                ) : (
                                  <Hash className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-white/70'}`} />
                                )}
                              </motion.div>
                              <span className="truncate">{channel.name}</span>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Messages Section */}
        <div className="mb-4">
          <motion.div whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} className="rounded-md">
            <Button
              variant="ghost"
              onClick={() => setDirectMessagesExpanded(!directMessagesExpanded)}
              className="w-full justify-between text-white hover:bg-white/10 h-10 px-2 mb-1 transition-all duration-200"
            >
              <div className="flex items-center text-base font-semibold text-white/70">
                <motion.div
                  animate={{ rotate: directMessagesExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 mr-1" />
                </motion.div>
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1.5 text-white/70" />
                  Direct messages
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDirectMessageModal(true);
                        }}
                        className="hover:bg-white/20 h-7 w-7 p-0 rounded-full"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Start a direct message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
          </motion.div>
          
          <AnimatePresence>
            {directMessagesExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pt-1">
                  {directMessages.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-white/60 text-sm">No team members found</p>
                    </div>
                  ) : (
                    directMessages.map((dm) => {
                      const isActive = currentChannel === dm.id;
                      return (
                        <motion.div
                          key={dm.id}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="ghost"
                            onClick={() => handleDirectMessageSelect(dm.id)}
                            className={`w-full justify-start text-white hover:bg-white/10 h-9 text-base font-normal px-2 transition-all duration-200 ${
                              isActive ? 'bg-white/20 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center min-w-0">
                                <motion.div 
                                  className="relative mr-2 flex-shrink-0"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  <div className="w-4 h-4 rounded-full overflow-hidden">
                                    <UserAvatar 
                                      name={dm.name} 
                                      size="xs" 
                                      className="w-full h-full"
                                    />
                                  </div>
                                  <motion.div 
                                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${getPresenceColor(dm.presence)}`}
                                    animate={dm.presence === 'active' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: dm.presence === 'active' ? Infinity : 0, duration: 2 }}
                                  />
                                </motion.div>
                                <span className="truncate">{dm.name}</span>
                              </div>
                              {dm.role === 'admin' && (
                                <span className="text-xs text-white/60">Admin</span>
                              )}
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex justify-around border-t border-white/10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onInviteTeammates}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Users className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Invite teammates</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto">
        <motion.div 
          className="p-4 border-t border-white/10"
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <Button
            variant="ghost"
            onClick={onProfileClick}
            className="w-full justify-start text-white hover:bg-white/10 h-12 px-2 transition-all duration-200"
          >
            <div className="flex items-center">
              <motion.div 
                className="relative mr-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-base">
                    {user?.displayName?.charAt(0).toUpperCase() || 'T'}
                  </span>
                </div>
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2c0e36]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium text-base truncate">
                  {user?.displayName || 'User'}
                </div>
                <div className="text-white/60 text-sm">
                  {user?.status?.emoji || '✨'} {user?.status?.text || 'Active'}
                </div>
              </div>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* Direct Message Modal */}
      <DirectMessageModal
        isOpen={showDirectMessageModal}
        onClose={() => setShowDirectMessageModal(false)}
        onUserSelect={handleDirectMessageSelect}
      />
    </motion.div>
  );
};

export default Sidebar;
