import type { ReactNode } from "react";

import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <main className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      <Navigation />
      {children}
      <Footer />
    </main>
  );
}
