"use client"

import Hero from "@/components/hero"
import Navigation from "@/components/navigation"
import HowItWorks from "@/components/how-it-works"
import ActiveRound from "@/components/active-round"
import ProjectsGrid from "@/components/projects-grid"
import QFExplainer from "@/components/qf-explainer"
import Statistics from "@/components/statistics"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />
      <Hero />
      <HowItWorks />
      <ActiveRound />
      <ProjectsGrid />
      <QFExplainer />
      <Statistics />
      <Footer />
    </main>
  )
}
