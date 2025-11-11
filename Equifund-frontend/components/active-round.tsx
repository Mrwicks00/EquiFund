"use client"

import { Clock, Zap, Users, Target, Gauge } from "lucide-react"
import { useEffect, useState } from "react"

export default function ActiveRound() {
  const [timeLeft, setTimeLeft] = useState("14d 5h 32m")

  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, calculate actual time remaining
      setTimeLeft("14d 5h 32m")
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="gradient-border rounded-2xl p-1 mb-20">
          <div className="glass-morphism rounded-2xl p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Timer */}
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase mb-4 flex items-center gap-2">
                  <Clock size={16} /> Round 12 Active
                </h3>
                <div className="mb-8">
                  <p className="text-muted-foreground mb-2">Time Remaining</p>
                  <div className="text-5xl font-bold font-mono gradient-text">{timeLeft}</div>
                </div>

                {/* Matching Pool */}
                <div>
                  <p className="text-muted-foreground mb-2">Matching Pool</p>
                  <div className="text-4xl font-bold">$500K</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={20} className="text-primary" />
                    <p className="text-sm text-muted-foreground">Contributors</p>
                  </div>
                  <div className="text-2xl font-bold">8.2K</div>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={20} className="text-secondary" />
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                  <div className="text-2xl font-bold">234</div>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={20} className="text-accent" />
                    <p className="text-sm text-muted-foreground">Raised</p>
                  </div>
                  <div className="text-2xl font-bold">$1.8M</div>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge size={20} className="text-accent" />
                    <p className="text-sm text-muted-foreground">Avg Match</p>
                  </div>
                  <div className="text-2xl font-bold">2.8x</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
