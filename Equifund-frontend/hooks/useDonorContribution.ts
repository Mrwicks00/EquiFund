import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { EQUIFUND_POOL } from "@/lib/address";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";

export function useDonorContribution(
  donor?: `0x${string}`,
  project?: `0x${string}`,
  roundId?: bigint
) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: [
      "equifund",
      "donor-contribution",
      donor ?? "none",
      project ?? "none",
      roundId ? roundId.toString() : "none",
    ],
    enabled: Boolean(
      publicClient && donor && project && roundId && roundId > 0n
    ),
    queryFn: async () => {
      if (!publicClient || !donor || !project || !roundId) {
        throw new Error("Missing parameters for donor contribution query");
      }

      const contribution = (await publicClient.readContract({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "getDonorContribution",
        args: [roundId, donor, project],
      })) as bigint;

      return contribution;
    },
    staleTime: 10_000,
  });
}
