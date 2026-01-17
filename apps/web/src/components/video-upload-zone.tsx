"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, FileVideo, X, AlertCircle } from "lucide-react";

// Video MIME types that are accepted
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
] as const;

// Default max file size (100MB)
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024;

export interface VideoFile {
  file: File;
  preview: string;
  id: string;
}

interface VideoUploadZoneProps {
  /** Called when a valid video file is selected */
  onVideoSelect?: (video: VideoFile) => void;
  /** Called when files are rejected */
  onError?: (errors: string[]) => void;
  /** Maximum file size in bytes (default: 100MB) */
  maxSize?: number;
  /** Accepted video MIME types */
  acceptedTypes?: readonly string[];
  /** Whether multiple files can be uploaded */
  multiple?: boolean;
  /** Custom class name */
  className?: string;
  /** ID for the input element */
  id?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function VideoUploadZone({
  onVideoSelect,
  onError,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = ACCEPTED_VIDEO_TYPES,
  multiple = false,
  className,
  id = "video-upload",
  disabled = false,
}: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<VideoFile | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragCounter = React.useRef(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type: ${file.type}. Accepted types: ${acceptedTypes.join(", ")}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum (${formatFileSize(maxSize)})`;
    }

    return null;
  };

  const createVideoPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadeddata = () => {
        URL.revokeObjectURL(video.src);
        resolve(URL.createObjectURL(file));
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video"));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      onError?.(errors);
    }

    // Process only the first valid file (unless multiple is enabled)
    const fileToProcess = multiple ? validFiles[0] : validFiles[0];

    if (fileToProcess) {
      try {
        const preview = await createVideoPreview(fileToProcess);
        const videoFile: VideoFile = {
          file: fileToProcess,
          preview,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        setSelectedVideo(videoFile);
        onVideoSelect?.(videoFile);
      } catch (error) {
        errors.push(`Failed to process video: ${fileToProcess.name}`);
        onError?.(errors);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleRemoveVideo = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview);
    }
    setSelectedVideo(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedVideo ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          className={cn(
            "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div
              className={cn(
                "mb-4 rounded-full p-4 transition-colors",
                isDragging ? "bg-primary/10" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "size-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>

            <h3 className="mb-2 text-sm font-semibold">
              {isDragging ? "Drop your video here" : "Upload a video"}
            </h3>

            <p className="mb-4 text-xs text-muted-foreground">
              Drag and drop your video here, or click to browse
            </p>

            <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
              <span>Accepted formats: MP4, WebM, OGG, MOV, AVI, MKV</span>
              <span>Maximum size: {formatFileSize(maxSize)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-background">
              <FileVideo className="size-8 text-muted-foreground" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-sm font-medium">
                {selectedVideo.file.name}
              </p>
              <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                <span>{formatFileSize(selectedVideo.file.size)}</span>
                <span className="uppercase">{selectedVideo.file.type}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveVideo}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Remove video"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Video preview */}
          {selectedVideo.preview && (
            <div className="mt-4 overflow-hidden rounded-md bg-background">
              <video
                src={selectedVideo.preview}
                controls
                className="w-full"
                preload="metadata"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
