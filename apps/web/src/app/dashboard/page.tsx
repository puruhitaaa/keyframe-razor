"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@keyframe-razor/backend/convex/_generated/api";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExportOptionsModal, type ExportOptions } from "@/components/export-options-modal";
import { ProjectCreationWizard } from "@/components/project-creation-wizard";
import { Button } from "@/components/ui/button";
import { Download, Plus, FolderOpen } from "lucide-react";

export default function Dashboard() {
  const user = useUser();
  const privateData = useQuery(api.privateData.get);
  const projects = useQuery(api.projects.list);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);

  const handleExport = (options: ExportOptions) => {
    console.log("Export options:", options);
    // Here you would implement the actual export logic
    toast.info(
      `Export started: ${options.format} | ${options.quality} | ${options.outputFormat.toUpperCase()}`,
      {
        description: "Your export is being processed...",
      }
    );
  };

  const handleProjectCreated = () => {
    // Projects query will automatically refetch
    console.log("Project created successfully");
  };

  return (
    <>
      <Authenticated>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.user?.fullName}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsProjectWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
              <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Projects Section */}
          <div className="rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Projects</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsProjectWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Button>
            </div>
            
            {projects && projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-medium mb-1">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {project.videoUrl && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        📹 Video attached
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => setIsProjectWizardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-2">Private Data</h2>
            <p className="text-muted-foreground">{privateData?.message || "No data available"}</p>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsProjectWizardOpen(true)}
              >
                <Plus className="h-6 w-6" />
                <span>New Project</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsExportModalOpen(true)}
              >
                <Download className="h-6 w-6" />
                <span>Export Media</span>
              </Button>
            </div>
          </div>

          <ExportOptionsModal
            open={isExportModalOpen}
            onOpenChange={setIsExportModalOpen}
            onExport={handleExport}
          />

          <ProjectCreationWizard
            open={isProjectWizardOpen}
            onOpenChange={setIsProjectWizardOpen}
            onProjectCreated={handleProjectCreated}
          />

          <div className="flex items-center justify-end">
            <UserButton />
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <AuthLoading>
        <div>Loading...</div>
      </AuthLoading>
    </>
  );
}
