"use client";

import Hero from "@/components/hero";
import ActiveRound from "@/components/active-round";
import QFExplainer from "@/components/qf-explainer";
import RoundAdminPanel from "@/components/round-admin-panel";

export default function RoundsPage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="rounds" />
      <ActiveRound />
      <RoundAdminPanel />
      <QFExplainer />
    </div>
  );
}
