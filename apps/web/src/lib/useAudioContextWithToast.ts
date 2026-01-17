import { useEffect } from "react";
import { toast } from "sonner";
import {
  AudioContextManager,
  type AudioContextEvent,
  type AudioContextManagerConfig,
} from "./audio-context-manager";

/**
 * Hook to wrap AudioContextManager with toast notifications
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const audioManager = useAudioContextWithToast();
 *
 *   const handleInitialize = async () => {
 *     await audioManager.initialize();
 *     // Toast notifications will be shown automatically for state changes
 *   };
 *
 *   return <button onClick={handleInitialize}>Initialize Audio</button>;
 * }
 * ```
 */
export function useAudioContextWithToast(config?: AudioContextManagerConfig): AudioContextManager {
  const manager = AudioContextManager.getInstance(config);

  useEffect(() => {
    const unsubscribe = manager.on((event: AudioContextEvent) => {
      switch (event.type) {
        case "initialized":
          toast.success("Audio context initialized");
          break;

        case "stateChange":
          if (event.state === "running") {
            toast.success("Audio context is running");
          } else if (event.state === "suspended") {
            toast.warning("Audio context suspended", {
              description: "Click anywhere to resume audio playback",
            });
          } else if (event.state === "closed") {
            toast.info("Audio context closed");
          }
          break;

        case "userGestureRequired":
          toast.warning("User interaction required", {
            description: "Click anywhere to enable audio playback",
          });
          break;

        case "error":
          toast.error("Audio context error", {
            description: event.error.message,
          });
          break;
      }
    });

    return unsubscribe;
  }, [manager]);

  return manager;
}
