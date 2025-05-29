import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Settings, Bell, Shield, Globe, User, LogOut, Eye, EyeOff, Lock, Crown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: true,
    language: 'English',
    profileVisible: true,
    dataCollection: true
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "See you again soon!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not sign out",
        variant: "destructive"
      });
    }
  };

  const toggleSetting = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
    
    toast({
      title: "Setting updated",
      description: `${setting} has been ${settings[setting as keyof typeof settings] ? 'disabled' : 'enabled'}`,
      duration: 2000
    });
  };

  const SettingToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <div className="h-screen bg-[#1a1a1a] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-medium">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Profile Section */}
          <div className="bg-[#2d2e30] rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-base sm:text-lg font-semibold">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-sm sm:text-base truncate">{user?.displayName || 'Beloved User'}</h2>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* All Settings in one card */}
          <div className="bg-[#2d2e30] rounded-xl p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Notifications */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Bell className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Notifications</div>
                    <div className="text-xs text-gray-400 hidden sm:block">Get notified about updates</div>
                  </div>
                </div>
                <SettingToggle 
                  checked={settings.notifications} 
                  onChange={() => toggleSetting('notifications')} 
                />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Language</div>
                    <div className="text-xs text-gray-400">{settings.language}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>

              {/* Profile visibility */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Profile visibility</div>
                    <div className="text-xs text-gray-400 hidden sm:block">Control who can see your profile</div>
                  </div>
                </div>
                <SettingToggle 
                  checked={settings.profileVisible} 
                  onChange={() => toggleSetting('profileVisible')} 
                />
              </div>

              {/* Data collection */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Data collection</div>
                    <div className="text-xs text-gray-400 hidden sm:block">Help improve AI LOVVE</div>
                  </div>
                </div>
                <SettingToggle 
                  checked={settings.dataCollection} 
                  onChange={() => toggleSetting('dataCollection')} 
                />
              </div>

              {/* Change password */}
              <button className="flex items-center justify-between w-full p-2 hover:bg-gray-700 rounded-lg transition-colors gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-medium text-sm sm:text-base">Change password</div>
                    <div className="text-xs text-gray-400 hidden sm:block">Update your account security</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              {/* Premium */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">AI LOVVE Pro</div>
                    <div className="text-xs text-gray-400 hidden sm:block">Unlimited romantic planning</div>
                  </div>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full flex-shrink-0">
                  Active
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-between w-full p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400 gap-3"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-medium text-sm sm:text-base">Sign out</div>
                    <div className="text-xs text-gray-400 hidden sm:block">Sign out of your account</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 