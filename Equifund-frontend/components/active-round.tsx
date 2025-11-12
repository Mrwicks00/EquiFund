"use client";

import { Clock, Zap, Users, Target, Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useEquiFundRound } from "@/hooks/useEquiFundRound";
import { formatNumber, formatUSDC } from "@/lib/format";

function formatDuration(milliseconds: number) {
  if (milliseconds <= 0) {
    return "Round ended";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

export default function ActiveRound() {
  const { data, isLoading, isError } = useEquiFundRound();
  const [timeLeft, setTimeLeft] = useState("Calculating…");

  const roundEnd = useMemo(() => {
    if (!data) return null;
    const endSeconds = Number(data.endTime);
    if (!Number.isFinite(endSeconds) || endSeconds === 0) return null;
    return endSeconds * 1000;
  }, [data]);

  useEffect(() => {
    if (!roundEnd) {
      setTimeLeft("No active round");
      return;
    }

    const tick = () => {
      const now = Date.now();
      setTimeLeft(formatDuration(roundEnd - now));
    };

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [roundEnd]);

  if (isError) {
    return (
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-destructive">
            Unable to load the current round. Please check your network
            connection or try again later.
          </div>
        </div>
      </section>
    );
  }

  const roundNumber = data?.roundId ? Number(data.roundId) : 0;
  const matchingPool = data?.matchingPool ?? 0n;
  const matchingPoolBalance = data?.matchingPoolBalance ?? 0n;
  const totalContributions = data?.totalContributions ?? 0n;
  const totalContributors = data?.totalContributors ?? 0n;
  const projectCount = data?.projects.length ?? 0;

  const averageMatch = useMemo(() => {
    if (!data || data.totalContributions === 0n) return "—";
    const ratio = Number(data.matchingPool) / Number(data.totalContributions);
    if (!Number.isFinite(ratio)) return "—";
    return `${ratio.toFixed(1)}x`;
  }, [data]);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="gradient-border rounded-2xl p-1 mb-20">
          <div className="glass-morphism rounded-2xl p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase mb-4 flex items-center gap-2">
                  <Clock size={16} />
                  {roundNumber > 0 ? `Round ${roundNumber}` : "No Active Round"}
                </h3>
                <div className="mb-8">
                  <p className="text-muted-foreground mb-2">Time Remaining</p>
                  <div className="text-5xl font-bold font-mono gradient-text">
                    {isLoading ? "—" : timeLeft}
                  </div>
                </div>

                <div className="mb-8 space-y-2">
                  <div>
                    <p className="text-muted-foreground mb-1">Matching Pool</p>
                    <div className="text-4xl font-bold">
                      {isLoading ? "—" : formatUSDC(matchingPool)}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Pool Balance</p>
                    <div className="text-xl font-semibold text-primary">
                      {isLoading ? "—" : formatUSDC(matchingPoolBalance)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={20} className="text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Contributors
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {isLoading ? "—" : formatNumber(totalContributors)}
                  </div>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={20} className="text-secondary" />
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {isLoading ? "—" : formatNumber(projectCount)}
                  </div>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={20} className="text-accent" />
                    <p className="text-sm text-muted-foreground">Raised</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {isLoading ? "—" : formatUSDC(totalContributions)}
                  </div>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge size={20} className="text-accent" />
                    <p className="text-sm text-muted-foreground">Avg Match</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {isLoading ? "—" : averageMatch}
                  </div>
                </div>
              </div>
            </div>

            {roundNumber === 0 && !isLoading && (
              <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6 text-sm text-muted-foreground">
                No active funding round detected. New rounds will appear here
                automatically once they are created on-chain.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
