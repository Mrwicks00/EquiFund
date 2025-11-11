"use client"

export default function Statistics() {
  return (
    <section id="stats" className="py-20 px-4 bg-gradient-to-b from-background to-card/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Platform Statistics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="glass-morphism rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl font-bold gradient-text mb-3">$12.4M</div>
            <p className="text-muted-foreground">Total Funding Distributed</p>
          </div>

          {/* Stat 2 */}
          <div className="glass-morphism rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl font-bold gradient-text mb-3">45K+</div>
            <p className="text-muted-foreground">Unique Contributors</p>
          </div>

          {/* Stat 3 */}
          <div className="glass-morphism rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl font-bold gradient-text mb-3">892</div>
            <p className="text-muted-foreground">Projects Funded</p>
          </div>

          {/* Stat 4 */}
          <div className="glass-morphism rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-5xl font-bold gradient-text mb-3">3.2x</div>
            <p className="text-muted-foreground">Average Match Multiplier</p>
          </div>
        </div>
      </div>
    </section>
  )
}
