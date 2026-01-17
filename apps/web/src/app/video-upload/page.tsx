"use client";

import { useState } from "react";
import { VideoUploadZone, VideoFile } from "@/components/video-upload-zone";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VideoUploadPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video);
    setErrors([]);
    toast.success("Video uploaded successfully!", {
      description: `${video.file.name} (${(video.file.size / 1024 / 1024).toFixed(2)} MB)`,
    });
  };

  const handleError = (errorMessages: string[]) => {
    setErrors(errorMessages);
    errorMessages.forEach((error) => {
      toast.error("Upload error", {
        description: error,
      });
    });
  };

  const handleReset = () => {
    setSelectedVideo(null);
    setErrors([]);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Video Upload Zone</h1>
        <p className="text-muted-foreground">
          A drag-and-drop video upload component with client-side validation
        </p>
      </div>

      <div className="grid gap-6">
        {/* Error Display */}
        {errors.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="flex items-start gap-3 pt-4">
              <AlertCircle className="size-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-destructive">
                  Upload Errors
                </h3>
                <ul className="list-inside list-disc text-xs text-destructive/90">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>
              Drag and drop a video file or click to browse. Maximum file size: 100MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploadZone
              onVideoSelect={handleVideoSelect}
              onError={handleError}
              maxSize={100 * 1024 * 1024} // 100MB
            />
          </CardContent>
        </Card>

        {/* Selected Video Info */}
        {selectedVideo && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Video Details</CardTitle>
              <CardDescription>Information about the uploaded video</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4">
                <dl className="grid gap-2 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="font-medium text-muted-foreground">File Name:</dt>
                    <dd className="truncate">{selectedVideo.file.name}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="font-medium text-muted-foreground">File Size:</dt>
                    <dd>{(selectedVideo.file.size / 1024 / 1024).toFixed(2)} MB</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="font-medium text-muted-foreground">File Type:</dt>
                    <dd>{selectedVideo.file.type}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="font-medium text-muted-foreground">Last Modified:</dt>
                    <dd>{new Date(selectedVideo.file.lastModified).toLocaleString()}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="font-medium text-muted-foreground">File ID:</dt>
                    <dd className="font-mono text-xs">{selectedVideo.id}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Clear Selection
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Video would be processed here!");
                  }}
                >
                  Process Video
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature List */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Capabilities of the video upload component</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Drag and drop support with visual feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Click to browse file system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Client-side validation for file type (MP4, WebM, OGG, MOV, AVI, MKV)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Configurable file size limits (default: 100MB)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Video preview with playback controls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Error handling and reporting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Keyboard accessible (Enter/Space to activate)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Disabled state support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Proper memory cleanup (URL.revokeObjectURL)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
