import React, { useState, useEffect, useRef } from 'react';
import { Mail, Eye, EyeOff, Heart, Sparkles, User, Loader2, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, signInWithGoogle, sendEmailSignInLink, sendEmailOTP, sendSMSCode, verifySMSCode, signInWithEmailLink } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'email-link' | 'sms'>('email-link');
  const [verificationId, setVerificationId] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
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
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Signup - Email + Password + Phone
        const userData = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phoneNumber,
          password: formData.password
        };
        
        const success = await register(userData);
        if (success) {
          toast.success(`Welcome to AI LOVVE, ${formData.name}! 🎉`, {
            duration: 3000,
          });
          navigate('/');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        // Sign In - Password based
        if (authMode === 'password') {
          const success = await login(formData.email, formData.password);
          if (success) {
            toast.success('Welcome back! 🔐', { duration: 3000 });
            navigate('/');
          } else {
            setError('Invalid email or password');
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleEmailOTP = async () => {
    if (!verificationId) {
      // Send Email OTP
      setIsLoading(true);
      setError('');
      
      try {
        const success = await sendEmailOTP(formData.email);
        if (success) {
          setVerificationId('email-otp-sent'); // Dummy ID to show OTP field
          toast.success('OTP code sent to your email! Check your inbox.', {
            duration: 5000,
          });
        } else {
          setError('Failed to send email OTP');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to send email OTP');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Verify Email OTP
      setIsLoading(true);
      setError('');
      
      try {
        // Email link ile OTP verification (simulated)
        const success = await signInWithEmailLink(window.location.href + '?email=' + formData.email, formData.email);
        if (success) {
          toast.success('Welcome back! 📧', { duration: 3000 });
          navigate('/');
        } else {
          setError('Invalid OTP code');
        }
      } catch (error: any) {
        setError(error.message || 'OTP verification failed');
      } finally {
        setIsLoading(false);
      }
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
        const success = await verifySMSCode(verificationId, formData.otpCode);
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
    setFormData({ email: '', name: '', surname: '', phoneNumber: '', password: '', otpCode: '' });
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
            <div className="space-y-6 max-w-sm mx-auto">
              
              {/* Auth Mode Selector - Şık pill buttons */}
              <div className="flex gap-1 bg-surface-elevated rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('email-link')}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-all duration-300 ${
                    authMode === 'email-link' 
                      ? 'bg-accent-primary text-white shadow-lg transform scale-105' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  📧 Email Link
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('sms')}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-all duration-300 ${
                    authMode === 'sms' 
                      ? 'bg-accent-primary text-white shadow-lg transform scale-105' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  📱 SMS Code
                </button>
              </div>

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
                {authMode === 'email-link' && (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-modern rounded-xl"
                    placeholder="Enter your email address"
                    required
                  />
                )}

                {/* Phone Input for SMS */}
                {authMode === 'sms' && (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="input-modern rounded-xl"
                    placeholder="Enter your phone number (+90 5xx xxx xxxx)"
                    required
                  />
                )}

                {/* SMS Verification Code */}
                {authMode === 'sms' && verificationId && (
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    className="input-modern rounded-xl"
                    placeholder="Enter verification code"
                    required
                  />
                )}

                {/* Action Buttons - Yuvarlak ve şık */}
                <div className="pt-4 space-y-4">
                  
                  {/* Signup Button */}
                  {isSignUp && (
                    <button
                      type="submit"
                      disabled={isLoading || (authMode === 'email-link' && !formData.email) || (authMode === 'sms' && !formData.phoneNumber)}
                      className="w-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white py-4 rounded-full font-medium disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <span>✨ Create Account</span>
                      )}
                    </button>
                  )}

                  {/* Sign In Buttons */}
                  {!isSignUp && (
                    <>
                      {/* Password Sign In */}
                      {authMode === 'password' && (
                        <button
                          type="submit"
                          disabled={isLoading || !formData.email || !formData.password}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-full font-medium disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Signing In...</span>
                            </div>
                          ) : (
                            <span>🔐 Sign In</span>
                          )}
                        </button>
                      )}

                      {/* Email OTP Sign In */}
                      {authMode === 'email-otp' && (
                        <button
                          type="button"
                          onClick={handleEmailOTP}
                          disabled={isLoading || !formData.email || (verificationId && !formData.otpCode)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-full font-medium disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>{verificationId ? 'Verifying...' : 'Sending Code...'}</span>
                            </div>
                          ) : (
                            <span>{verificationId ? '✅ Verify Email OTP' : '📧 Send Email OTP'}</span>
                          )}
                        </button>
                      )}

                      {/* SMS OTP Sign In */}
                      {authMode === 'sms-otp' && (
                        <button
                          type="button"
                          onClick={handleSMSAuth}
                          disabled={isLoading || (!verificationId && !formData.phoneNumber) || (verificationId && !formData.otpCode)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-full font-medium disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>{verificationId ? 'Verifying...' : 'Sending Code...'}</span>
                            </div>
                          ) : (
                            <span>{verificationId ? '✅ Verify SMS OTP' : '📱 Send SMS OTP'}</span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
            </form>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 glass border border-error/30 rounded-lg">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {/* Forgot Password - Sadece password modunda göster */}
              {!isSignUp && authMode === 'password' && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Firebase'in built-in password reset
                      if (formData.email) {
                        import('firebase/auth').then(({ sendPasswordResetEmail }) => {
                          import('../firebase').then(({ auth }) => {
                            sendPasswordResetEmail(auth, formData.email).then(() => {
                              toast.success('Password reset email sent! Check your inbox.', { duration: 5000 });
                            }).catch((error) => {
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