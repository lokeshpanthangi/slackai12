import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SignUpFormProps {
  onBack: () => void;
  onSignIn: () => void;
  isCreatingWorkspace?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onBack,
  onSignIn,
  isCreatingWorkspace = false
}) => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    workspaceName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await signup(formData.email, formData.password, formData.displayName);
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slack-light-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-slack-text-secondary hover:text-slack-text-primary"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-slack-aubergine rounded-slack-xl flex items-center justify-center mb-6">
            {isCreatingWorkspace ? (
              <Building className="w-8 h-8 text-white" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slack-text-primary mb-2">
            {isCreatingWorkspace ? 'Create your workspace' : 'Create your account'}
          </h1>
          <p className="text-13 text-slack-text-secondary">
            {isCreatingWorkspace 
              ? 'Set up a new Slack workspace for your team'
              : 'Join the conversation with your team'
            }
          </p>
        </div>

        <Card className="slack-shadow border-slack">
          <CardHeader>
            <CardTitle className="text-18 text-slack-text-primary">
              {isCreatingWorkspace ? 'Workspace details' : 'Account information'}
            </CardTitle>
            <CardDescription className="text-13 text-slack-text-secondary">
              {isCreatingWorkspace 
                ? 'Enter your workspace and admin account details'
                : 'Fill in your information to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-slack-md">
                <p className="text-13 text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isCreatingWorkspace && (
                <div className="space-y-2">
                  <label htmlFor="workspace-name" className="text-15 font-bold text-slack-text-primary">
                    Workspace name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slack-text-muted" />
                    <Input
                      id="workspace-name"
                      type="text"
                      placeholder="Acme Corp"
                      value={formData.workspaceName}
                      onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                      className="pl-10 text-15 border-slack rounded-slack-md h-11 bg-white text-slate-900"
                      required
                    />
                  </div>
                  <p className="text-11 text-slack-text-muted">
                    This will be the name of your Slack workspace
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="display-name" className="text-15 font-bold text-slack-text-primary">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slack-text-muted" />
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="pl-10 text-15 border-slack rounded-slack-md h-11 bg-white text-slate-900"
                    required
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                <p className="text-11 text-slack-text-muted">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="agree-terms" className="text-13 text-slack-text-secondary leading-5">
                  I agree to the{' '}
                  <a href="#" className="text-slack-aubergine hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-slack-aubergine hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-slack-aubergine hover:bg-slack-aubergine/90 text-white font-bold h-11 rounded-slack-md"
                disabled={isLoading || !agreeToTerms}
              >
                {isLoading 
                  ? (isCreatingWorkspace ? 'Creating workspace...' : 'Creating account...') 
                  : (isCreatingWorkspace ? 'Create Workspace' : 'Create Account')
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-13 text-slack-text-secondary">
            Already have an account?{' '}
            <Button
              variant="link"
              onClick={onSignIn}
              className="text-13 text-slack-aubergine hover:text-slack-aubergine/80 p-0 font-normal"
            >
              Sign in instead
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
