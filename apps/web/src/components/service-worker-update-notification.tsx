'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/lib/service-worker-registration';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function ServiceWorkerUpdateNotification() {
  const { status, isOnline, applyUpdate } = useServiceWorker();

  // Show toast for update available
  useEffect(() => {
    if (status === 'update-available') {
      toast('Update available', {
        description: 'A new version is ready to install',
        action: {
          label: 'Update',
          onClick: applyUpdate,
        },
      });
    }
  }, [status, applyUpdate]);

  // Show toast for offline/online status
  useEffect(() => {
    if (!isOnline) {
      toast.warning('You\'re offline', {
        description: 'Some features may be unavailable',
      });
    } else if (isOnline && status === 'active') {
      toast.success('Back online', {
        description: 'App ready for offline use',
      });
    }
  }, [isOnline, status]);

  // Don't render anything if not supported or not active yet
  if (status === 'unsupported' || status === 'loading') {
    return null;
  }

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-4">
          <Card className="flex items-center gap-3 px-4 py-3 shadow-lg border-orange-500/50 bg-orange-500/10">
            <WifiOff className="h-5 w-5 text-orange-500" />
            <div className="text-sm">
              <p className="font-medium text-orange-700 dark:text-orange-300">You're offline</p>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                Some features may be unavailable
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Update available notification */}
      {status === 'update-available' && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <Card className="flex items-center gap-3 px-4 py-3 shadow-lg border-blue-500/50 bg-blue-500/10">
            <Download className="h-5 w-5 text-blue-500" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">Update available</p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                A new version is ready to install
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={applyUpdate}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Update
            </Button>
          </Card>
        </div>
      )}

      {/* Online indicator (only show after being offline) */}
      {isOnline && status === 'active' && (
        <div className="fixed bottom-4 left-4 z-50 animate-in fade-in duration-500">
          <Card className="flex items-center gap-3 px-4 py-3 shadow-lg border-green-500/50 bg-green-500/10 opacity-50 hover:opacity-100 transition-opacity">
            <Wifi className="h-5 w-5 text-green-500" />
            <div className="text-sm">
              <p className="font-medium text-green-700 dark:text-green-300">Online</p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                App ready for offline use
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
