"use client"

import { type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createAppKit } from "@reown/appkit/react"
import { baseSepolia } from "@reown/appkit/networks"
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi"

import { projectId, wagmiAdapter } from "@/config/appkit"

const queryClient = new QueryClient()

if (!projectId) {
  throw new Error("Project ID is not defined")
}

const metadata = {
  name: "EquiFund",
  description: "Quadratic funding for community-driven impact",
  url: "https://equifund.app",
  icons: ["/icon.svg"],
}

export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [baseSepolia],
  defaultNetwork: baseSepolia,
  metadata,
  features: {
    analytics: true,
  },
})

type AppKitProviderProps = {
  children: ReactNode
  cookies: string | null
}

export default function AppKitProvider({ children, cookies }: AppKitProviderProps) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
