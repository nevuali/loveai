import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, AlertTriangle, Info, Heart, Download, 
  Mail, Shield, Sparkles, ChevronRight, Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  type: 'pwa_install' | 'email_verification' | 'personality_test' | 'feedback' | 'update' | 'security' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'pwa-install',
      type: 'pwa_install',
      title: 'AI LOVVE Uygulamasını Yükle',
      message: 'Telefonunuza kurun, offline çalışsın ve daha hızlı erişim sağlayın',
      timestamp: new Date(),
      read: false,
      actionLabel: 'Yükle',
      onAction: () => console.log('PWA Install'),
      dismissible: true,
      priority: 'medium'
    },
    {
      id: 'email-verify',
      type: 'email_verification',
      title: 'E-posta Adresinizi Doğrulayın',
      message: 'Hesabınızın güvenliği için e-posta doğrulaması gerekli',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      read: false,
      actionLabel: 'Doğrula',
      onAction: () => console.log('Email verification'),
      dismissible: true,
      priority: 'high'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'pwa_install':
        return Download;
      case 'email_verification':
        return Mail;
      case 'personality_test':
        return Heart;
      case 'feedback':
        return Sparkles;
      case 'security':
        return Shield;
      case 'update':
        return Info;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'pwa_install':
        return 'from-[#d4af37] to-[#b8860b]';
      case 'email_verification':
        return 'from-orange-500 to-orange-600';
      case 'personality_test':
        return 'from-pink-500 to-pink-600';
      case 'feedback':
        return 'from-purple-500 to-purple-600';
      case 'security':
        return 'from-red-500 to-red-600';
      case 'update':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/30 bg-red-500/5';
      case 'medium':
        return 'border-[#d4af37]/30 bg-[#d4af37]/5';
      case 'low':
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}dk`;
    if (hours < 24) return `${hours}sa`;
    return `${days}g`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    notification.onAction?.();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-[#d4af37]/10 transition-all duration-200"
      >
        <Bell className="w-5 h-5 text-primary" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.div>
        )}

        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full bg-[#d4af37]/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-12 right-0 z-50 w-80 sm:w-96"
            >
              <Card className="glass-card border-0 shadow-2xl backdrop-blur-xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#d4af37]/5 to-[#b8860b]/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#d4af37]" />
                      <h3 className="font-semibold text-primary">Bildirimler</h3>
                      {unreadCount > 0 && (
                        <Badge variant="outline" className="border-[#d4af37] text-[#d4af37]">
                          {unreadCount} yeni
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Button
                          onClick={markAllAsRead}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-secondary hover:text-primary"
                        >
                          Tümü okundu
                        </Button>
                      )}
                      <Button
                        onClick={() => setIsOpen(false)}
                        variant="ghost"
                        size="sm"
                        className="p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notifications List */}
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-secondary">Henüz bildirim yok</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => {
                        const IconComponent = getNotificationIcon(notification.type);
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "p-4 border-l-4 transition-all duration-200 hover:bg-white/5",
                              getPriorityColor(notification.priority),
                              !notification.read && "bg-[#d4af37]/5"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-r",
                                getNotificationColor(notification.type)
                              )}>
                                <IconComponent className="w-4 h-4 text-white" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={cn(
                                    "font-medium text-sm",
                                    notification.read ? "text-secondary" : "text-primary"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                                  )}
                                </div>
                                
                                <p className="text-xs text-secondary leading-relaxed mb-2">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-xs text-tertiary">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(notification.timestamp)}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {notification.actionLabel && (
                                      <Button
                                        onClick={() => handleNotificationAction(notification)}
                                        size="sm"
                                        className="h-6 px-2 text-xs bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#d4af37]"
                                      >
                                        {notification.actionLabel}
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    )}

                                    {notification.dismissible && (
                                      <Button
                                        onClick={() => dismissNotification(notification.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-tertiary hover:text-secondary"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 bg-gradient-to-r from-[#d4af37]/5 to-[#b8860b]/5">
                  <p className="text-xs text-center text-tertiary">
                    Bildirimler 30 gün sonra otomatik silinir
                  </p>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Notification Hook for easy usage
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove low priority notifications after 10 seconds
    if (notification.priority === 'low') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 10000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    unreadCount: notifications.filter(n => !n.read).length
  };
};

export default NotificationCenter;