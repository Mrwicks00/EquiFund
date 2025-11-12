import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { USDC, EQUIFUND_POOL } from "@/lib/address";
import { MOCK_USDC_ABI } from "@/abi/mockUsdc";

export function useUsdcAccount(owner?: `0x${string}`) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["usdc", owner ?? "none", "account"],
    enabled: Boolean(publicClient && owner),
    staleTime: 15_000,
    queryFn: async () => {
      if (!publicClient || !owner) {
        throw new Error("No owner provided for USDC account query");
      }

      const [balance, allowance] = await Promise.all([
        publicClient.readContract({
          address: USDC,
          abi: MOCK_USDC_ABI,
          functionName: "balanceOf",
          args: [owner],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: USDC,
          abi: MOCK_USDC_ABI,
          functionName: "allowance",
          args: [owner, EQUIFUND_POOL],
        }) as Promise<bigint>,
      ]);

      return { balance, allowance };
    },
  });
}
