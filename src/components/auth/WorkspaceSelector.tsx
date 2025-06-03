
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Users } from 'lucide-react';

interface WorkspaceSelectorProps {
  onWorkspaceSelect: (workspaceUrl: string) => void;
  onCreateWorkspace: () => void;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  onWorkspaceSelect,
  onCreateWorkspace
}) => {
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceUrl.trim()) return;

    setIsLoading(true);
    try {
      // Navigate to workspaces page where user can see their actual workspaces
      navigate('/workspaces');
    } catch (error) {
      console.error('Error finding workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = () => {
    // Navigate to workspaces page where user can create a workspace
    navigate('/workspaces');
  };

  return (
    <div className="min-h-screen bg-slack-light-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-slack-aubergine rounded-slack-xl flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slack-text-primary mb-2">
            Sign in to Slack
          </h1>
          <p className="text-13 text-slack-text-secondary">
            Enter your workspace's Slack URL
          </p>
        </div>

        <Card className="slack-shadow border-slack">
          <CardHeader>
            <CardTitle className="text-18 text-slack-text-primary">
              Find your workspace
            </CardTitle>
            <CardDescription className="text-13 text-slack-text-secondary">
              Enter your workspace URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="workspace-url" className="text-15 font-bold text-slack-text-primary">
                  Workspace URL
                </label>
                <div className="relative">
                  <Input
                    id="workspace-url"
                    type="text"
                    placeholder="your-workspace"
                    value={workspaceUrl}
                    onChange={(e) => setWorkspaceUrl(e.target.value)}
                    className="pr-24 text-15 border-slack rounded-slack-md h-11"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-13 text-slack-text-muted">
                    .slack.com
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-slack-aubergine hover:bg-slack-aubergine/90 text-white font-bold h-11 rounded-slack-md"
                disabled={isLoading}
              >
                {isLoading ? 'Finding workspace...' : 'Continue'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slack-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slack-light-gray px-2 text-slack-text-muted">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleCreateWorkspace}
            className="w-full border-slack text-slack-text-primary hover:bg-slack-white h-11 rounded-slack-md"
          >
            Create a new workspace
          </Button>

          <p className="text-11 text-slack-text-muted">
            Don't have a workspace? You can create one for your team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
