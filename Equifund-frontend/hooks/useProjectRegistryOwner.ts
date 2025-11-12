import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { PROJECT_REGISTRY } from "@/lib/address";
import { PROJECT_REGISTRY_ABI } from "@/abi/projectRegistry";

export function useProjectRegistryOwner() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["equifund", "project-registry", "owner"],
    queryFn: async () => {
      if (!publicClient) throw new Error("No public client available");

      const owner = (await publicClient.readContract({
        address: PROJECT_REGISTRY,
        abi: PROJECT_REGISTRY_ABI,
        functionName: "owner",
      })) as `0x${string}`;

      return owner;
    },
    enabled: Boolean(publicClient),
    staleTime: 60_000,
  });
}
