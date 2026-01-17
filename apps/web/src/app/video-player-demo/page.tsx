import { VideoPlayer } from "@/components/video-player"

export default function VideoPlayerDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Player Component</h1>
          <p className="text-muted-foreground">
            A custom video player with play/pause, seek, volume controls, and fullscreen functionality.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Demo Video</h2>
          <div className="aspect-video">
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Play/Pause with center overlay button</li>
            <li>Seek through the video with progress bar</li>
            <li>Volume control with mute toggle</li>
            <li>Fullscreen mode</li>
            <li>Auto-hiding controls when playing</li>
            <li>Time display (current / total)</li>
            <li>Keyboard accessibility</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Usage</h2>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              <code>{`import { VideoPlayer } from "@/components/video-player"

<VideoPlayer
  src="/path/to/video.mp4"
  poster="/path/to/poster.jpg"
  className="aspect-video"
/>`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
