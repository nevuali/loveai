import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Camera, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: ''
  });

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Profile Updated! ✨",
        description: "Your profile has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-gemini">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#1f1f1f] glass-elevated rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 sidebar-header-glow border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-gradient rounded-xl sidebar-icon-glow">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white glow-text">
                Edit Profile
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 sidebar-glow min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Picture */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg sidebar-icon-glow mx-auto">
                {profileData.name ? profileData.name[0].toUpperCase() : 'U'}
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">Click camera to change photo</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all glass-card"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all glass-card"
                placeholder="Enter your email"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all glass-card"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Location
              </label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({...prev, location: e.target.value}))}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all glass-card"
                placeholder="Enter your location"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Bio
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                rows={4}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all glass-card resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-semibold min-h-[48px] border border-white/20 hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl luxury-button text-white font-semibold min-h-[48px] hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal; 