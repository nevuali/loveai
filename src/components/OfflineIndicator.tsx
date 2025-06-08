import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { getOfflineStatus, forceSyncNow, type OfflineStatus } from '../utils/offline-manager';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    lastOnline: Date.now(),
    syncInProgress: false,
    pendingSyncCount: 0,
    cacheSize: 0
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = getOfflineStatus();
      setStatus(currentStatus);
    };

    // Initial update
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!status.isOnline || syncing) return;

    setSyncing(true);
    try {
      await forceSyncNow();
      // Update status after sync
      setTimeout(() => {
        setStatus(getOfflineStatus());
        setSyncing(false);
      }, 1000);
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncing(false);
    }
  };

  const formatLastOnline = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return `${Math.floor(diff / 86400000)}d ago`;
    }
  };

  const formatCacheSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getStatusIcon = () => {
    if (syncing || status.syncInProgress) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (!status.isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    
    if (status.pendingSyncCount > 0) {
      return <RefreshCw className="w-4 h-4" />;
    }
    
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-500';
    if (status.pendingSyncCount > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (syncing || status.syncInProgress) return 'Syncing...';
    if (status.pendingSyncCount > 0) return `${status.pendingSyncCount} pending`;
    return 'Online';
  };

  const getBackgroundColor = () => {
    if (!status.isOnline) return 'bg-red-50 dark:bg-red-900/20';
    if (status.pendingSyncCount > 0) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-green-50 dark:bg-green-900/20';
  };

  const getBorderColor = () => {
    if (!status.isOnline) return 'border-red-200 dark:border-red-800';
    if (status.pendingSyncCount > 0) return 'border-yellow-200 dark:border-yellow-800';
    return 'border-green-200 dark:border-green-800';
  };

  if (showDetails) {
    return (
      <div className={`offline-indicator-detailed ${className}`}>
        <div className={`p-4 rounded-lg border ${getBackgroundColor()} ${getBorderColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <div>
                <div className={`font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </div>
                {!status.isOnline && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Last online: {formatLastOnline(status.lastOnline)}
                  </div>
                )}
              </div>
            </div>
            
            {status.isOnline && status.pendingSyncCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={syncing || status.syncInProgress}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
          
          {/* Additional Details */}
          {(status.pendingSyncCount > 0 || status.cacheSize > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {status.pendingSyncCount > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Pending sync:</span>
                    <span className="ml-1 font-medium">{status.pendingSyncCount} items</span>
                  </div>
                )}
                {status.cacheSize > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Cache size:</span>
                    <span className="ml-1 font-medium">{formatCacheSize(status.cacheSize)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Offline Mode Notice */}
          {!status.isOnline && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Limited functionality</div>
                  <div>Some features may not be available while offline. Your data will sync when connection is restored.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact indicator
  return (
    <div 
      className={`offline-indicator-compact ${className} relative`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={status.isOnline && status.pendingSyncCount > 0 ? handleManualSync : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
          status.isOnline && status.pendingSyncCount > 0 
            ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' 
            : 'cursor-default'
        } ${getBackgroundColor()} ${getBorderColor()}`}
        disabled={syncing || status.syncInProgress}
      >
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
            <div className="font-medium">
              {status.isOnline ? 'Connected' : 'Offline Mode'}
            </div>
            {!status.isOnline && (
              <div>Last online: {formatLastOnline(status.lastOnline)}</div>
            )}
            {status.pendingSyncCount > 0 && (
              <div>{status.pendingSyncCount} items waiting to sync</div>
            )}
            {status.cacheSize > 0 && (
              <div>Cache: {formatCacheSize(status.cacheSize)}</div>
            )}
            {status.isOnline && status.pendingSyncCount > 0 && (
              <div className="mt-1 text-blue-300">Click to sync now</div>
            )}
            
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;