"use client";

import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import QFExplainer from "@/components/qf-explainer";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="about" />
      <HowItWorks />
      <QFExplainer />
    </div>
  );
}
