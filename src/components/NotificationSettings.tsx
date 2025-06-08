import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Settings, MessageCircle, Package, AlertTriangle, Megaphone } from 'lucide-react';
import { 
  pushNotificationManager, 
  requestNotificationPermission, 
  disableNotifications, 
  getNotificationStatus, 
  getNotificationSubscription,
  updateNotificationPreferences,
  sendTestNotification,
  type NotificationPermission,
  type NotificationSubscription,
  type NotificationTypes
} from '../utils/push-notifications';

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);

  // Load current status on component mount
  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = () => {
    const currentPermission = getNotificationStatus();
    const currentSubscription = getNotificationSubscription();
    
    setPermission(currentPermission);
    setSubscription(currentSubscription);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await requestNotificationPermission();
      if (success) {
        loadNotificationStatus();
        console.log('✅ Notifications enabled successfully');
      } else {
        console.warn('❌ Failed to enable notifications');
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await disableNotifications();
      loadNotificationStatus();
      console.log('✅ Notifications disabled successfully');
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeToggle = (type: keyof NotificationTypes) => {
    if (!subscription) return;

    const newTypes = {
      ...subscription.types,
      [type]: !subscription.types[type]
    };

    updateNotificationPreferences(newTypes);
    setSubscription({
      ...subscription,
      types: newTypes
    });
  };

  const handleTestNotification = async () => {
    if (!permission.granted) {
      console.warn('🔔 Cannot send test notification - permission not granted');
      return;
    }

    try {
      await sendTestNotification();
      setShowTestResult(true);
      setTimeout(() => setShowTestResult(false), 3000);
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  };

  const getPermissionStatusText = () => {
    if (permission.granted) return 'Enabled';
    if (permission.denied) return 'Blocked';
    return 'Not Set';
  };

  const getPermissionStatusColor = () => {
    if (permission.granted) return 'text-green-600';
    if (permission.denied) return 'text-red-600';
    return 'text-yellow-600';
  };

  const notificationTypes = [
    {
      key: 'chat_responses' as keyof NotificationTypes,
      icon: MessageCircle,
      title: 'Chat Responses',
      description: 'Get notified when AI LOVVE responds to your messages'
    },
    {
      key: 'package_recommendations' as keyof NotificationTypes,
      icon: Package,
      title: 'Package Recommendations', 
      description: 'Receive notifications about new honeymoon packages and deals'
    },
    {
      key: 'system_updates' as keyof NotificationTypes,
      icon: AlertTriangle,
      title: 'System Updates',
      description: 'Important app updates and maintenance notifications'
    },
    {
      key: 'promotional' as keyof NotificationTypes,
      icon: Megaphone,
      title: 'Promotional Offers',
      description: 'Special offers, discounts, and marketing messages'
    }
  ];

  return (
    <div className={`notification-settings ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your notification preferences
            </p>
          </div>
        </div>

        {/* Browser Support Check */}
        {!pushNotificationManager.isNotificationSupported() && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Push notifications are not supported in this browser
              </span>
            </div>
          </div>
        )}

        {/* Permission Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {permission.granted ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Notification Status
                </div>
                <div className={`text-sm ${getPermissionStatusColor()}`}>
                  {getPermissionStatusText()}
                </div>
              </div>
            </div>

            {/* Enable/Disable Button */}
            {pushNotificationManager.isNotificationSupported() && (
              <div className="flex gap-2">
                {!permission.granted ? (
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isLoading || permission.denied}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Enabling...' : 'Enable'}
                  </button>
                ) : (
                  <button
                    onClick={handleDisableNotifications}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Disabling...' : 'Disable'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Permission Denied Help */}
          {permission.denied && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                Notifications are blocked. To enable them, click the notification icon in your browser's address bar and select "Allow".
              </p>
            </div>
          )}
        </div>

        {/* Notification Types */}
        {permission.granted && subscription && (
          <>
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Notification Types
              </h4>
              <div className="space-y-3">
                {notificationTypes.map((type) => {
                  const Icon = type.icon;
                  const isEnabled = subscription.types[type.key];
                  
                  return (
                    <div
                      key={type.key}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {type.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {type.description}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleTypeToggle(type.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isEnabled 
                            ? 'bg-blue-600' 
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Notification */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Test Notification
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Send a test notification to verify everything is working
                  </div>
                </div>
                
                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Test
                </button>
              </div>
              
              {showTestResult && (
                <div className="mt-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Test notification sent!</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* FCM Token Info (for development) */}
        {process.env.NODE_ENV === 'development' && subscription?.token && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white mb-2">
              FCM Token (Dev Only)
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all bg-white dark:bg-gray-900 p-2 rounded border">
              {subscription.token}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;