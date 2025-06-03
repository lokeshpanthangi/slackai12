import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users, LogOut, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WorkspacesPage: React.FC = () => {
  const { user, logout, setWorkspace } = useAuth();
  const { workspaces, loading, createWorkspace, joinWorkspace, refetch } = useWorkspaces();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [joinWorkspaceUrl, setJoinWorkspaceUrl] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [createWorkspaceData, setCreateWorkspaceData] = useState({
    name: '',
    description: '',
    slug: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [launchingWorkspaceId, setLaunchingWorkspaceId] = useState<string | null>(null);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetch();
    toast({
      title: 'Refreshing',
      description: 'Fetching latest workspaces...',
    });
  };

  const handleLaunchWorkspace = async (workspaceId: string) => {
    try {
      setLaunchingWorkspaceId(workspaceId);
      console.log('Launching workspace:', workspaceId);
      
      const selectedWorkspace = workspaces.find(ws => ws.id === workspaceId);
      if (!selectedWorkspace) {
        throw new Error('Workspace not found');
      }

      const workspaceData = {
        id: selectedWorkspace.id,
        name: selectedWorkspace.name,
        url: selectedWorkspace.url,
        slug: selectedWorkspace.slug,
        isAdmin: selectedWorkspace.created_by === user?.id
      };
      
      console.log('Setting workspace in auth context:', workspaceData);
      
      // Set workspace in context and wait for it to be set
      setWorkspace(workspaceData);
      
      // Store in localStorage for persistence
      localStorage.setItem('slack_workspace', JSON.stringify(workspaceData));
      localStorage.setItem('workspace_selected', 'true');
      
      // Clear any existing navigation state
      localStorage.removeItem('navigation_state');
      
      toast({
        title: 'Workspace Selected',
        description: `Launching ${selectedWorkspace.name} workspace...`,
      });
      
      // Wait a bit longer to ensure state is properly set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Navigating to dashboard...');
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Error launching workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to launch workspace. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLaunchingWorkspaceId(null);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!createWorkspaceData.name || !createWorkspaceData.slug) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    try {
      const url = `${createWorkspaceData.slug}.slack.com`;
      console.log('Creating workspace with data:', {
        name: createWorkspaceData.name,
        url,
        slug: createWorkspaceData.slug
      });
      
      const workspace = await createWorkspace(createWorkspaceData.name, url, createWorkspaceData.slug);
      console.log('Workspace created:', workspace);
      
      setShowCreateWorkspace(false);
      setCreateWorkspaceData({ name: '', description: '', slug: '' });
      
      toast({
        title: "Success",
        description: `Workspace ${createWorkspaceData.name} created successfully!`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      
      const errorMessage = error?.message || error?.details || "Failed to create workspace. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!joinWorkspaceUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid workspace URL or ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsJoining(true);
    try {
      console.log('Attempting to join workspace:', joinWorkspaceUrl);
      const result = await joinWorkspace(joinWorkspaceUrl);
      
      toast({
        title: "Success",
        description: result.message || "Successfully joined workspace!",
        variant: "default"
      });
      
      setJoinWorkspaceUrl('');
      setShowJoinForm(false);
    } catch (error: any) {
      console.error('Error joining workspace:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join workspace. Please check the URL/ID and try again.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slack-aubergine via-purple-700 to-slack-dark-aubergine flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-slack-aubergine border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white">Loading workspaces...</p>
          <p className="text-white/60 text-sm mt-2">User: {user?.email || 'Not loaded'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slack-aubergine via-purple-700 to-slack-dark-aubergine">
      {/* Header */}
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

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={handleRefresh}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
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
            
            {workspaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slack-text-secondary mb-4">
                  You don't have any workspaces yet. Create one or join an existing workspace to get started.
                </p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="mr-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Refreshing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {workspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center justify-between p-4 border border-slack-border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slack-aubergine rounded-lg flex items-center justify-center text-white text-xl">
                        {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slack-text-primary">{workspace.name}</h3>
                        <div className="flex items-center text-sm text-slack-text-secondary">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="mr-2">Workspace</span>
                          {workspace.created_by === user?.id && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
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
                      disabled={launchingWorkspaceId === workspace.id}
                    >
                      {launchingWorkspaceId === workspace.id ? 'Launching...' : 'LAUNCH SLACK'}
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
                  placeholder="Enter workspace URL, ID, or slug"
                  value={joinWorkspaceUrl}
                  onChange={(e) => setJoinWorkspaceUrl(e.target.value)}
                  className="text-15"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleJoinWorkspace}
                    className="bg-slack-aubergine hover:bg-slack-aubergine/90 text-white flex-1"
                    disabled={!joinWorkspaceUrl.trim() || isJoining}
                  >
                    {isJoining ? 'Joining...' : 'Join Workspace'}
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <Input
                placeholder="What's this workspace for?"
                value={createWorkspaceData.description}
                onChange={(e) => setCreateWorkspaceData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Workspace URL</label>
              <div className="flex items-center">
                <Input
                  placeholder="my-company"
                  value={createWorkspaceData.slug}
                  onChange={(e) => setCreateWorkspaceData(prev => ({ ...prev, slug: e.target.value }))}
                  className="rounded-r-none"
                />
                <span className="bg-gray-100 border border-l-0 px-3 py-2 text-sm text-gray-600 rounded-r-md">
                  .slack.com
                </span>
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleCreateWorkspace}
                disabled={!createWorkspaceData.name.trim() || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Workspace'}
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
