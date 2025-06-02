import React, { useState, useEffect, useRef } from 'react';
import { Mail, Eye, EyeOff, Heart, Sparkles, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: ''
  });

  const formRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll when form mode changes
  useEffect(() => {
    if (isSignUp && formRef.current) {
      // Wait for form animation to complete
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }, 200);
    } else if (!isSignUp && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [isSignUp]);

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
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const success = await register({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          password: formData.password,
        });

        if (success) {
          toast.success('Account created successfully! Welcome to AI LOVVE! 💕', {
            duration: 4000,
          });
          navigate('/');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        const success = await login(formData.email, formData.password);
        
        if (success) {
          toast.success('Welcome back to AI LOVVE! 💖', {
            duration: 3000,
          });
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

  const handleSocialAuth = async (provider: string) => {
    setIsLoading(true);
    setError('');

    try {
      if (provider === 'google') {
        const success = await signInWithGoogle();
        if (success) {
          toast.success('Welcome to AI LOVVE! 🌟', {
            duration: 3000,
          });
          navigate('/');
        } else {
          setError('Google authentication failed');
        }
      } else {
        setError(`${provider} authentication coming soon`);
      }
    } catch (error: any) {
      setError(error.message || `${provider} authentication failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({ email: '', password: '', confirmPassword: '', name: '', surname: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#2a2a2a] overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="relative flex items-start justify-center p-4 py-8"
        style={{ minHeight: isSignUp ? 'auto' : '100vh' }}
      >
        <div className="w-full max-w-md mx-auto">
          {/* Logo & Title Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
                  <Heart className="w-8 h-8 text-white fill-current" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center animate-spin-slow">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent mb-2">
              AI LOVVE
            </h1>
            <p className="text-white/60 text-sm md:text-base mb-6">
              Luxury Romance Planning Platform
            </p>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 animate-slide-up">
              {isSignUp ? 'Start Your Journey' : 'Welcome Back'}
            </h2>
            <p className="text-white/60 text-sm md:text-base animate-slide-up delay-100">
              {isSignUp 
                ? 'Create your account to begin planning magical moments'
                : 'Sign in to continue your romantic adventure'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-10 animate-shake">
              {error}
            </div>
          )}

          {/* Main Auth Card */}
          <div 
            ref={formRef}
            className="glassmorphism-card p-6 md:p-8 space-y-6 animate-slide-up delay-200"
          >
            {/* Social Auth Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleSocialAuth('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white hover:bg-white/15 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>

              <button
                onClick={() => handleSocialAuth('apple')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white hover:bg-white/15 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="font-medium">
                  {isLoading ? 'Connecting...' : 'Continue with Apple'}
                </span>
              </button>

              <button
                onClick={() => handleSocialAuth('meta')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white hover:bg-white/15 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium">
                  {isLoading ? 'Connecting...' : 'Continue with Meta'}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1f1f1f] text-white/60">or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-down">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      First Name
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pl-11 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:bg-white/15 focus:scale-105 transition-all duration-300 group-hover:border-white/30"
                        placeholder="First name"
                        required
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-yellow-400/70 transition-colors duration-300" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Last Name
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:bg-white/15 focus:scale-105 transition-all duration-300 group-hover:border-white/30"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-11 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:bg-white/15 focus:scale-105 transition-all duration-300 group-hover:border-white/30"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-yellow-400/70 transition-colors duration-300" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-11 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:bg-white/15 focus:scale-105 transition-all duration-300 group-hover:border-white/30"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 hover:scale-110 transition-all duration-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="animate-slide-down">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:bg-white/15 focus:scale-105 transition-all duration-300 group-hover:border-white/30"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
              )}

              {!isSignUp && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-yellow-400 bg-white/10 border-white/20 rounded focus:ring-yellow-400/50 focus:ring-2 group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="ml-2 text-white/60 group-hover:text-white/80 transition-colors duration-300">Remember me</span>
                  </label>
                  <a href="#" className="text-yellow-400 hover:text-yellow-300 hover:underline transition-all duration-300">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full golden-glass-button text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <div className="text-center">
              <p className="text-white/60 text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={handleModeSwitch}
                  disabled={isLoading}
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-all duration-300 disabled:opacity-50 hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 mb-8 animate-fade-in delay-300">
            <p className="text-white/40 text-xs">
              By continuing, you agree to our{' '}
              <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 