"use client";

import Link from "next/link";

import { useEquiFundProjects } from "@/hooks/useEquiFundProjects";
import { useEquiFundRound } from "@/hooks/useEquiFundRound";
import { formatUSDC, truncateAddress } from "@/lib/format";

export default function ProjectsGrid() {
  const { data: roundData } = useEquiFundRound();
  const {
    data: projects,
    isLoading,
    isError,
  } = useEquiFundProjects(roundData?.roundId);

  const totalRoundContributions = roundData?.totalContributions ?? 0n;

  return (
    <section
      id="projects"
      className="py-20 px-4 bg-linear-to-b from-card/30 to-background"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Featured Projects
            </h2>
            <p className="text-muted-foreground text-lg">
              Support verified public goods making a difference across the
              ecosystem.
            </p>
          </div>
          <Link
            href="/contribute"
            className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-primary/40 transition"
          >
            Launch Contribute Flow
          </Link>
        </div>

        {isError && (
          <div className="mb-10 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            Unable to load projects from the registry. Please verify your
            network connection or try again later.
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="glass-morphism rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-linear-to-br from-primary/10 to-secondary/10" />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 rounded bg-primary/10" />
                  <div className="h-4 w-full rounded bg-primary/5" />
                  <div className="h-4 w-2/3 rounded bg-primary/5" />
                  <div className="h-10 w-full rounded bg-primary/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && projects && projects.length === 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center text-muted-foreground">
            No active projects are registered for the current round yet. Check
            back soon or suggest a public good to add.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects?.map((project, idx) => {
            const progress = (() => {
              if (totalRoundContributions === 0n || project.totalRaised === 0n)
                return 0;
              const ratio = Number(
                (project.totalRaised * 100n) / totalRoundContributions
              );
              return Math.min(100, Math.max(0, Math.round(ratio)));
            })();

            const registeredDate = (() => {
              const timestamp = Number(project.registeredAt) * 1000;
              if (!Number.isFinite(timestamp) || timestamp === 0)
                return "Recently added";
              return new Date(timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            })();

            return (
              <div
                key={project.address}
                className="glass-morphism rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="h-40 bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden relative">
                  <div className="size-24 rounded-full bg-background/60 backdrop-blur flex items-center justify-center text-lg font-semibold">
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Round Share</span>
                      <span className="text-primary font-semibold">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary to-secondary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Raised</p>
                      <p className="font-semibold">
                        {formatUSDC(project.totalRaised)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Matched</p>
                      <p className="font-semibold text-accent">
                        {formatUSDC(project.totalMatched)}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {truncateAddress(project.address)} • Registered{" "}
                    {registeredDate}
                  </div>

                  <Link
                    href="/contribute"
                    className="w-full px-4 py-3 rounded-lg bg-linear-to-r from-primary to-secondary text-primary-foreground font-semibold hover:shadow-lg glow-indigo transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    💰 Contribute
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
