"use client";

import { useCallback, useMemo, useState } from "react";
import {
  usePublicClient,
  useWriteContract,
  useAccount,
  useChainId,
} from "wagmi";
import { parseUnits } from "viem";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatUSDC, USDC_DECIMALS } from "@/lib/format";
import { EQUIFUND_POOL, USDC } from "@/lib/address";
import { MOCK_USDC_ABI } from "@/abi/mockUsdc";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";

type ContributeModalProps = {
  open: boolean;
  onClose: () => void;
  project: {
    address: `0x${string}`;
    name: string;
    description: string;
    totalRaised: bigint;
    totalMatched: bigint;
  } | null;
};

export function ContributeModal({
  open,
  onClose,
  project,
}: ContributeModalProps) {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [amount, setAmount] = useState("100");
  const [isApproving, setIsApproving] = useState(false);
  const [isContributing, setIsContributing] = useState(false);

  const amountIsValid = useMemo(() => {
    if (!amount) return false;
    const numeric = Number(amount);
    return Number.isFinite(numeric) && numeric > 0;
  }, [amount]);

  const baseSepoliaChainId = 84532;
  const wrongNetwork = isConnected && chainId !== baseSepoliaChainId;

  const handleApprove = useCallback(async () => {
    if (!amountIsValid || !publicClient) return;

    try {
      setIsApproving(true);
      const value = parseUnits(amount, USDC_DECIMALS);
      const hash = await writeContractAsync({
        address: USDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [EQUIFUND_POOL, value],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Approval confirmed",
        description: `USDC allowance updated for ${
          project?.name ?? "EquiFund"
        }.`,
      });
    } catch (error) {
      console.error("approve error", error);
      toast({
        title: "Approval failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while approving USDC.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  }, [
    amount,
    amountIsValid,
    publicClient,
    toast,
    writeContractAsync,
    project?.name,
  ]);

  const handleContribute = useCallback(async () => {
    if (!project || !amountIsValid || !publicClient) return;

    try {
      setIsContributing(true);
      const value = parseUnits(amount, USDC_DECIMALS);
      const hash = await writeContractAsync({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "contribute",
        args: [project.address, value],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Contribution sent",
        description: `Thanks for supporting ${project.name}!`,
      });

      setAmount("100");
      onClose();
    } catch (error) {
      console.error("contribute error", error);
      toast({
        title: "Contribution failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to submit contribution.",
        variant: "destructive",
      });
    } finally {
      setIsContributing(false);
    }
  }, [
    project,
    amount,
    amountIsValid,
    publicClient,
    toast,
    writeContractAsync,
    onClose,
  ]);

  const disabledReason = useMemo(() => {
    if (!isConnected) return "Connect your wallet to continue";
    if (wrongNetwork) return "Switch to Base Sepolia";
    if (!project) return "Select a project";
    if (!amountIsValid) return "Enter a valid amount";
    return null;
  }, [isConnected, wrongNetwork, project, amountIsValid]);

  const hintText = useMemo(() => {
    if (!project) return "Select a project to contribute";
    return `Currently raised ${formatUSDC(
      project.totalRaised
    )} with ${formatUSDC(project.totalMatched)} matched.`;
  }, [project]);

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => (!openState ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Contribute to {project?.name ?? "a project"}
          </DialogTitle>
        </DialogHeader>

        {!isConnected && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            Connect your wallet to begin the contribution flow.
          </p>
        )}

        {wrongNetwork && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Please switch your wallet to Base Sepolia before contributing.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="contribution-amount"
            >
              Contribution Amount (USDC)
            </label>
            <Input
              id="contribution-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">{hintText}</p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={Boolean(disabledReason) || isApproving}
              onClick={handleApprove}
            >
              {isApproving ? "Approving…" : "Approve USDC"}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={Boolean(disabledReason) || isContributing}
              onClick={handleContribute}
            >
              {isContributing ? "Submitting…" : "Contribute"}
            </Button>
          </div>

          {address && (
            <p className="text-xs text-muted-foreground">
              Contributing from <span className="font-mono">{address}</span>
            </p>
          )}
        </div>

        {disabledReason && (
          <p className="mt-4 text-xs text-muted-foreground">{disabledReason}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
