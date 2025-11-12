"use client";

import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import ActiveRound from "@/components/active-round";
import ProjectsGrid from "@/components/projects-grid";
import QFExplainer from "@/components/qf-explainer";
import Statistics from "@/components/statistics";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero />
      <HowItWorks />
      <ActiveRound />
      <ProjectsGrid />
      <QFExplainer />
      <Statistics />
    </div>
  );
}
