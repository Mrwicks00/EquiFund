import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { EQUIFUND_POOL } from "@/lib/address";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";

export function usePoolOwner() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["equifund", "pool", "owner"],
    enabled: Boolean(publicClient),
    queryFn: async () => {
      if (!publicClient) throw new Error("No public client available");

      const owner = (await publicClient.readContract({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "owner",
      })) as `0x${string}`;

      return owner;
    },
    staleTime: 60_000,
  });
}
