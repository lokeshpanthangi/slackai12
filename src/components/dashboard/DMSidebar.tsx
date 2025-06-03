
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Users, 
  ChevronLeft,
  Settings,
  Bell
} from 'lucide-react';
import { User, Workspace } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';

interface DMSidebarProps {
  user: User | null;
  workspace: Workspace | null;
  onUserSelect: (userId: string) => void;
  onBackClick: () => void;
  selectedDM: string;
}

const DMSidebar: React.FC<DMSidebarProps> = ({
  user,
  workspace,
  onUserSelect,
  onBackClick,
  selectedDM
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Default workspace members
  const [workspaceMembers, setWorkspaceMembers] = useState([
    { id: 'dm-1', name: 'Sarah Wilson', presence: 'active', avatar: 'SW' },
    { id: 'dm-2', name: 'Mike Chen', presence: 'away', avatar: 'MC' },
    { id: 'dm-3', name: 'Emma Davis', presence: 'offline', avatar: 'ED' },
    { id: 'dm-4', name: 'John Smith', presence: 'active', avatar: 'JS' },
    { id: 'dm-5', name: 'Lisa Brown', presence: 'dnd', avatar: 'LB' },
  ]);

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case 'active': return 'bg-green-500';
      case 'away': return 'border-2 border-green-500 bg-transparent';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredMembers = workspaceMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 bg-slack-dark-aubergine text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="text-white hover:bg-white/10 p-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-bold text-18">Direct Messages</h1>
          <div className="w-6" />
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
            placeholder="Search people"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-md h-8 text-13"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mb-4">
          <h3 className="text-13 font-semibold text-white/70 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Workspace Members ({filteredMembers.length})
          </h3>
          
          <div className="space-y-1">
            {filteredMembers.map((member) => (
              <Button
                key={member.id}
                variant="ghost"
                onClick={() => onUserSelect(member.id)}
                className={`w-full justify-start text-white hover:bg-white/10 h-10 text-13 font-normal p-2 ${
                  selectedDM === member.id ? 'bg-white/20' : ''
                }`}
              >
                <div className="flex items-center w-full">
                  <div className="relative mr-3">
                    <div className="w-8 h-8 rounded-md overflow-hidden">
                      <UserAvatar 
                        name={member.name} 
                        size="sm" 
                        className="w-full h-full"
                      />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getPresenceColor(member.presence)}`} />
                  </div>
                  <span className="truncate">{member.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-1"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-1"
          >
            <Bell className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DMSidebar;
