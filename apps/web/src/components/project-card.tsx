"use client";

import * as React from "react";
import { api } from "@keyframe-razor/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolderOpen, MoreVertical, Trash2, Copy, Edit2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectCardProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    videoUrl?: string;
    storageId?: string;
    createdAt: number;
    updatedAt: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const deleteProject = useMutation(api.projects.remove);
  const duplicateProject = useMutation(api.projects.duplicate);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject({ id: project._id as any });
      setShowDeleteDialog(false);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicateProject({ id: project._id as any });
      toast.success("Project duplicated successfully");
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      toast.error("Failed to duplicate project. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleEdit = () => {
    router.push(`/projects/${project._id}` as any);
  };

  const timeAgo = formatDistanceToNow(new Date(project.updatedAt), {
    addSuffix: true,
  });

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col focus-within:ring-2 focus-within:ring-ring"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleEdit();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Project: ${project.name}. Last edited ${timeAgo}.`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {project.videoUrl ? (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <Play className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate" id={`project-title-${project._id}`}>
                  {project.name}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Last edited {timeAgo}
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Options for ${project.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    {isDuplicating ? "Duplicating..." : "Duplicate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </div>
        </CardHeader>

        {project.description && (
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground line-clamp-3" id={`project-desc-${project._id}`}>
              {project.description}
            </p>
          </CardContent>
        )}

        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {project.videoUrl && (
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3" aria-hidden="true" />
                Video
              </span>
            )}
            <span>Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent
          role="alertdialog"
          aria-describedby="delete-description"
          aria-labelledby="delete-title"
        >
          <AlertDialogHeader>
            <AlertDialogTitle id="delete-title">Delete Project</AlertDialogTitle>
            <AlertDialogDescription id="delete-description">
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
