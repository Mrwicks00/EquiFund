"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { useEquiFundProjects } from "@/hooks/useEquiFundProjects";
import { useEquiFundRound } from "@/hooks/useEquiFundRound";
import { formatUSDC, truncateAddress } from "@/lib/format";
import { ContributeModal } from "@/components/contribute-modal";

export default function ContributeProjects() {
  const { data: roundData, isLoading: isRoundLoading } = useEquiFundRound();
  const {
    data: projects,
    isLoading,
    isError,
  } = useEquiFundProjects(roundData?.roundId);

  const [selectedProject, setSelectedProject] = useState<
    (typeof projects)[number] | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (project: (typeof projects)[number]) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <section className="px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
              <Sparkles size={16} /> Step 2 · Choose a Project
            </p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">
              Select a public good to amplify
            </h2>
            <p className="text-muted-foreground mt-2">
              All projects are verified through the registry. Pick one to see
              live contribution and matching stats before confirming your
              transaction.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-xl border border-primary/20 px-5 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition"
          >
            Manage Projects
          </Link>
        </div>

        {isError && (
          <div className="mb-10 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
            Unable to load projects from the registry. Please try again or
            refresh the page.
          </div>
        )}

        {(isLoading || isRoundLoading) && (
          <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading active
            projects…
          </div>
        )}

        {!isLoading && projects && projects.length === 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center">
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground">
              The ProjectRegistry is empty for this round. Register a project to
              unlock contributions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {projects?.map((project) => (
            <div
              key={project.address}
              className="glass-morphism rounded-3xl border border-primary/10 p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {truncateAddress(project.address)}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-4 mb-6">
                {project.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Raised this round</p>
                  <p className="text-lg font-semibold">
                    {formatUSDC(project.totalRaised)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Matched allocation</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatUSDC(project.totalMatched)}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-between gap-4">
                <Link
                  href={`/projects/${project.address}`}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition"
                >
                  View details
                </Link>
                <button
                  type="button"
                  className="rounded-xl bg-linear-to-r from-primary to-secondary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-primary/40 transition"
                  onClick={() => openModal(project)}
                >
                  Contribute
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ContributeModal
        open={modalOpen}
        onClose={closeModal}
        project={selectedProject}
      />
    </section>
  );
}
