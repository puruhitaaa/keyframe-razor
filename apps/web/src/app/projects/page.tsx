"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { api } from "@keyframe-razor/backend/convex/_generated/api";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";
import { ProjectCreationWizard } from "@/components/project-creation-wizard";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const user = useUser();
  const projects = useQuery(api.projects.list);
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);

  const handleProjectCreated = () => {
    console.log("Project created successfully");
  };

  return (
    <>
      <Authenticated>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-muted-foreground">
                Manage your video projects
              </p>
            </div>
            <Button onClick={() => setIsProjectWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ) : projects && projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first project to get started
              </p>
              <Button onClick={() => setIsProjectWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          )}

          <ProjectCreationWizard
            open={isProjectWizardOpen}
            onOpenChange={setIsProjectWizardOpen}
            onProjectCreated={handleProjectCreated}
          />
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Sign In Required
          </h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your projects
          </p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}
