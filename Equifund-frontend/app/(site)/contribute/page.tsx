"use client";

import Hero from "@/components/hero";
import Link from "next/link";
import ContributeProjects from "@/components/contribute-projects";

const steps = [
  {
    title: "Connect Your Wallet",
    description:
      "Use AppKit to connect a Base-compatible wallet. We currently support WalletConnect, Coinbase Wallet, and popular browser wallets.",
    icon: "🔐",
  },
  {
    title: "Choose a Project",
    description:
      "Browse verified public goods and select the project you want to support. Each card shows live contribution and matching stats.",
    icon: "🎯",
  },
  {
    title: "Confirm Your Contribution",
    description:
      "Enter the amount you want to contribute, review the estimated match, and approve the transaction from your wallet.",
    icon: "⚡️",
  },
];

const faqs = [
  {
    question: "What is quadratic funding?",
    answer:
      "Quadratic funding increases the influence of broad community support. The more unique contributors a project has, the larger the matching allocation it receives.",
  },
  {
    question: "Which network does EquiFund use?",
    answer:
      "EquiFund runs on Base Sepolia for this release. Make sure your wallet is on Base Sepolia before contributing.",
  },
  {
    question: "Is there a minimum contribution?",
    answer:
      "Yes, contributions must meet the minimum amount defined by the round (typically 1 USDC) to prevent spam and enable fair matching.",
  },
];

export default function ContributePage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="contribute" />

      <section id="contribute-form" className="px-4">
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="glass-morphism rounded-3xl p-8 lg:p-10 shadow-xl border border-primary/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Contribution Launchpad
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              This flow will guide you through connecting your wallet, selecting
              a project, and confirming your contribution. Live contract
              interactions are coming next—today you're exploring the full
              journey and UI.
            </p>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/20 p-6 flex gap-4"
                >
                  <div className="text-3xl" aria-hidden>
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <Link
                href="/projects"
                className="rounded-xl border border-primary/20 px-6 py-4 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition"
              >
                Browse All Projects
              </Link>
              <Link
                href="/rounds"
                className="rounded-xl bg-linear-to-r from-primary to-secondary px-6 py-4 text-center text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-primary/40 transition"
              >
                View Round Status
              </Link>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="glass-morphism rounded-3xl border border-primary/10 p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Why Contributions Matter
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Every contribution—no matter the size—signals community support.
                Quadratic funding boosts projects with broad backing, ensuring
                that public goods reflect the collective will rather than a
                single whale donor.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>✅ Matching pools amplify smaller donations</li>
                <li>✅ Transparent on-chain distribution</li>
                <li>✅ Sybil protection via cooldown and verification</li>
                <li>✅ Built for Base Sepolia public goods</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-secondary/20 bg-secondary/10 p-8">
              <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Direct contract interactions are in progress. Soon this page
                will feature a fully functional contribution form powered by
                wagmi, viem, and the EquiFund smart contracts. Stay tuned for
                live transactions, real-time match previews, and contribution
                histories.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <ContributeProjects />

      <section className="px-4">
        <div className="max-w-6xl mx-auto rounded-3xl border border-primary/10 bg-primary/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Contribution FAQs
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl bg-background/60 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="max-w-5xl mx-auto rounded-3xl bg-linear-to-r from-secondary/10 to-primary/10 p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to amplify a project?
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            Connect your wallet, pick a public good that inspires you, and let
            the quadratic magic do the rest.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-primary/40 transition"
          >
            Explore Projects
          </Link>
        </div>
      </section>
    </div>
  );
}
