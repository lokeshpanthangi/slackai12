
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface LoginFormProps {
  workspaceUrl: string;
  onBack: () => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  workspaceUrl,
  onBack,
  onForgotPassword,
  onSignUp
}) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Submitting login form with email:', email);
      
      // Call login function - navigation will be handled by Index component
      await login(email, password);
      console.log('Login successful');
      
      // Show success message
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // OAuth implementation would go here
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
            Enter your email and password to continue
          </p>
          <div className="mt-2">
            <a 
              href="/landing" 
              className="text-sm text-slack-blue hover:underline"
            >
              Visit our landing page
            </a>
          </div>
        </div>

        <Card className="slack-shadow border-slack">
          <CardHeader>
            <CardTitle className="text-18 text-slack-text-primary">
              Welcome back
            </CardTitle>
            <CardDescription className="text-13 text-slack-text-secondary">
              Sign in to access your workspaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-15 font-bold text-slack-text-primary">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slack-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-15 border-slack rounded-slack-md h-11 bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-15 font-bold text-slack-text-primary">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slack-text-muted" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-15 border-slack rounded-slack-md h-11 bg-white text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slack-text-muted hover:text-slack-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keep-signed-in"
                    checked={keepSignedIn}
                    onCheckedChange={(checked) => setKeepSignedIn(checked as boolean)}
                  />
                  <label htmlFor="keep-signed-in" className="text-13 text-slack-text-secondary">
                    Keep me signed in
                  </label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={onForgotPassword}
                  className="text-13 text-slack-aubergine hover:text-slack-aubergine/80 p-0"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-slack-aubergine hover:bg-slack-aubergine/90 text-white font-bold h-11 rounded-slack-md"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slack-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slack-text-muted">Or continue with</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin('Google')}
                  className="w-full border-slack text-slack-text-primary hover:bg-slack-light-gray h-11 rounded-slack-md"
                >
                  <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin('Microsoft')}
                  className="w-full border-slack text-slack-text-primary hover:bg-slack-light-gray h-11 rounded-slack-md"
                >
                  <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                    <path fill="#7fba00" d="M1 13h10v10H1z"/>
                    <path fill="#ffb900" d="M13 13h10v10H13z"/>
                  </svg>
                  Continue with Microsoft
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthLogin('Apple')}
                  className="w-full border-slack text-slack-text-primary hover:bg-slack-light-gray h-11 rounded-slack-md"
                >
                  <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
                  Continue with Apple
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-13 text-slack-text-secondary">
            New to Slack?{' '}
            <Button
              variant="link"
              onClick={onSignUp}
              className="text-13 text-slack-aubergine hover:text-slack-aubergine/80 p-0 font-normal"
            >
              Create an account
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
