import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

import { PROJECT_REGISTRY, EQUIFUND_POOL } from "@/lib/address";
import { PROJECT_REGISTRY_ABI } from "@/abi/projectRegistry";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";

export function useEquiFundProject(
  projectAddress?: `0x${string}`,
  roundId?: bigint
) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: [
      "equifund",
      "project",
      projectAddress,
      roundId ? roundId.toString() : "none",
    ],
    enabled: Boolean(publicClient && projectAddress),
    queryFn: async () => {
      if (!publicClient || !projectAddress) {
        throw new Error("Project address not provided");
      }

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
          console.warn("Unable to load project contribution totals", {
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
      };
    },
  });
}
