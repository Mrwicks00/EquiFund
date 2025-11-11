"use client"

import { Zap, Coins, TrendingUp } from "lucide-react"

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 px-4 bg-gradient-to-b from-background to-card/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-muted-foreground mb-16 text-lg max-w-2xl mx-auto">
          Quadratic funding amplifies the voices of the community by matching donations with a sophisticated algorithm
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-morphism p-8 rounded-2xl animate-slide-up hover:scale-105 transition-transform duration-300">
            <div className="mb-6 p-4 bg-primary/20 rounded-lg w-fit mx-auto">
              <Zap className="text-primary" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Discover Projects</h3>
            <p className="text-muted-foreground text-center">
              Browse verified public goods projects making a real impact in their communities
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-morphism p-8 rounded-2xl animate-slide-up delay-100 hover:scale-105 transition-transform duration-300">
            <div className="mb-6 p-4 bg-secondary/20 rounded-lg w-fit mx-auto">
              <Coins className="text-secondary" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Contribute</h3>
            <p className="text-muted-foreground text-center">
              Your donation gets matched quadratically, amplifying small donations
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-morphism p-8 rounded-2xl animate-slide-up delay-200 hover:scale-105 transition-transform duration-300">
            <div className="mb-6 p-4 bg-accent/20 rounded-lg w-fit mx-auto">
              <TrendingUp className="text-accent" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">Amplify Impact</h3>
            <p className="text-muted-foreground text-center">
              Small donations have equal voice to large ones, creating fair distribution
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
