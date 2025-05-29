import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, LogIn, Home, ChevronRight, Loader2, ArrowLeft, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
// import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Firebase importları yorum satırı yapıldı

// const auth = getAuth(); // auth tanımı kaldırıldı

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.096,44,30.537,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="20px" height="20px" viewBox="0 0 814 1000" fill="currentColor">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
  </svg>
);

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Demo login handler
  const handleDemoLogin = () => {
    localStorage.setItem('userMockAuthenticated', 'true');
    localStorage.setItem('userEmail', 'demo@ailovve.com');
    localStorage.setItem('userName', 'Demo User');
    window.location.reload();
  };

  // Firebase auth action handler
  const handleAuthAction = async () => {
    toast.error("Firebase authentication is currently disabled.");
    
    // Demo login (başarılı olursa ana sayfaya yönlendirir)
    if (isLogin && email === 'test@test.com' && password === 'password') {
      toast.success("Demo sign in successful!");
      localStorage.setItem('userMockAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      navigate('/');
    } else if (!isLogin && email === 'test@test.com' && password === 'password') {
        toast.success("Demo sign up successful!");
        localStorage.setItem('userMockAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        navigate('/');
    } else {
        toast.error("Invalid credentials or user not found.");
    }
  };

  // Social login handler
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    if (provider === 'google') {
      try {
        toast.info("Google Sign-In is not configured yet.");
      } catch (error: unknown) {
        let errorMessage = "Failed to sign in with Google.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Apple login is not currently supported.");
      setIsLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    toast.success("Demo signed out!");
    localStorage.removeItem('userMockAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white font-gemini flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 sidebar-header-glow">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 rounded-xl hover:bg-white/10 sidebar-glow transition-all duration-200 hover:scale-105"
              aria-label="Return to Homepage"
              disabled={isLoading}
            >
              <ArrowLeft className="w-5 h-5 text-white/60 hover:text-white/90" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-gradient flex items-center justify-center shadow-lg sidebar-icon-glow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent glow-text">
                  AI LOVE
                </h1>
                <p className="text-xs text-gray-400">Authentication</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Demo Login Button */}
          <div className="mb-6">
            <button
              onClick={handleDemoLogin}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 luxury-button gentle-floating soft-glow flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Sparkles className="w-5 h-5" />
              Continue with Demo Account
            </button>
          </div>

          {/* Auth Form */}
          <div className="glass-card rounded-2xl p-6 backdrop-blur-xl border border-white/10 sidebar-glow">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2 glow-text">
                {isLogin ? "Welcome Back" : "Join AI LOVE"}
              </h2>
              <p className="text-gray-400">
                {isLogin ? "Sign in to your account" : "Create your account today"}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <button 
                onClick={() => handleSocialLogin('apple')}
                className="w-full py-3 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-3 text-white luxury-button sidebar-glow"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
                <span className="font-medium">Continue with Apple</span>
              </button>
              
              <button 
                onClick={() => handleSocialLogin('google')}
                className="w-full py-3 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-3 text-white luxury-button sidebar-glow"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                <span className="font-medium">Continue with Google</span>
              </button>
            </div>

            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="mx-4 text-sm text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-3 px-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sidebar-glow"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 px-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sidebar-glow"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 px-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sidebar-glow"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 luxury-button sidebar-glow flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {isLogin ? "Sign In" : "Create Account"}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors glow-text"
                disabled={isLoading}
              >
                {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 sidebar-glow">
            <p className="text-sm text-gray-400 mb-2 glow-text">Demo Credentials:</p>
            <p className="text-xs text-gray-500">Email: test@test.com</p>
            <p className="text-xs text-gray-500">Password: password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 