import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isChanging, setIsChanging] = useState(false);

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.newPassword);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast({
        title: "Password Requirements",
        description: "Please ensure your password meets all requirements",
        variant: "destructive"
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match",
        variant: "destructive"
      });
      return;
    }

    setIsChanging(true);
    
    try {
      // TODO: Implement password change with Firebase Auth
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      
      toast({
        title: "Password Changed! 🔐",
        description: "Your password has been updated successfully",
      });
      onClose();
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    } finally {
      setIsChanging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f2f2f] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3f3f3f]">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-medium text-white">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3f3f3f] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Security Info */}
        <div className="p-6 border-b border-[#3f3f3f]">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium mb-1">Security Reminder</p>
              <p className="text-xs text-blue-200">
                Choose a strong password to keep your honeymoon plans secure. We recommend using a unique password you don't use elsewhere.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 pr-10 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
                placeholder="Enter your current password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 pr-10 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400">Password requirements:</p>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {Object.entries({
                    'At least 8 characters': passwordRequirements.length,
                    'One uppercase letter': passwordRequirements.uppercase,
                    'One lowercase letter': passwordRequirements.lowercase,
                    'One number': passwordRequirements.number,
                    'One special character': passwordRequirements.special
                  }).map(([requirement, met]) => (
                    <div key={requirement} className={`flex items-center gap-2 ${met ? 'text-green-400' : 'text-gray-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-400' : 'bg-gray-500'}`} />
                      {requirement}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 pr-10 border border-[#3f3f3f] focus:border-blue-500 focus:outline-none"
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
            )}
          </div>

          {/* Warning */}
          {formData.newPassword && (
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <p className="text-xs text-yellow-200">
                You'll need to sign in again after changing your password.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#3f3f3f] text-gray-300 rounded-lg hover:bg-[#4f4f4f] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChanging || !isPasswordValid || !passwordsMatch || !formData.currentPassword}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChanging ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal; 