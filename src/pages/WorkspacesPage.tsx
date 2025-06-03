import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users, LogOut, X } from 'lucide-react';

interface MockWorkspace {
  id: string;
  name: string;
  memberCount: number;
  avatar: string;
  isOwner: boolean;
  slug: string;
  url: string;
}

const WorkspacesPage: React.FC = () => {
  const { user, logout, setWorkspace } = useAuth();
  const navigate = useNavigate();
  const [joinWorkspaceUrl, setJoinWorkspaceUrl] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [createWorkspaceData, setCreateWorkspaceData] = useState({
    name: '',
    description: '',
    slug: ''
  });

  // Initialize workspaces from localStorage or start with empty array
  const [userWorkspaces, setUserWorkspaces] = useState<MockWorkspace[]>(() => {
    try {
      const savedWorkspaces = localStorage.getItem('user_workspaces');
      if (savedWorkspaces) {
        return JSON.parse(savedWorkspaces);
      }
    } catch (error) {
      console.error('Error loading workspaces from localStorage:', error);
    }
    
    // Start with empty array - no default workspaces
    return [];
  });

  const handleLaunchWorkspace = (workspaceId: string) => {
    console.log('Launching workspace:', workspaceId);
    const selectedWorkspace = userWorkspaces.find(ws => ws.id === workspaceId);
    if (selectedWorkspace) {
      // First check if user is already authenticated
      const savedUser = localStorage.getItem('slack_user');
      
      if (!user && savedUser) {
        // If we have a saved user but not authenticated in context,
        // restore the user from localStorage to avoid re-authentication
        const parsedUser = JSON.parse(savedUser);
        // This would normally be handled by a proper auth system
        // For this mock, we're just ensuring the user stays logged in
      }
      
      // First, store the workspace data in localStorage
      const workspaceData = {
        id: selectedWorkspace.id,
        name: selectedWorkspace.name,
        url: selectedWorkspace.url,
        slug: selectedWorkspace.slug,
        isAdmin: selectedWorkspace.isOwner
      };
      
      localStorage.setItem('slack_workspace', JSON.stringify(workspaceData));
      
      // Store a flag in localStorage to indicate workspace is selected
      localStorage.setItem('workspace_selected', 'true');
      
      // Set the workspace in auth context
      setWorkspace(workspaceData);
      
      // Use a small timeout to ensure state updates before navigation
      setTimeout(() => {
        // Navigate to dashboard - use replace to avoid going back to workspaces
        navigate('/', { replace: true });
      }, 100);
    }
  };

  const handleCreateWorkspace = () => {
    // Validate form
    if (!createWorkspaceData.name || !createWorkspaceData.slug) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create a new workspace
    const newWorkspace: MockWorkspace = {
      id: `ws_${Date.now()}`, // Generate a unique ID
      name: createWorkspaceData.name,
      memberCount: 1, // Start with just the creator
      avatar: '🚀', // Default avatar
      isOwner: true,
      slug: createWorkspaceData.slug,
      url: `${createWorkspaceData.slug}.slack.com`
    };
    
    // Add to user workspaces
    const updatedWorkspaces = [...userWorkspaces, newWorkspace];
    setUserWorkspaces(updatedWorkspaces);
    
    // Save to localStorage
    localStorage.setItem('user_workspaces', JSON.stringify(updatedWorkspaces));
    
    // Reset form
    setShowCreateWorkspace(false);
    setCreateWorkspaceData({ name: '', description: '', slug: '' });
    
    // Show success message
    alert(`Workspace ${newWorkspace.name} created successfully!`);
  };

  const handleJoinWorkspace = () => {
    // Validate URL
    if (!joinWorkspaceUrl) {
      alert('Please enter a valid workspace URL');
      return;
    }
    
    // In a real app, this would make an API call to join the workspace
    // For this mock, we'll create a fake workspace based on the URL
    
    // Extract workspace name from URL
    let workspaceName = joinWorkspaceUrl;
    try {
      // Try to extract domain from URL
      const url = new URL(joinWorkspaceUrl);
      workspaceName = url.hostname.split('.')[0];
    } catch (e) {
      // If not a valid URL, use as is
      workspaceName = joinWorkspaceUrl.replace(/[^a-zA-Z0-9-]/g, '-');
    }
    
    // Create a new workspace
    const newWorkspace: MockWorkspace = {
      id: `ws_${Date.now()}`, // Generate a unique ID
      name: workspaceName.charAt(0).toUpperCase() + workspaceName.slice(1),
      memberCount: Math.floor(Math.random() * 50) + 5, // Random member count
      avatar: '🔗', // Default avatar for joined workspaces
      isOwner: false,
      slug: workspaceName.toLowerCase(),
      url: `${workspaceName.toLowerCase()}.slack.com`
    };
    
    // Add to user workspaces
    const updatedWorkspaces = [...userWorkspaces, newWorkspace];
    setUserWorkspaces(updatedWorkspaces);
    
    // Save to localStorage
    localStorage.setItem('user_workspaces', JSON.stringify(updatedWorkspaces));
    
    // Reset form
    setJoinWorkspaceUrl('');
    setShowJoinForm(false);
    
    // Show success message
    alert(`You've joined the ${newWorkspace.name} workspace!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slack-aubergine via-purple-700 to-slack-dark-aubergine">
      {/* Simplified Header - Only Logo/Name */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-slack-aubergine font-bold text-lg">S</span>
              </div>
              <span className="text-white font-bold text-xl">slack</span>
              <span className="text-white/60 text-sm">from Salesforce</span>
            </div>

            <Button
              variant="ghost"
              onClick={logout}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <span className="text-6xl mr-4">👋</span>
            <h1 className="text-5xl font-bold text-white">Welcome back</h1>
          </div>
        </div>

        {/* User Workspaces Section */}
        <div className="mb-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-slack-text-primary mb-6">
              Workspaces for {user?.email}
            </h2>
            
            {userWorkspaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slack-text-secondary mb-4">
                  You don't have any workspaces yet. Create one or join an existing workspace to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between p-4 border border-slack-border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slack-aubergine rounded-lg flex items-center justify-center text-white text-xl">
                        {workspace.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slack-text-primary">{workspace.name}</h3>
                        <div className="flex items-center text-sm text-slack-text-secondary">
                          <Users className="w-4 h-4 mr-1" />
                          {workspace.memberCount} members
                          {workspace.isOwner && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slack-text-secondary mt-1">
                          {workspace.url}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleLaunchWorkspace(workspace.id)}
                      className="bg-slack-aubergine hover:bg-slack-aubergine/90 text-white"
                    >
                      LAUNCH SLACK
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create New Workspace Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-orange-100 to-pink-100 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👩‍💻</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slack-text-primary text-lg">
                      Want to use Slack with a different team?
                    </h3>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCreateWorkspace(true)}
                  variant="outline"
                  className="border-slack-aubergine text-slack-aubergine hover:bg-slack-aubergine hover:text-white"
                >
                  CREATE A NEW WORKSPACE
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Join Workspace Section */}
        <div className="text-center">
          {!showJoinForm ? (
            <div>
              <p className="text-white/80 mb-4">
                Not seeing your workspace?{' '}
                <button 
                  onClick={() => setShowJoinForm(true)}
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Try using a different email address →
                </button>
              </p>
              <Button
                onClick={() => setShowJoinForm(true)}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Join a workspace
              </Button>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-slack-text-primary mb-4">Join a workspace</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Enter workspace URL, code, or invite link"
                  value={joinWorkspaceUrl}
                  onChange={(e) => setJoinWorkspaceUrl(e.target.value)}
                  className="text-15 bg-chat-dark border-gray-400 text-white placeholder:text-gray-400"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleJoinWorkspace}
                    className="bg-slack-aubergine hover:bg-slack-aubergine/90 text-white flex-1"
                    disabled={!joinWorkspaceUrl.trim()}
                  >
                    Join Workspace
                  </Button>
                  <Button
                    onClick={() => {
                      setShowJoinForm(false);
                      setJoinWorkspaceUrl('');
                    }}
                    variant="outline"
                    className="border-slack text-slack-text-secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Workspace Modal */}
      <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Workspace name</label>
              <Input
                placeholder="e.g. My Company"
                value={createWorkspaceData.name}
                onChange={(e) => setCreateWorkspaceData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-chat-dark border-gray-400 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <Input
                placeholder="What's this workspace for?"
                value={createWorkspaceData.description}
                onChange={(e) => setCreateWorkspaceData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-chat-dark border-gray-400 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Workspace URL</label>
              <div className="flex items-center">
                <Input
                  placeholder="my-company"
                  value={createWorkspaceData.slug}
                  onChange={(e) => setCreateWorkspaceData(prev => ({ ...prev, slug: e.target.value }))}
                  className="rounded-r-none bg-chat-dark border-gray-400 text-white placeholder:text-gray-400"
                />
                <span className="bg-gray-100 border border-l-0 px-3 py-2 text-sm text-gray-600 rounded-r-md">
                  .slack.com
                </span>
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleCreateWorkspace}
                disabled={!createWorkspaceData.name.trim()}
                className="flex-1"
              >
                Create Workspace
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateWorkspace(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspacesPage;
