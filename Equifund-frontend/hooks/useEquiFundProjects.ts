import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";

import { PROJECT_REGISTRY, EQUIFUND_POOL } from "@/lib/address";
import { PROJECT_REGISTRY_ABI } from "@/abi/projectRegistry";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";
import { USDC_DECIMALS } from "@/lib/format";

type ProjectMetadata = {
  address: `0x${string}`;
  name: string;
  description: string;
  metadataURI: string;
  isActive: boolean;
  registeredAt: bigint;
  totalRaised: bigint;
  totalMatched: bigint;
};

async function fetchActiveProjects(
  publicClient: ReturnType<typeof usePublicClient>,
  roundId?: bigint
): Promise<ProjectMetadata[]> {
  if (!publicClient) {
    throw new Error("No public client available");
  }

  const projectAddresses = (await publicClient.readContract({
    address: PROJECT_REGISTRY,
    abi: PROJECT_REGISTRY_ABI,
    functionName: "getActiveProjects",
  })) as `0x${string}`[];

  if (projectAddresses.length === 0) {
    return [];
  }

  const projects = await Promise.all(
    projectAddresses.map(async (projectAddress) => {
      const project = (await publicClient.readContract({
        address: PROJECT_REGISTRY,
        abi: PROJECT_REGISTRY_ABI,
        functionName: "getProject",
        args: [projectAddress],
      })) as {
        projectAddress: `0x${string}`;
        name: string;
        description: string;
        metadataURI: string;
        isActive: boolean;
        registeredAt: bigint;
      };

      let totalRaised = 0n;
      let totalMatched = 0n;

      if (roundId && roundId > 0n) {
        try {
          const [raised, matched] = await Promise.all([
            publicClient.readContract({
              address: EQUIFUND_POOL,
              abi: EQUIFUND_POOL_ABI,
              functionName: "projectTotalContributions",
              args: [roundId, projectAddress],
            }) as Promise<bigint>,
            publicClient.readContract({
              address: EQUIFUND_POOL,
              abi: EQUIFUND_POOL_ABI,
              functionName: "projectMatchAmount",
              args: [roundId, projectAddress],
            }) as Promise<bigint>,
          ]);

          totalRaised = raised;
          totalMatched = matched;
        } catch (error) {
          console.warn("Unable to load project totals", {
            projectAddress,
            error,
          });
        }
      }

      return {
        address: project.projectAddress,
        name: project.name,
        description: project.description,
        metadataURI: project.metadataURI,
        isActive: project.isActive,
        registeredAt: project.registeredAt,
        totalRaised,
        totalMatched,
      } satisfies ProjectMetadata;
    })
  );

  return projects.sort((a, b) => Number(b.totalRaised - a.totalRaised));
}

export function useEquiFundProjects(roundId?: bigint) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["equifund", "projects", roundId ? roundId.toString() : "none"],
    queryFn: () => fetchActiveProjects(publicClient, roundId),
    enabled: Boolean(publicClient),
    staleTime: 15_000,
    refetchInterval: 45_000,
  });
}

export function toHumanUSDC(value: bigint) {
  return Number(formatUnits(value, USDC_DECIMALS));
}
