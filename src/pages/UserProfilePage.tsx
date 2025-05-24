import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, LogIn, Home, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
    localStorage.setItem('userEmail', 'demo@cappalove.com');
    localStorage.setItem('userName', 'Demo User');
    window.location.reload();
  };

  // Firebase auth action handler - artık sadece demo login çalışacak
  const handleAuthAction = async () => {
    // Firebase kimlik doğrulama mantığı kaldırıldı
    toast.error("Firebase kimlik doğrulama şu anda aktif değil.");
    // isLogin mantığı korunabilir ancak herhangi bir işlem yapmayacak
    // setIsLoading(false); // Yükleme durumunu sıfırlama kaldırıldı

    // Demo login (başarılı olursa ana sayfaya yönlendirir)
    if (isLogin && email === 'test@test.com' && password === 'password') {
      toast.success("Demo sign in successful!");
      // Kullanıcı kimlik doğrulama durumu localStorage'da tutuluyor (demo amaçlı)
      localStorage.setItem('userMockAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      navigate('/'); // Ana sayfaya yönlendir
    } else if (!isLogin && email === 'test@test.com' && password === 'password') {
        toast.success("Demo sign up successful!");
        localStorage.setItem('userMockAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        navigate('/'); // Ana sayfaya yönlendir
    } else {
        toast.error("Invalid credentials or user not found.");
        // setIsLoading(false); // Yükleme durumunu sıfırlama kaldırıldı
    }
  };

  // Google ile giriş butonu action handler
  const handleGoogleSignIn = async () => {
    // Firebase Google Sign-In mantığı kaldırıldı
    toast.info("Google Sign-In şu anda aktif değil.");
  };

  // Firebase social login handler - Google login
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    if (provider === 'google') {
      try {
        const googleProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          toast.success("Signed in with Google!");
          // localStorage yerine Firebase Authentication state persistent kullanacağız
          // localStorage.setItem('userMockAuthenticated', 'true');
          // localStorage.setItem('userEmail', result.user.email || '');
          // localStorage.setItem('userName', result.user.displayName || '');
          navigate('/');
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to sign in with Google.");
      } finally {
        setIsLoading(false);
      }
    } else { // Apple
      toast.error("Apple ile giriş şu anda desteklenmiyor.");
      setIsLoading(false);
    }
  };

  // Firebase sign out logic - artık sadece demo log out çalışacak
  const handleSignOut = () => {
    // Firebase sign out mantığı kaldırıldı
    toast.success("Demo signed out!");
    localStorage.removeItem('userMockAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/profile'); // Profil sayfasına yönlendir
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cappalove-background px-4 py-12">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 p-2 text-gray-500 hover:text-cappalove-darkblue transition-colors disabled:opacity-50"
          aria-label="Return to Homepage"
          disabled={isLoading}
        >
          <Home className="h-6 w-6" />
        </button>

        {/* Demo login button */}
        <div className="mb-4">
          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl bg-cappalove-blue text-white font-semibold text-base shadow hover:bg-cappalove-darkblue transition-all mb-2"
            disabled={isLoading}
          >
            Sign in with Demo Account
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            {isLogin ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-gray-500 text-base">
            {isLogin ? "Use your account" : "Join us today"}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <Button 
            variant="outline"
            onClick={() => handleSocialLogin('apple')}
            className="w-full py-5 text-base border-gray-300 rounded-xl hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm text-gray-700 hover:text-gray-900 disabled:opacity-75"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <AppleIcon />}
            <span className="font-medium">Continue with Apple</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            className="w-full py-5 text-base border-gray-300 rounded-xl hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm text-gray-700 hover:text-gray-900 disabled:opacity-75"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
            <span className="font-medium">Continue with Google</span>
          </Button>
        </div>

        <div className="flex items-center my-6">
          <Separator className="flex-grow bg-cappalove-border" />
          <span className="mx-4 text-sm text-gray-400 font-medium">or</span>
          <Separator className="flex-grow bg-cappalove-border" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleAuthAction(); }} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="py-5 px-4 text-base bg-cappalove-cream border-cappalove-border rounded-xl focus:ring-2 focus:ring-cappalove-peach focus:border-cappalove-peach transition-all disabled:opacity-75"
                required
                disabled={isLoading}
              />
            </div>
          )}
          <div className="relative">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-5 px-4 text-base bg-cappalove-cream border-cappalove-border rounded-xl focus:ring-2 focus:ring-cappalove-peach focus:border-cappalove-peach transition-all disabled:opacity-75"
              required
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="py-5 px-4 text-base bg-cappalove-cream border-cappalove-border rounded-xl focus:ring-2 focus:ring-cappalove-peach focus:border-cappalove-peach transition-all disabled:opacity-75"
              required
              disabled={isLoading}
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-sm text-cappalove-blue hover:text-cappalove-darkblue font-medium disabled:opacity-50" disabled={isLoading}>
                Forgot Password?
              </button>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-cappalove-darkblue hover:bg-cappalove-blue text-white font-medium text-base py-5 rounded-xl shadow-sm transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-75"
            disabled={isLoading}
          >
            {isLoading && !isLogin ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
            {!isLoading && <ChevronRight className="h-5 w-5 ml-1" />}
            {isLoading && isLogin && <Loader2 className="h-5 w-5 animate-spin mr-2" />} 
            {isLoading && isLogin && <span>Signing In...</span>} 
            {isLoading && !isLogin && <span>Creating Account...</span>} 
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {if (!isLoading) setIsLogin(!isLogin);}}
              className="font-semibold text-cappalove-blue hover:text-cappalove-darkblue disabled:opacity-50"
              disabled={isLoading}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 