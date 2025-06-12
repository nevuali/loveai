import React, { useState } from 'react';
import { Eye, EyeOff, Heart, Loader2, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, signInWithGoogle } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Sign Up
        const userData = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          password: formData.password
        };
        
        const success = await register(userData);
        if (success) {
          toast.success(`Welcome to AI LOVVE, ${formData.name}! 🎉`);
          navigate('/');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        // Sign In
        const success = await login(formData.email, formData.password);
        if (success) {
          toast.success('Welcome back! 🔐');
          navigate('/');
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await signInWithGoogle();
      if (response) {
        if (response.message === 'Redirecting to Google...') {
          toast.loading('Redirecting to Google...', { duration: 2000 });
          // Don't set loading to false here, let the redirect happen
          return;
        }
        
        toast.success('Welcome to AI LOVVE! 🚀');
        navigate('/');
      } else {
        setError('Google sign-in failed. Please try email/password instead.');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Google sign-in failed';
      
      if (errorMessage.includes('2-factor') || errorMessage.includes('multi-factor')) {
        setError('Your Google account has 2FA enabled. Please use email/password login below.');
        toast.error('Please use email/password login instead');
      } else if (errorMessage.includes('CORS') || errorMessage.includes('blocked')) {
        setError('Browser blocked Google sign-in. Please use email/password login below.');
        toast.error('Please try email/password login instead');
      } else {
        setError('Google sign-in failed. Please use email/password login below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface transition-colors duration-300 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/10 pointer-events-none"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-secondary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-tertiary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 w-12 h-12 glass-elevated rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-300 hover:scale-110"
        aria-label="Toggle theme"
      >
        {actualTheme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md mx-auto text-center relative z-10">
          
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center mb-4 relative">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center shadow-xl relative overflow-hidden auth-heart-container">
                <Heart className="w-8 h-8 auth-heart-icon relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent-tertiary/30 to-transparent"></div>
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-accent-primary/20 rounded-full blur-xl auth-heart-glow"></div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-text-primary">
                <span>AI </span>
                <span style={{
                  background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-tertiary), var(--color-accent-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 'bold'
                }}>LOVVE</span>
              </h2>
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-normal text-text-primary mb-4 leading-tight">
              {isSignUp ? 'Create your account' : 'Your ideas,'}
              <br />
              {isSignUp ? 'to begin planning' : 'amplified'}
            </h1>
            <p className="text-base text-text-secondary leading-relaxed">
              Privacy-first AI that helps you create romantic experiences with confidence.
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-4 px-6 rounded-full font-medium border border-gray-300 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-text-secondary">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields for signup */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-modern"
                  placeholder="First name"
                  required
                />
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  className="input-modern"
                  placeholder="Last name"
                />
              </div>
            )}

            {/* Email Input */}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-modern rounded-xl"
              placeholder="Enter your email address"
              required
            />

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-modern rounded-xl pr-12"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password || (isSignUp && !formData.name)}
                className="w-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white py-4 rounded-full font-medium disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  <span>{isSignUp ? '✨ Create Account' : '🔐 Sign In'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 glass border border-error/30 rounded-lg">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Forgot Password */}
          {!isSignUp && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  if (formData.email) {
                    import('firebase/auth').then(({ sendPasswordResetEmail }) => {
                      import('../firebase').then(({ auth }) => {
                        sendPasswordResetEmail(auth, formData.email).then(() => {
                          toast.success('Password reset email sent! Check your inbox.');
                        }).catch(() => {
                          toast.error('Failed to send password reset email');
                        });
                      });
                    });
                  } else {
                    toast.error('Please enter your email address first');
                  }
                }}
                className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Switch Mode */}
          <div className="text-center pt-6">
            <p className="text-sm text-text-secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                className="text-accent-primary hover:text-accent-secondary transition-colors font-medium disabled:opacity-50 underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-secondary/50"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-20 mb-8">
            <p className="text-xs text-text-tertiary leading-relaxed">
              By continuing, you acknowledge AI LOVVE's{' '}
              <a href="#" className="text-accent-primary hover:text-accent-secondary transition-colors underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-secondary/50">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;