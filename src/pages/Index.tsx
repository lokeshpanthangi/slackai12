import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

type AuthStep = 'login' | 'signup';

const Index: React.FC = () => {
  const { isAuthenticated, isLoading, user, session } = useAuth();
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const navigate = useNavigate();
  
  // Debug authentication state in Index component
  useEffect(() => {
    console.log('Index component auth state:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      userEmail: user?.email
    });
  }, [isAuthenticated, isLoading, user, session]);
  
  // Separate useEffect for navigation to avoid race conditions
  useEffect(() => {
    // If authenticated, redirect to workspaces page
    if (isAuthenticated && !isLoading) {
      console.log('User is authenticated, redirecting to workspaces page');
      
      // Check if we have a workspace selected in localStorage
      const hasWorkspace = localStorage.getItem('workspace_selected') === 'true';
      const workspaceData = localStorage.getItem('slack_workspace');
      
      if (hasWorkspace && workspaceData) {
        console.log('Workspace found in localStorage, redirecting to dashboard');
        // Redirect to dashboard if workspace is selected
        window.location.href = '/';
      } else {
        console.log('No workspace selected, redirecting to workspaces page');
        // Force navigation to workspaces page
        window.location.href = '/workspaces';
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slack-light-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slack-aubergine rounded-slack-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slack-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }
  
  const handleSwitchToSignUp = () => {
    setAuthStep('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthStep('login');
  };

  const handleForgotPassword = () => {
    console.log('Forgot password flow');
    // Implement forgot password flow
  };

  // Show authentication forms for non-authenticated users
  switch (authStep) {
    case 'login':
      return (
        <LoginForm
          workspaceUrl=""
          onBack={() => {}} // Not needed in new flow
          onForgotPassword={handleForgotPassword}
          onSignUp={handleSwitchToSignUp}
        />
      );

    case 'signup':
      return (
        <SignUpForm
          onBack={handleSwitchToLogin}
          onSignIn={handleSwitchToLogin}
          isCreatingWorkspace={false}
        />
      );

    default:
      return (
        <LoginForm
          workspaceUrl=""
          onBack={() => {}}
          onForgotPassword={handleForgotPassword}
          onSignUp={handleSwitchToSignUp}
        />
      );
  }
};

export default Index;
