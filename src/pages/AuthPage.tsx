import React, { useState } from 'react';
import { Eye, EyeOff, Heart, Loader2, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, sendEmailOTP, verifyEmailOTP, sendSMSCode, verifySMSCode } = useAuth();
  const { actualTheme, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'email-otp' | 'sms-otp'>('password');
  const [verificationId, setVerificationId] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    phoneNumber: '',
    password: '',
    otpCode: ''
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
        // Signup
        const userData = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phoneNumber,
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
        if (authMode === 'password') {
          const success = await login(formData.email, formData.password);
          if (success) {
            toast.success('Welcome back! 🔐');
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
          setVerificationId('email-otp-sent');
          toast.success('6-digit code sent to your email! Please check your inbox.');
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
        const success = await verifyEmailOTP(formData.email, formData.otpCode);
        if (success) {
          toast.success('Welcome back! 📧');
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

  const handleSMSOTP = async () => {
    if (!verificationId) {
      setIsLoading(true);
      setError('');
      
      try {
        const result = await sendSMSCode(formData.phoneNumber, 'recaptcha-container');
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
      setIsLoading(true);
      setError('');
      
      try {
        const success = await verifySMSCode(verificationId, formData.otpCode);
        if (success) {
          toast.success('Welcome to AI LOVVE! 📱');
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

          {/* Auth Mode Selector - Sadece signin için göster */}
          {!isSignUp && (
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-1 bg-surface-elevated rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className={`py-3 px-2 text-xs font-medium rounded-full transition-all duration-300 ${
                    authMode === 'password' 
                      ? 'bg-accent-primary text-white shadow-lg transform scale-105' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  🔐 Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('email-otp')}
                  className={`py-3 px-2 text-xs font-medium rounded-full transition-all duration-300 ${
                    authMode === 'email-otp' 
                      ? 'bg-accent-primary text-white shadow-lg transform scale-105' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  📧 Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('sms-otp')}
                  className={`py-3 px-2 text-xs font-medium rounded-full transition-all duration-300 ${
                    authMode === 'sms-otp' 
                      ? 'bg-accent-primary text-white shadow-lg transform scale-105' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  📱 SMS OTP
                </button>
              </div>
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
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-modern rounded-xl"
              placeholder="Enter your email address"
              required
            />

            {/* Phone Input */}
            {(isSignUp || authMode === 'sms-otp') && (
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

            {/* Password Input */}
            {(isSignUp || authMode === 'password') && (
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
            )}

            {/* OTP Code Input */}
            {!isSignUp && (authMode === 'email-otp' || authMode === 'sms-otp') && verificationId && (
              <input
                type="text"
                name="otpCode"
                value={formData.otpCode}
                onChange={handleInputChange}
                className="input-modern rounded-xl text-center text-lg tracking-widest"
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            )}

            {/* Buttons */}
            <div className="pt-4 space-y-4">
              
              {/* Signup Button */}
              {isSignUp && (
                <button
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.name || !formData.phoneNumber || !formData.password}
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
                      onClick={handleSMSOTP}
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

          {/* Forgot Password */}
          {!isSignUp && authMode === 'password' && (
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
          {!isSignUp && (
            <div className="text-center pt-6">
              <p className="text-sm text-text-secondary">
                Don't have an account?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
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
                  onClick={() => setIsSignUp(false)}
                  disabled={isLoading}
                  className="text-accent-primary hover:text-accent-secondary transition-colors font-medium disabled:opacity-50 underline decoration-accent-primary/30 underline-offset-2 hover:decoration-accent-secondary/50"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}

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

      {/* reCAPTCHA container for SMS auth */}
      <div id="recaptcha-container" className="hidden"></div>
    </div>
  );
};

export default AuthPage;