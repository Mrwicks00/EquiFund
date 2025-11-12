import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { EQUIFUND_POOL } from "@/lib/address";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";

type RoundStats = {
  roundId: bigint;
  startTime: bigint;
  endTime: bigint;
  matchingPool: bigint;
  totalContributions: bigint;
  totalContributors: bigint;
  finalized: boolean;
  matchingPoolBalance: bigint;
  projects: `0x${string}`[];
};

async function fetchRoundStats(
  publicClient: ReturnType<typeof usePublicClient>,
  address: `0x${string}`
) {
  if (!publicClient) {
    throw new Error("No public client available");
  }

  const roundId = (await publicClient.readContract({
    address,
    abi: EQUIFUND_POOL_ABI,
    functionName: "currentRoundId",
  })) as bigint;

  const [statsTuple, matchingPoolBalance, projects] = await Promise.all([
    publicClient.readContract({
      address,
      abi: EQUIFUND_POOL_ABI,
      functionName: "getRoundStats",
      args: [roundId],
    }) as Promise<readonly [bigint, bigint, bigint, bigint, bigint, boolean]>,
    publicClient.readContract({
      address,
      abi: EQUIFUND_POOL_ABI,
      functionName: "matchingPoolBalance",
    }) as Promise<bigint>,
    publicClient.readContract({
      address,
      abi: EQUIFUND_POOL_ABI,
      functionName: "getRoundProjects",
      args: [roundId],
    }) as Promise<`0x${string}`[]>,
  ]);

  return {
    roundId,
    startTime: statsTuple[0],
    endTime: statsTuple[1],
    matchingPool: statsTuple[2],
    totalContributions: statsTuple[3],
    totalContributors: statsTuple[4],
    finalized: statsTuple[5],
    matchingPoolBalance,
    projects,
  } satisfies RoundStats;
}

export function useEquiFundRound() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["equifund", "round", EQUIFUND_POOL],
    queryFn: () => fetchRoundStats(publicClient, EQUIFUND_POOL),
    enabled: Boolean(publicClient),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
