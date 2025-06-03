
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  MessageSquare, 
  Search,
  Settings,
  MoreHorizontal,
  Plus,
  LogOut,
  Zap,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';

interface NavigationSidebarProps {
  onHomeClick: () => void;
  onDMClick: () => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  onLogout?: () => void;
  onAIClick?: () => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onHomeClick,
  onDMClick,
  onSearchClick,
  onSettingsClick,
  onLogout,
  onAIClick
}) => {
  const [activeItem, setActiveItem] = useState('home');
  const [animating, setAnimating] = useState<string | null>(null);
  const navigate = useNavigate();
  const { workspace, user } = useAuth();
  const { members } = useWorkspaceMembers(workspace?.id);
  
  // Get available workspaces from localStorage
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  
  useEffect(() => {
    try {
      const savedWorkspaces = localStorage.getItem('user_workspaces');
      if (savedWorkspaces) {
        const parsedWorkspaces = JSON.parse(savedWorkspaces);
        
        // Apply filtering based on user email
        let filteredWorkspaces;
        if (user?.email === 'nanibroly@gmail.com') {
          // Show all workspaces for nanibroly@gmail.com
          filteredWorkspaces = parsedWorkspaces;
        } else {
          // Hide Test01 workspace for other users
          filteredWorkspaces = parsedWorkspaces.filter((ws: any) => ws.id !== '3' && ws.name !== 'Test01');
        }
        
        setWorkspaces(filteredWorkspaces);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  }, [user]);

  // Count DMs (workspace members excluding current user)
  const dmCount = members.filter(member => member.user_id !== user?.id).length;
  
  const handleItemClick = (item: string, callback: () => void) => {
    setAnimating(item);
    setActiveItem(item);
    
    // Add a small delay for the animation to complete
    setTimeout(() => {
      setAnimating(null);
      callback();
    }, 300);
  };
  
  // Handle workspace click - redirect to workspaces page
  const handleWorkspaceClick = () => {
    navigate('/workspaces');
  };
  
  return (
    <div className="w-20 bg-slack-aubergine flex flex-col items-center py-4 space-y-4">
      {/* Current Workspace Icon - Clickable */}
      <button 
        onClick={handleWorkspaceClick}
        className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4 hover:ring-2 hover:ring-white/30 transition-all cursor-pointer"
        title="Switch workspace"
      >
        <span className="text-slack-aubergine font-bold text-lg">
          {workspace?.name?.charAt(0) || 'M'}
        </span>
      </button>
      
      {/* Navigation Items */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'home' ? 'bg-white/20 scale-110' : ''} ${animating === 'home' ? 'animate-pulse' : ''}`}
          onClick={() => handleItemClick('home', onHomeClick)}
        >
          <div className="flex flex-col items-center">
            <Home className={`w-5 h-5 transition-all duration-300 ${activeItem === 'home' ? 'text-white scale-110' : 'text-gray-300'}`} />
            <span className="text-xs mt-1 font-light">Home</span>
          </div>
        </Button>
      </div>
      
      <div className="flex flex-col items-center relative">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'messages' ? 'bg-white/20 scale-110' : ''} ${animating === 'messages' ? 'animate-pulse' : ''}`}
          onClick={() => handleItemClick('messages', onDMClick)}
        >
          <div className="flex flex-col items-center">
            <MessageSquare className={`w-5 h-5 transition-all duration-300 ${activeItem === 'messages' ? 'text-white scale-110' : 'text-gray-300'}`} />
            <span className="text-xs mt-1 font-light">DMs</span>
          </div>
        </Button>
        {/* DM Count Badge */}
        {dmCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {dmCount > 99 ? '99+' : dmCount}
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'search' ? 'bg-white/20 scale-110' : ''} ${animating === 'search' ? 'animate-pulse' : ''}`}
          onClick={() => handleItemClick('search', onSearchClick)}
        >
          <div className="flex flex-col items-center">
            <Search className={`w-5 h-5 transition-all duration-300 ${activeItem === 'search' ? 'text-white scale-110' : 'text-gray-300'}`} />
            <span className="text-xs mt-1 font-light">Search</span>
          </div>
        </Button>
      </div>
      
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'settings' ? 'bg-white/20 scale-110' : ''} ${animating === 'settings' ? 'animate-pulse' : ''}`}
          onClick={() => handleItemClick('settings', onSettingsClick)}
        >
          <div className="flex flex-col items-center">
            <Settings className={`w-5 h-5 transition-all duration-300 ${activeItem === 'settings' ? 'text-white scale-110 rotate-45' : 'text-gray-300'}`} />
            <span className="text-xs mt-1 font-light">Settings</span>
          </div>
        </Button>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'add' ? 'bg-white/20 scale-110' : ''} ${animating === 'add' ? 'animate-pulse' : ''}`}
          onClick={() => {
            setAnimating('add');
            setActiveItem('add');
            setTimeout(() => setAnimating(null), 300);
          }}
        >
          <div className="flex flex-col items-center">
            <Plus className="w-5 h-5 text-gray-300 transition-all duration-300 hover:text-white hover:scale-110 hover:rotate-90" />
            <span className="text-xs mt-1 font-light">Add</span>
          </div>
        </Button>
      </div>
      
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'ai' ? 'bg-white/20 scale-110' : ''} ${animating === 'ai' ? 'animate-pulse' : ''}`}
          onClick={() => handleItemClick('ai', onAIClick || (() => {}))}
        >
          <div className="flex flex-col items-center">
            <Sparkles className={`w-5 h-5 transition-all duration-300 ai-icon-glow ai-icon-shine ${activeItem === 'ai' ? 'text-blue-400 scale-110' : 'text-blue-300'}`} />
            <span className="text-xs mt-1 font-light">AI</span>
          </div>
        </Button>
      </div>
      
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="sm"
          className={`w-12 h-12 p-0 text-white hover:bg-white/20 rounded-lg transition-all duration-300 ${activeItem === 'workspaces' ? 'bg-white/20 scale-110' : ''} ${animating === 'workspaces' ? 'animate-pulse' : ''}`}
          onClick={() => {
            setAnimating('workspaces');
            // Redirect to workspaces page
            setTimeout(() => {
              window.location.href = '/workspaces';
            }, 300);
          }}
        >
          <div className="flex flex-col items-center">
            <LogOut className="w-5 h-5 text-red-400 transition-all duration-300 hover:text-red-300 hover:scale-110" />
            <span className="text-xs mt-1 font-light text-red-400">Workspaces</span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default NavigationSidebar;
