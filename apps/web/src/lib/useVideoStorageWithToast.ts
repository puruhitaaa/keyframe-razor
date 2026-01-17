import { useEffect } from "react";
import { toast } from "sonner";
import { VideoStorage, type VideoStorageEvent, type VideoStorageConfig } from "./video-storage";

/**
 * Hook to wrap VideoStorage with toast notifications
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const storage = useVideoStorageWithToast();
 *
 *   const handleStore = async (file: File) => {
 *     await storage.storeVideo(file);
 *     // Toast notifications will be shown automatically
 *   };
 *
 *   return <input type="file" onChange={(e) => e.target.files?.[0] && handleStore(e.target.files[0])} />;
 * }
 * ```
 */
export function useVideoStorageWithToast(config?: VideoStorageConfig): VideoStorage {
  const storage = new VideoStorage(config);

  useEffect(() => {
    const unsubscribe = storage.on((event: VideoStorageEvent) => {
      switch (event.type) {
        case "stateChange":
          // You could show loading states here if needed
          break;

        case "progress":
          if (event.data.progress % 25 === 0) {
            // Show progress at 25%, 50%, 75%, 100%
            toast.info(`Storing video: ${event.data.progress}%`, {
              id: `video-progress-${event.data.videoId}`,
            });
          }
          break;

        case "videoStored":
          toast.success("Video stored successfully", {
            description: event.video.name,
          });
          break;

        case "videoDeleted":
          toast.success("Video deleted successfully", {
            description: event.videoId === "all" ? "All videos deleted" : `Video ${event.videoId} deleted`,
          });
          break;

        case "error":
          toast.error("Video storage error", {
            description: event.error.message,
          });
          break;
      }
    });

    return unsubscribe;
  }, [storage]);

  return storage;
}
