"use client";

import Hero from "@/components/hero";
import Statistics from "@/components/statistics";
import QFExplainer from "@/components/qf-explainer";

export default function StatsPage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="stats" />
      <Statistics />
      <QFExplainer />
    </div>
  );
}
