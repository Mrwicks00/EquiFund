"use client";

import ProjectsGrid from "@/components/projects-grid";
import Hero from "@/components/hero";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="projects" />
      <ProjectsGrid />
    </div>
  );
}
