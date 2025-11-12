"use client"

import Link from "next/link"

const projects = [
  {
    id: 1,
    name: "OpenSource Climate",
    description: "Building open-source tools for climate action",
    raised: 45000,
    matched: 125000,
    contributors: 234,
    progress: 65,
    image: "/climate-tree-forest.jpg",
  },
  {
    id: 2,
    name: "Web3 Education",
    description: "Free coding courses for underserved communities",
    raised: 38000,
    matched: 98000,
    contributors: 189,
    progress: 52,
    image: "/education-books-learning.jpg",
  },
  {
    id: 3,
    name: "Privacy Protocol",
    description: "Decentralized privacy infrastructure for everyone",
    raised: 62000,
    matched: 156000,
    contributors: 312,
    progress: 78,
    image: "/privacy-security-lock.jpg",
  },
]

export default function ProjectsGrid() {
  return (
    <section id="projects" className="py-20 px-4 bg-linear-to-b from-card/30 to-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Projects</h2>
        <p className="text-muted-foreground mb-16 text-lg">Support verified public goods making a difference</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className="glass-morphism rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Project Image */}
              <div className="h-40 bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden relative group">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.name}
                  className="w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-primary font-semibold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary to-secondary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Raised</p>
                    <p className="font-semibold">${project.raised.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Matched</p>
                    <p className="font-semibold text-accent">${project.matched.toLocaleString()}</p>
                  </div>
                </div>

                {/* Contributors */}
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                  <span>👥 {project.contributors} contributors</span>
                </div>

                {/* CTA Button */}
                <Link
                  href="/contribute"
                  className="w-full px-4 py-3 rounded-lg bg-linear-to-r from-primary to-secondary text-primary-foreground font-semibold hover:shadow-lg glow-indigo transition-all duration-300 flex items-center justify-center gap-2"
                >
                  💰 Contribute
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
