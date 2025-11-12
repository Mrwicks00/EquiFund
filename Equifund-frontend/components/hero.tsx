"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type HeroVariant = "default" | "projects" | "rounds" | "stats" | "about" | "contribute";

type HeroProps = {
  variant?: HeroVariant;
};

const heroContent: Record<
  HeroVariant,
  {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    primaryHref: string;
    secondaryHref: string;
  }
> = {
  default: {
    title: "Amplify Impact. Democratize Funding.",
    subtitle:
      "Where Small Donations Create Big Change Through Quadratic Matching",
    primaryCta: "Start Contributing",
    secondaryCta: "Learn More",
    primaryHref: "/contribute",
    secondaryHref: "/about",
  },
  projects: {
    title: "Discover Public Goods Worth Backing",
    subtitle:
      "Browse curated, verified projects and see how quadratic funding boosts their impact.",
    primaryCta: "Explore Projects",
    secondaryCta: "How EquiFund Works",
    primaryHref: "/projects",
    secondaryHref: "/about",
  },
  rounds: {
    title: "Track Live Funding Rounds",
    subtitle:
      "Follow matching pools, timelines, and distribution in real time across Base Sepolia.",
    primaryCta: "View Current Round",
    secondaryCta: "Past Rounds",
    primaryHref: "/rounds",
    secondaryHref: "/rounds#history",
  },
  stats: {
    title: "Transparency Backed by On-Chain Data",
    subtitle:
      "Audit contributions, matching efficiency, and quadratic impact with interactive analytics.",
    primaryCta: "View Analytics",
    secondaryCta: "Download Reports",
    primaryHref: "/stats",
    secondaryHref: "/stats#reports",
  },
  about: {
    title: "Powering Democratic Funding for Public Goods",
    subtitle:
      "EquiFund brings community-led capital allocation to Base Sepolia using quadratic funding.",
    primaryCta: "Our Mission",
    secondaryCta: "Meet the Team",
    primaryHref: "/about",
    secondaryHref: "/about#team",
  },
  contribute: {
    title: "Contribute & Amplify Collective Impact",
    subtitle:
      "Select a project, choose your contribution, and let quadratic matching multiply community support.",
    primaryCta: "Launch Contribute Flow",
    secondaryCta: "Browse Eligible Projects",
    primaryHref: "#contribute-form",
    secondaryHref: "/projects",
  },
};

export default function Hero({ variant = "default" }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }

    const particles: Particle[] = [];

    // Create floating shapes
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 50 + 20,
        color: [
          "rgba(99, 102, 241, 0.1)",
          "rgba(139, 92, 246, 0.1)",
          "rgba(6, 182, 212, 0.1)",
        ][Math.floor(Math.random() * 3)],
      });
    }

    const animate = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x - p.radius < 0 || p.x + p.radius > canvas.width) p.vx *= -1;
        if (p.y - p.radius < 0 || p.y + p.radius > canvas.height) p.vy *= -1;

        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { title, subtitle, primaryCta, secondaryCta, primaryHref, secondaryHref } = heroContent[variant];

  return (
    <section className="relative min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-background to-secondary/10 z-1" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
          <span className="gradient-text text-balance">{title}</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up delay-100 text-balance">
          {subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up delay-200">
          <div className="glass-morphism p-6 rounded-lg">
            <div className="text-3xl font-bold gradient-text">💰 $2.5M</div>
            <p className="text-sm text-muted-foreground mt-2">Matched</p>
          </div>
          <div className="glass-morphism p-6 rounded-lg">
            <div className="text-3xl font-bold gradient-text">🤝 12.5K</div>
            <p className="text-sm text-muted-foreground mt-2">Contributors</p>
          </div>
          <div className="glass-morphism p-6 rounded-lg">
            <div className="text-3xl font-bold gradient-text">🚀 347</div>
            <p className="text-sm text-muted-foreground mt-2">Projects Funded</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center animate-slide-up delay-300">
          <Link
            href={primaryHref}
            className="px-8 py-4 rounded-lg bg-linear-to-r from-primary to-secondary text-primary-foreground font-semibold hover:shadow-lg glow-indigo transition-all duration-300 hover:scale-105"
          >
            {primaryCta}
          </Link>
          <Link
            href={secondaryHref}
            className="px-8 py-4 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary/10 transition-all duration-300"
          >
            {secondaryCta}
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
          <ChevronDown className="text-primary" size={32} />
        </div>
      </div>
    </section>
  );
}
