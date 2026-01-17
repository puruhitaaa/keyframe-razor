'use client';

import { useEffect, useState, useCallback } from 'react';

type ServiceWorkerStatus = 'unsupported' | 'loading' | 'active' | 'update-available' | 'offline';

interface ServiceWorkerState {
  status: ServiceWorkerStatus;
  isOnline: boolean;
  updateReady: boolean;
}

const isServiceWorkerSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    status: isServiceWorkerSupported ? 'loading' : 'unsupported',
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    updateReady: false,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!isServiceWorkerSupported) {
      setState((prev) => ({ ...prev, status: 'unsupported' }));
      return;
    }

    // Listen for online/offline events
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    registerServiceWorker();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!isServiceWorkerSupported) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'all',
      });

      setRegistration(reg);

      // Check if there's an update waiting
      if (reg.waiting) {
        setState((prev) => ({ ...prev, status: 'update-available', updateReady: true }));
      } else if (reg.active) {
        setState((prev) => ({ ...prev, status: 'active' }));
      }

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && reg.waiting) {
            setState((prev) => ({ ...prev, status: 'update-available', updateReady: true }));
          } else if (newWorker.state === 'activated') {
            setState((prev) => ({ ...prev, status: 'active', updateReady: false }));
          }
        });
      });

      // Periodically check for updates (every hour)
      const updateInterval = setInterval(() => {
        reg.update();
      }, 60 * 60 * 1000);

      return () => clearInterval(updateInterval);
    } catch (error) {
      console.error('Service worker registration failed:', error);
      setState((prev) => ({ ...prev, status: 'unsupported' }));
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      // Send message to waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page once the new service worker activates
      registration.waiting.addEventListener('statechange', (e) => {
        const worker = e.target as ServiceWorker;
        if (worker.state === 'activated') {
          window.location.reload();
        }
      });
    }
  }, [registration]);

  const checkForUpdates = useCallback(async () => {
    if (registration) {
      await registration.update();
    }
  }, [registration]);

  return {
    ...state,
    applyUpdate,
    checkForUpdates,
  };
}
