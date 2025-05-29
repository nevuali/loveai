import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface GoogleAccountSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoogleAccountSelector: React.FC<GoogleAccountSelectorProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  // Mock accounts - will come from Google in real app
  const accounts = [
    {
      id: '1',
      name: 'Ali Mert Turgut',
      email: 'alimerturgut14@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      isActive: true
    }
  ];

  const handleAccountSelect = async (account: any) => {
    setIsLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        toast.success(`Welcome back ${account.name}! 💕`);
        onSuccess();
        onClose();
      } else {
        toast.error('Sign in failed');
      }
    } catch (error: any) {
      toast.error('Google sign-in failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    setIsLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        toast.success('Account added successfully! 💕');
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to add account');
      }
    } catch (error: any) {
      toast.error('Google sign-in failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md mx-auto"
      >
        {/* Decorative glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-3xl blur-xl transform scale-110" />
        
        {/* Main modal */}
        <div className="relative bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full translate-y-12 -translate-x-12" />

          {/* Header */}
          <div className="relative p-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="flex items-center gap-3">
                {/* Google G logo with AI LOVVE twist */}
                <div className="relative">
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0] 
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Heart className="w-6 h-6 text-white" fill="currentColor" />
                  </motion.div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-2 h-2 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-normal text-white mb-2"
            >
              Welcome to your love story
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-sm"
            >
              Sign in to continue your romantic journey
            </motion.p>
          </div>

          {/* Account List */}
          <div className="relative px-8 pb-8">
            <div className="space-y-1">
              {accounts.map((account, index) => (
                <motion.button
                  key={account.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ 
                    backgroundColor: 'rgba(55, 65, 81, 0.8)',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAccountSelect(account)}
                  disabled={isLoading}
                  className="w-full p-4 rounded-xl transition-all duration-200 flex items-center gap-4 text-left hover:bg-gray-700/50 border border-transparent hover:border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-600/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  
                  <div className="relative flex items-center gap-4 w-full">
                    {/* Beautiful gradient avatar with first name initial */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                        {account.name.split(' ')[0][0]}
                      </div>
                      {account.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    
                    {/* Account info with romantic message */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">
                          Hi! {account.name.split(' ')[0]}
                        </h3>
                        <Heart className="w-3 h-3 text-pink-400" fill="currentColor" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        Your perfect honeymoon, made effortless
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </div>
                </motion.button>
              ))}

              {/* Add Account Button */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ 
                  backgroundColor: 'rgba(55, 65, 81, 0.8)',
                  scale: 1.02
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddAccount}
                disabled={isLoading}
                className="w-full p-4 rounded-xl transition-all duration-200 flex items-center gap-4 text-left hover:bg-gray-700/50 border border-transparent hover:border-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mt-2"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-600/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                
                <div className="relative flex items-center gap-4 w-full">
                  {/* Add icon */}
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-300 font-medium">
                        Use another account
                      </h3>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Add Google account
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-gray-500 transition-colors" />
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-700/60">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>AI-powered honeymoon experience</span>
                <Heart className="w-3 h-3 text-purple-400" fill="currentColor" />
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                <button className="hover:text-gray-300 transition-colors">
                  Help
                </button>
                <button className="hover:text-gray-300 transition-colors">
                  Privacy
                </button>
                <button className="hover:text-gray-300 transition-colors">
                  Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 