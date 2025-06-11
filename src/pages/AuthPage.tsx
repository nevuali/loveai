import React, { useState, useEffect, useRef } from 'react';
import { Mail, Eye, EyeOff, Heart, Sparkles, User, Loader2, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, signInWithGoogle, sendEmailSignInLink, sendSMSCode, verifySMSCode, signInWithEmailLink } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'email-link' | 'sms'>('password');
  const [verificationId, setVerificationId] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    phoneNumber: ''
  });

  const formRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for email link authentication on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const email = urlParams.get('email');
    
    if (location.search && email) {
      // This might be an email link
      const handleEmailLinkAuth = async () => {
        try {
          const success = await signInWithEmailLink(window.location.href, email);
          if (success) {
            toast.success('Welcome to AI LOVVE! 📧', { duration: 3000 });
            navigate('/');
          } else {
            toast.error('Invalid or expired sign-in link');
          }
        } catch (error) {
          console.error('Email link auth error:', error);
          toast.error('Failed to authenticate with email link');
        }
      };
      
      handleEmailLinkAuth();
    }
  }, [location, signInWithEmailLink, navigate]);

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
    
    // Only handle password-based auth in form submit
    if (!isSignUp && authMode !== 'password') {
      return; // Prevent form submission for non-password modes
    }
    
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
      } else if (authMode === 'password') {
        // Only login with password if in password mode
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
        console.log('🚀 Google auth butonuna tıklandı');
        toast.loading('Redirecting to Google...', { id: 'google-auth' });
        
        const result = await signInWithGoogle();
        console.log('🔍 Google auth result:', result);
        
        if (result) {
          toast.success('Welcome to AI LOVVE! 🌟', { id: 'google-auth' });
          navigate('/');
        } else {
          toast.error('Google authentication failed', { id: 'google-auth' });
          setError('Google authentication failed. Please try again.');
        }
      } else {
        setError(`${provider} authentication coming soon`);
      }
    } catch (error: any) {
      console.error('❌ Google auth error:', error);
      toast.error(error.message || 'Google auth failed', { id: 'google-auth' });
      setError(error.message || `${provider} authentication failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLink = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await sendEmailSignInLink(formData.email);
      if (success) {
        toast.success('Sign-in link sent to your email! Check your inbox.', {
          duration: 5000,
        });
      } else {
        setError('Failed to send email link');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send email link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSMSAuth = async () => {
    if (!verificationId) {
      // Send SMS code
      setIsLoading(true);
      setError('');
      
      try {
        // reCAPTCHA container oluştur
        const recaptchaContainer = 'recaptcha-container';
        const result = await sendSMSCode(formData.phoneNumber, recaptchaContainer);
        
        if (result.success && result.verificationId) {
          setVerificationId(result.verificationId);
          toast.success('Verification code sent to your phone!');
        } else {
          setError(result.message || 'Failed to send SMS code');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to send SMS code');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Verify SMS code
      setIsLoading(true);
      setError('');
      
      try {
        const success = await verifySMSCode(verificationId, smsCode);
        if (success) {
          toast.success('Welcome to AI LOVVE! 📱', {
            duration: 3000,
          });
          navigate('/');
        } else {
          setError('Invalid verification code');
        }
      } catch (error: any) {
        setError(error.message || 'Verification failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setAuthMode('password');
    setVerificationId('');
    setSmsCode('');
    setFormData({ email: '', password: '', confirmPassword: '', name: '', surname: '', phoneNumber: '' });
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

      {/* Desktop Layout - Two Columns */}
      <div className="lg:grid lg:grid-cols-2 min-h-screen relative z-10">
        
        {/* Left Column - Form */}
        <div className="relative flex items-center justify-center min-h-screen px-4 lg:px-8">
          <div className="w-full max-w-md mx-auto text-center">
            
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

            {/* Form Section */}
            <div className="space-y-5 max-w-sm mx-auto">
              
              {/* Google Button - Premium Style */}
              <button
                onClick={() => handleSocialAuth('google')}
                disabled={isLoading}
                className="w-full golden-glass-button flex items-center justify-center gap-3 py-3.5 px-4 disabled:opacity-50 transition-all duration-300 text-sm font-medium group hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Redirecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider - Premium Style */}
              <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface text-text-tertiary text-xs font-medium uppercase tracking-wider">OR</span>
                </div>
            </div>

              {/* Auth Mode Selector */}
              {!isSignUp && (
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setAuthMode('password')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                      authMode === 'password' 
                        ? 'bg-accent-primary text-white' 
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('email-link')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                      authMode === 'email-link' 
                        ? 'bg-accent-primary text-white' 
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Email Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('sms')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                      authMode === 'sms' 
                        ? 'bg-accent-primary text-white' 
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    SMS
                  </button>
                </div>
              )}

              {/* Form */}
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
                {(authMode === 'password' || authMode === 'email-link' || isSignUp) && (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-modern"
                    placeholder="Enter your personal or work email"
                    required
                  />
                )}

                {/* Phone Input for SMS */}
                {authMode === 'sms' && !isSignUp && (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="input-modern"
                    placeholder="Enter your phone number (+90 5xx xxx xxxx)"
                    required
                  />
                )}

                {/* SMS Verification Code */}
                {authMode === 'sms' && verificationId && !isSignUp && (
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    className="input-modern"
                    placeholder="Enter verification code"
                    required
                  />
                )}

                {/* Password field for signup and password login */}
                {(isSignUp || authMode === 'password') && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input-modern pr-10"
                      placeholder={isSignUp ? "Create a password" : "Enter your password"}
                      required={isSignUp || authMode === 'password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Confirm password only for signup */}
                {isSignUp && (
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input-modern"
                    placeholder="Confirm your password"
                    required={isSignUp}
                  />
                )}

                {/* Submit Button - Premium Style */}
                <div className="pt-2">
                  {/* Password auth button */}
                  {(isSignUp || authMode === 'password') && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full golden-auth-btn disabled:opacity-50 transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-center">{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                        </div>
                      ) : (
                        <span className="text-center w-full">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      )}
                    </button>
                  )}

                  {/* Email link button */}
                  {authMode === 'email-link' && !isSignUp && (
                    <button
                      type="button"
                      onClick={handleEmailLink}
                      disabled={isLoading || !formData.email}
                      className="w-full golden-auth-btn disabled:opacity-50 transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Email Link...</span>
                        </div>
                      ) : (
                        <span>Send Sign-In Link</span>
                      )}
                    </button>
                  )}

                  {/* SMS button */}
                  {authMode === 'sms' && !isSignUp && (
                    <button
                      type="button"
                      onClick={handleSMSAuth}
                      disabled={isLoading || (!verificationId && !formData.phoneNumber) || (verificationId && !smsCode)}
                      className="w-full golden-auth-btn disabled:opacity-50 transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{verificationId ? 'Verifying...' : 'Sending Code...'}</span>
                        </div>
                      ) : (
                        <span>{verificationId ? 'Verify Code' : 'Send SMS Code'}</span>
                      )}
                    </button>
                  )}
                </div>
            </form>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 glass border border-error/30 rounded-lg">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

            {/* Switch Mode */}
              {!isSignUp && (
                <div className="text-center pt-6">
                  <p className="text-sm text-text-secondary">
                    Don't have an account?{' '}
                    <button
                      onClick={handleModeSwitch}
                      disabled={isLoading}
                      className="text-accent-primary hover:text-accent-secondary transition-colors font-medium disabled:opacity-50 underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-secondary/50"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              )}

              {isSignUp && (
                <div className="text-center pt-6">
                  <p className="text-sm text-text-secondary">
                    Already have an account?{' '}
                <button
                  onClick={handleModeSwitch}
                  disabled={isLoading}
                      className="text-accent-primary hover:text-accent-secondary transition-colors font-medium disabled:opacity-50 underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-secondary/50"
                >
                      Sign In
                </button>
                  </p>
                </div>
              )}
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

        {/* Right Column - Demo Content (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-center bg-surface-elevated px-8 relative">
          <div className="w-full max-w-lg relative z-10">
            
            {/* Demo Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center shadow-lg auth-heart-container">
                  <Heart className="w-4 h-4 auth-heart-icon" />
                </div>
                <span className="text-sm text-text-secondary">
                  Plan romantic date experiences and romantic getaways.
                </span>
              </div>
              <p className="text-text-primary font-medium">
                All set. Here's your personalized romantic plan.
              </p>
            </div>

            {/* Demo Code Block - Premium Style */}
            <div className="glass-elevated rounded-xl p-6 text-sm font-mono overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 rounded-xl"></div>
              <div className="text-text-secondary relative z-10">
                <div className="text-accent-primary font-medium">// Romantic Evening Plan</div>
                <div className="mt-2">
                  <span className="text-blue-400">const</span>{' '}
                  <span className="text-accent-tertiary">romanticEvening</span>{' '}
                  <span className="text-text-primary">=</span>{' '}
                  <span className="text-text-primary">{'{'}</span>
                </div>
                <div className="ml-4 text-green-400">
                  location: <span className="text-accent-primary">"Rooftop Restaurant"</span>,
                </div>
                <div className="ml-4 text-green-400">
                  time: <span className="text-accent-primary">"7:30 PM"</span>,
                </div>
                <div className="ml-4 text-green-400">
                  activities: <span className="text-text-primary">[</span>
                </div>
                <div className="ml-8 text-accent-primary">
                  "Candlelit dinner",
                </div>
                <div className="ml-8 text-accent-primary">
                  "Live jazz music",
                </div>
                <div className="ml-8 text-accent-primary">
                  "City skyline view"
                </div>
                <div className="ml-4 text-text-primary">],</div>
                <div className="ml-4 text-green-400">
                  mood: <span className="text-accent-primary">"intimate"</span>,
                </div>
                <div className="ml-4 text-green-400">
                  budget: <span className="text-accent-primary">"moderate"</span>
                </div>
                <div className="text-text-primary">{'}'}</div>
                
                <div className="mt-4">
                  <span className="text-blue-400">function</span>{' '}
                  <span className="text-accent-tertiary">createMagicalMoment</span>
                  <span className="text-text-primary">() {'{'}</span>
                </div>
                <div className="ml-4 text-accent-primary font-medium">// AI LOVVE's personalized touch</div>
                <div className="ml-4 text-blue-400">return</div>{' '}
                <span className="text-accent-primary">"Perfect evening awaits ❤️"</span>
                <div className="text-text-primary">{'}'}</div>
              </div>
            </div>

            {/* Demo Features - Premium Style */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="golden-luxury-dot"></div>
                <span>Personalized romantic experiences</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="golden-luxury-dot"></div>
                <span>Location-based recommendations</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <div className="golden-luxury-dot"></div>
                <span>Budget-friendly options</span>
              </div>
            </div>
          </div>
          
          {/* Right column background effects */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-accent-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent-secondary/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* reCAPTCHA container for SMS auth */}
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
};

export default AuthPage; 