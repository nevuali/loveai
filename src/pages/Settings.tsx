import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Bell, Shield, Globe, User, LogOut, Eye, Lock, MessageSquare, Palette, X, Loader2 } from 'lucide-react';
import { settingsService, UserSettings, defaultSettings } from '../services/settingsService';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState('general');
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Settings'leri backend'den yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        console.warn('⚠️ No user UID available for loading settings');
        return;
      }
      
      console.log('🔄 Loading settings - Debug info:', {
        userUid: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName,
        isAuthenticated: !!user
      });
      
      setLoading(true);
      try {
        const userSettings = await settingsService.getUserSettings(user.uid);
        setSettings(userSettings);
        console.log('✅ Settings loaded successfully:', userSettings);
      } catch (error) {
        console.error('❌ Failed to load settings:', error);
        console.error('❌ Load error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid]);

  const categories = [
    { id: 'general', label: 'General', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'personalization', label: 'Personalization', icon: Palette },
    { id: 'conversation', label: 'Conversation', icon: MessageSquare },
    { id: 'privacy', label: 'Privacy Controls', icon: Shield },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleSetting = async (key: keyof UserSettings) => {
    if (!user?.uid || updating) return;
    
    console.log('🔄 Toggle Setting Debug:', {
      key,
      currentValue: settings[key],
      userId: user.uid,
      userEmail: user.email,
      updating
    });
    
    setUpdating(key as string);
    try {
      const newValue = !settings[key];
      
      // Optimistically update UI
      setSettings(prev => ({
        ...prev,
        [key]: newValue
      }));
      
      console.log('🔄 Attempting to update:', { key, newValue, userId: user.uid });
      
      // Update backend
      const success = await settingsService.updateSingleSetting(user.uid, key, newValue);
      
      if (!success) {
        // Revert on failure
        console.error('❌ Backend update failed, reverting UI');
        setSettings(prev => ({
          ...prev,
          [key]: !newValue
        }));
        
        // Show error to user
        alert(`Settings update failed for ${key}. Please check console for details.`);
      } else {
        console.log('✅ Setting updated successfully:', { key, newValue });
      }
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Revert on error
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
      
      // Show detailed error to user
      alert(`Error updating ${key}: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const SimpleToggle = ({ checked, onChange, disabled = false }: { 
    checked: boolean; 
    onChange: () => void; 
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : checked ? 'bg-green-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
      {disabled && (
        <Loader2 className="absolute inset-0 w-3 h-3 animate-spin text-gray-400 m-auto" />
      )}
    </button>
  );

  const SettingItem = ({ title, description, toggle, rightElement, settingKey }: {
    title: string;
    description?: string;
    toggle?: boolean;
    rightElement?: React.ReactNode;
    settingKey?: keyof UserSettings;
  }) => (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{title}</div>
        {description && (
          <div className="text-xs text-gray-400 mt-1">{description}</div>
        )}
      </div>
      {toggle !== undefined && settingKey && (
        <SimpleToggle 
          checked={toggle} 
          onChange={() => toggleSetting(settingKey)}
          disabled={updating === settingKey}
        />
      )}
      {rightElement}
    </div>
  );

  const renderCategoryContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading settings...</span>
        </div>
      );
    }

    switch (activeCategory) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">General</h2>
              <p className="text-sm text-gray-400">Manage your account and profile settings</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {getUserInitial()}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{user?.displayName || 'User'}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <SettingItem
                title="Account"
                description="Manage your account settings"
                rightElement={<span className="text-xs text-gray-400">→</span>}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Notifications</h2>
              <p className="text-sm text-gray-400">Choose when and how you want to be notified</p>
            </div>

            <div className="space-y-1">
              <SettingItem
                title="Push notifications"
                description="Receive notifications on this device"
                toggle={settings.notifications}
                settingKey="notifications"
              />
              <SettingItem
                title="Email notifications"
                description="Receive updates via email"
                toggle={settings.emailUpdates}
                settingKey="emailUpdates"
              />
            </div>
          </div>
        );

      case 'personalization':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Personalization</h2>
              <p className="text-sm text-gray-400">Customize your AI LOVVE experience</p>
            </div>

            <div className="space-y-1">
              <SettingItem
                title="Theme"
                description={settings.theme === 'system' ? 'System' : settings.theme === 'dark' ? 'Dark' : 'Light'}
                rightElement={<span className="text-xs text-gray-400">→</span>}
              />
            </div>
          </div>
        );

      case 'conversation':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Conversation</h2>
              <p className="text-sm text-gray-400">Customize how conversations work</p>
            </div>

            <div className="space-y-1">
              <SettingItem
                title="Conversation history"
                description="Save and review your chat history"
                toggle={settings.conversationHistory}
                settingKey="conversationHistory"
              />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Privacy Controls</h2>
              <p className="text-sm text-gray-400">Manage your privacy and data settings</p>
            </div>

            <div className="space-y-1">
              <SettingItem
                title="Profile visibility"
                description="Control who can see your profile"
                toggle={settings.profileVisible}
                settingKey="profileVisible"
              />
              <SettingItem
                title="Data collection"
                description="Help improve AI LOVVE with usage data"
                toggle={settings.dataCollection}
                settingKey="dataCollection"
              />
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Language</h2>
              <p className="text-sm text-gray-400">Set your preferred language</p>
            </div>

            <div className="space-y-1">
              <SettingItem
                title="Language"
                description={settings.language}
                rightElement={<span className="text-xs text-gray-400">→</span>}
              />
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-1">Security</h2>
              <p className="text-sm text-gray-400">Manage your account security</p>
            </div>

            <div className="space-y-1">
              <SettingItem
                title="Change password"
                description="Update your account password"
                rightElement={<span className="text-xs text-gray-400">→</span>}
              />
              <div className="border-t border-gray-700 pt-3 mt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Log out</span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    // Modal Background Overlay
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-[#1a1a1a] text-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] max-h-[600px] flex overflow-hidden">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-gray-700 bg-[#1a1a1a] rounded-t-xl">
          <h1 className="text-lg font-medium">Settings</h1>
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="w-64 border-r border-gray-700 bg-[#1a1a1a] pt-16 pb-6 flex-shrink-0">
          <div className="px-3">
            <nav className="space-y-1">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-16 pb-6 overflow-y-auto">
          <div className="max-w-xl mx-auto px-6">
            {renderCategoryContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 