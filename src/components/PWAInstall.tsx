import React, { useState } from 'react';
import { Download, Smartphone, X, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { usePWA } from '../hooks/usePWA';
import { cn } from '../lib/utils';

interface PWAInstallProps {
  className?: string;
  variant?: 'banner' | 'button' | 'card';
  onInstall?: (success: boolean) => void;
  onDismiss?: () => void;
}

const PWAInstall: React.FC<PWAInstallProps> = ({
  className,
  variant = 'banner',
  onInstall,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  const {
    canInstall,
    isOnline,
    isStandalone,
    supportsPWA,
    installPWA,
  } = usePWA();

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await installPWA();
      onInstall?.(success);
      
      if (success) {
        setDismissed(true);
      }
    } catch (error) {
      console.error('Install failed:', error);
      onInstall?.(false);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if dismissed, already installed, or not installable
  if (dismissed || !canInstall || !supportsPWA) {
    return null;
  }

  // Already running as standalone app
  if (isStandalone) {
    return null;
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        disabled={installing}
        className={cn(
          'flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0',
          className
        )}
      >
        {installing ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download size={16} />
        )}
        Install App
      </Button>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-purple-600" />
              Install AI LOVVE
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Get the full experience:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle size={12} className="text-green-500" />
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={12} className="text-green-500" />
                Home screen access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={12} className="text-green-500" />
                Push notifications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={12} className="text-green-500" />
                Faster loading
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
            >
              {installing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="ml-2">
                {installing ? 'Installing...' : 'Install Now'}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="px-3"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default banner variant - Site temasına uygun glassmorphism tasarım
  return (
    <div className={cn(
      'fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm',
      'glass-elevated rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl',
      'p-4 animate-in slide-in-from-bottom-5 duration-500',
      'bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80',
      'dark:from-gray-800/80 dark:via-gray-700/80 dark:to-gray-800/80',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">
            AI LOVE App
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-4 leading-relaxed">
        Telefonunuza kurun, offline çalışsın ve daha hızlı erişim sağlayın ✨
      </p>

      <div className="flex gap-2">
        <Button
          onClick={handleInstall}
          disabled={installing}
          size="sm"
          className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white font-medium rounded-2xl border-0 shadow-lg"
        >
          {installing ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Download size={14} className="mr-2" />
          )}
          {installing ? 'Kuruluyor...' : 'Kur'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-2xl"
        >
          Sonra
        </Button>
      </div>
    </div>
  );
};

export default PWAInstall;