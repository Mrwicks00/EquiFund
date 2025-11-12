"use client";

import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { isAddress } from "viem";

import Hero from "@/components/hero";
import { useEquiFundRound } from "@/hooks/useEquiFundRound";
import { useEquiFundProject } from "@/hooks/useEquiFundProject";
import { formatNumber, formatUSDC, truncateAddress } from "@/lib/format";
import { ContributeModal } from "@/components/contribute-modal";

export default function ProjectDetailPage() {
  const params = useParams<{ address: string }>();
  const addressParam = params?.address;

  const projectAddress = useMemo(() => {
    if (!addressParam) return undefined;
    const normalized = addressParam.startsWith("0x") ? addressParam : `0x${addressParam}`;
    return isAddress(normalized) ? (normalized as `0x${string}`) : undefined;
  }, [addressParam]);

  const { data: roundData } = useEquiFundRound();
  const { data: project, isLoading, isError } = useEquiFundProject(projectAddress, roundData?.roundId);

  const [modalOpen, setModalOpen] = useState(false);

  if (!projectAddress) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="projects" />

      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading project details…
            </div>
          ) : isError || !project ? (
            <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-destructive">
              Unable to load this project. It may not exist or you might be on the wrong network.
            </div>
          ) : (
            <article className="glass-morphism rounded-3xl border border-primary/20 p-10 shadow-xl">
              <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
                    <Sparkles size={16} /> Verified Project
                  </p>
                  <h1 className="text-4xl font-bold mt-2">{project.name}</h1>
                  <p className="text-xs text-muted-foreground font-mono">{truncateAddress(project.address)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-linear-to-r from-primary to-secondary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-primary/40 transition"
                  onClick={() => setModalOpen(true)}
                >
                  Contribute
                </button>
              </header>

              <section className="mt-8 space-y-6">
                <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">{project.description}</p>

                <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Raised this round</p>
                    <p className="text-xl font-semibold">{formatUSDC(project.totalRaised)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Matching allocated</p>
                    <p className="text-xl font-semibold text-primary">{formatUSDC(project.totalMatched)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Registered</p>
                    <p className="text-xl font-semibold">
                      {new Date(Number(project.registeredAt) * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="text-xl font-semibold">{project.isActive ? "Active" : "Inactive"}</p>
                  </div>
                </div>
              </section>

              {project.metadataURI && (
                <section className="mt-8">
                  <p className="text-sm font-semibold text-muted-foreground">Metadata</p>
                  <a
                    href={project.metadataURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex text-sm text-primary hover:underline"
                  >
                    {project.metadataURI}
                  </a>
                </section>
              )}

              {roundData && (
                <section className="mt-10 grid gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-6 text-sm text-muted-foreground md:grid-cols-2">
                  <div>
                    <p>Current round</p>
                    <p className="text-lg font-semibold text-foreground">Round {formatNumber(Number(roundData.roundId))}</p>
                  </div>
                  <div>
                    <p>Round ends</p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(Number(roundData.endTime) * 1000).toLocaleString()}
                    </p>
                  </div>
                </section>
              )}
            </article>
          )}
        </div>
      </section>

      <ContributeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={project ? { ...project } : null}
      />
    </div>
  );
}
