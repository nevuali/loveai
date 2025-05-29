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
      className={`settings-toggle relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-out ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : checked ? 'bg-blue-600 shadow-lg shadow-blue-600/25' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-out shadow-lg ${
          checked ? 'translate-x-4 scale-110' : 'translate-x-0.5 scale-100'
        }`}
      />
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="settings-loading-spinner w-3 h-3 text-gray-400" />
        </div>
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
    <div className="settings-item group flex items-center justify-between py-4 px-3 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
      <div className="flex-1">
        <div className="text-sm font-medium text-white group-hover:text-blue-100 transition-colors duration-300">{title}</div>
        {description && (
          <div className="text-xs text-gray-400 mt-2 group-hover:text-gray-300 transition-colors duration-300">{description}</div>
        )}
      </div>
      <div className="flex items-center space-x-3">
        {toggle !== undefined && settingKey && (
          <SimpleToggle 
            checked={toggle} 
            onChange={() => toggleSetting(settingKey)}
            disabled={updating === settingKey}
          />
        )}
        {rightElement && (
          <div className="group-hover:translate-x-1 transition-transform duration-300">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );

  const renderCategoryContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-40 space-y-4">
          <div className="relative">
            <Loader2 className="settings-loading-spinner w-8 h-8 text-blue-400 animate-spin" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-blue-400/20 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <span className="text-gray-300 text-sm font-medium">Loading settings...</span>
            <div className="text-xs text-gray-500 mt-1">Please wait a moment</div>
          </div>
        </div>
      );
    }

    switch (activeCategory) {
      case 'general':
        return (
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">General</h2>
              <p className="text-sm text-gray-400">Manage your account and profile settings</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {getUserInitial()}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{user?.displayName || 'User'}</div>
                  <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8">
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
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Notifications</h2>
              <p className="text-sm text-gray-400">Choose when and how you want to be notified</p>
            </div>
            <div className="settings-divider"></div>
            <div className="space-y-3">
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
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Personalization</h2>
              <p className="text-sm text-gray-400">Customize your AI LOVVE experience</p>
            </div>
            <div className="settings-divider"></div>
            <div className="space-y-3">
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
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Conversation</h2>
              <p className="text-sm text-gray-400">Customize how conversations work</p>
            </div>
            <div className="settings-divider"></div>
            <div className="space-y-3">
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
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Privacy Controls</h2>
              <p className="text-sm text-gray-400">Manage your privacy and data settings</p>
            </div>
            <div className="settings-divider"></div>
            <div className="space-y-3">
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
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Language</h2>
              <p className="text-sm text-gray-400">Set your preferred language</p>
            </div>
            <div className="settings-divider"></div>
            <div className="space-y-3">
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
          <div className="settings-content-section space-y-10">
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Security</h2>
              <p className="text-sm text-gray-400">Manage your account security</p>
            </div>
            <div className="settings-divider"></div>
            <div className="space-y-3">
              <SettingItem
                title="Change password"
                description="Update your account password"
                rightElement={<span className="text-xs text-gray-400">→</span>}
              />
              <div className="border-t border-gray-700 pt-6 mt-10">
                <button
                  onClick={handleLogout}
                  className="settings-focusable flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
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
    <div className="settings-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="settings-modal-container bg-[#1a1a1a] text-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] max-h-[600px] flex flex-col md:flex-row overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700 bg-[#1a1a1a] rounded-t-xl h-16 md:h-20 flex-shrink-0">
          <h1 className="settings-active-text text-lg font-medium">Settings</h1>
          <button
            onClick={() => navigate('/')}
            className="settings-close-button settings-focusable p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-64 border-r-0 md:border-r border-b md:border-b-0 border-gray-700 bg-[#1a1a1a] p-4 md:pt-6 md:pb-8 flex-shrink-0">
          <nav className="grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`settings-sidebar-item settings-focusable w-full flex flex-col md:flex-row items-center gap-2 md:gap-3 px-3 md:px-4 py-3 text-xs md:text-sm rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? 'bg-gray-800 text-white active settings-active-text'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="settings-category-icon w-4 h-4 md:w-4 md:h-4" />
                  <span className="text-center md:text-left leading-tight">{category.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-0">
          <div className="max-w-xl mx-auto">
            {renderCategoryContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 