import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { SYBIL_GUARD } from "@/lib/address";
import { SYBIL_GUARD_ABI } from "@/abi/sybilGuard";

export function useSybilStatus(donor?: `0x${string}`) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["sybil", donor ?? "none"],
    enabled: Boolean(publicClient && donor),
    staleTime: 15_000,
    queryFn: async () => {
      if (!publicClient || !donor) {
        throw new Error("Donor address is required");
      }

      const [canContribute, timeUntilNextContribution, cooldownPeriod] =
        await Promise.all([
          publicClient.readContract({
            address: SYBIL_GUARD,
            abi: SYBIL_GUARD_ABI,
            functionName: "canContribute",
            args: [donor],
          }) as Promise<boolean>,
          publicClient.readContract({
            address: SYBIL_GUARD,
            abi: SYBIL_GUARD_ABI,
            functionName: "timeUntilNextContribution",
            args: [donor],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: SYBIL_GUARD,
            abi: SYBIL_GUARD_ABI,
            functionName: "getCooldownPeriod",
          }) as Promise<bigint>,
        ]);

      return {
        canContribute,
        timeUntilNextContribution,
        cooldownPeriod,
      };
    },
  });
}
