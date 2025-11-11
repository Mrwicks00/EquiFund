"use client"

import { CheckCircle } from "lucide-react"

export default function QFExplainer() {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Quadratic Funding?</h2>
        <p className="text-muted-foreground mb-16 text-lg">
          Mathematical fairness ensures your voice matters more than your wallet
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual Representation */}
          <div className="glass-morphism rounded-2xl p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1x</span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Traditional Funding</p>
                  <p className="text-sm text-muted-foreground">Largest donation has most influence</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary font-bold">↑</span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Quadratic Funding</p>
                  <p className="text-sm text-muted-foreground">Community consensus drives allocation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <CheckCircle className="text-accent flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Prevents Whale Dominance</h4>
                <p className="text-muted-foreground">Large donors can't unilaterally control outcomes</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="text-accent flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Rewards Broad Support</h4>
                <p className="text-muted-foreground">Projects with many donors receive more matching</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="text-accent flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Mathematically Fair</h4>
                <p className="text-muted-foreground">Transparent formula ensures equitable distribution</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle className="text-accent flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Sybil Resistant</h4>
                <p className="text-muted-foreground">Built-in mechanisms prevent gaming</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
