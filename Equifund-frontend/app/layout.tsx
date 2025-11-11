import type React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import AppKitProvider from "@/context/appkit-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "EquiFund - Quadratic Funding Platform",
  description:
    "Amplify Impact. Democratize Funding. Where small donations create big change through quadratic matching.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const serialisedCookies =
    typeof cookieStore.getAll === "function"
      ? cookieStore
          .getAll()
          .map(({ name, value }) => `${name}=${value}`)
          .join("; ")
      : "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable} font-sans antialiased`}
      >
        <AppKitProvider cookies={serialisedCookies || null}>
          {children}
          <Analytics />
        </AppKitProvider>
      </body>
    </html>
  );
}
