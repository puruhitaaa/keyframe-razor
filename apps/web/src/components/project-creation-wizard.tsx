"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@keyframe-razor/backend/convex/_generated/api";
import { Upload, FileVideo, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateVideoFile, validateVideoFileQuick, type VideoValidationResult } from "@/lib/video-validation";

interface ProjectCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

export function ProjectCreationWizard({
  open,
  onOpenChange,
  onProjectCreated,
}: ProjectCreationWizardProps) {
  const createProject = useMutation(api.projects.create);
  const projects = useQuery(api.projects.list);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(null);
  const [validationResult, setValidationResult] = React.useState<VideoValidationResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous validation
    setValidationResult(null);

    // Quick validation first (format and size)
    const quickValidation = validateVideoFileQuick(file, {
      maxSize: 500 * 1024 * 1024, // 500MB
      allowedFormats: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
      ],
    });

    if (!quickValidation.isValid) {
      toast.error(quickValidation.error || "Invalid video file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Set file and preview
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // Perform detailed validation (codec, duration, dimensions)
    setIsValidating(true);
    try {
      const detailedValidation = await validateVideoFile(file, {
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedFormats: [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
        ],
      });

      setValidationResult(detailedValidation);

      if (detailedValidation.isValid) {
        const details = detailedValidation.details;
        const durationText = details.duration ? ` (${Math.round(details.duration)}s)` : '';
        const sizeText = details.sizeFormatted;
        const dimensionsText = details.dimensions ? ` - ${details.dimensions.width}x${details.dimensions.height}` : '';
        toast.success(`Video validated: ${file.name} (${sizeText})${durationText}${dimensionsText}`);
      } else {
        toast.error(detailedValidation.error || "Video validation failed");
        // Clear invalid file
        setVideoFile(null);
        setVideoPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Error validating video file");
      setValidationResult({
        isValid: false,
        error: "Validation error occurred",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    // Check if video validation passed
    if (videoFile && validationResult && !validationResult.isValid) {
      toast.error("Please fix video validation errors before creating the project");
      return;
    }

    if (videoFile && !validationResult) {
      toast.error("Please wait for video validation to complete");
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, we'll store the video URL as a placeholder
      // In a real implementation, you would upload the file to Convex storage
      const videoUrl = videoFile ? "placeholder-url" : undefined;

      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        videoUrl,
      });

      // Reset form
      setName("");
      setDescription("");
      setVideoFile(null);
      setValidationResult(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Project created successfully");
      onOpenChange(false);
      onProjectCreated?.();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URL
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setName("");
    setDescription("");
    setVideoFile(null);
    setValidationResult(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter your project details and upload a video to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Project Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description (optional)"
              />
            </div>

            {/* Video Upload */}
            <div className="grid gap-2">
              <Label htmlFor="video">Video Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video"
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
                  onChange={handleFileSelect}
                  disabled={isValidating}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isValidating}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isValidating ? "Validating..." : videoFile ? videoFile.name : "Choose Video File"}
                </Button>
              </div>

              {/* Validation Status */}
              {validationResult && videoPreview && (
                <div className={`mt-2 rounded-lg border p-3 ${validationResult.isValid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}`}>
                  <div className="flex items-start gap-2">
                    {validationResult.isValid ? (
                      <FileVideo className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1 text-sm">
                      {validationResult.isValid ? (
                        <div className="text-green-700 dark:text-green-300">
                          <p className="font-medium">Video validated successfully</p>
                          {validationResult.details && (
                            <div className="mt-1 space-y-0.5 text-xs">
                              <p>Format: {validationResult.details.format}</p>
                              <p>Size: {validationResult.details.sizeFormatted}</p>
                              {validationResult.details.duration && (
                                <p>Duration: {Math.round(validationResult.details.duration)}s</p>
                              )}
                              {validationResult.details.dimensions && (
                                <p>Resolution: {validationResult.details.dimensions.width}x{validationResult.details.dimensions.height}</p>
                              )}
                              {validationResult.details.codec && (
                                <p>Codec: {validationResult.details.codec}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-red-700 dark:text-red-300">
                          <p className="font-medium">Validation failed</p>
                          <p className="text-xs">{validationResult.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {videoPreview && validationResult?.isValid && (
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-[200px] object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting || isValidating || (videoFile && !validationResult?.isValid)}
            >
              {isSubmitting ? "Creating..." : isValidating ? "Validating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
