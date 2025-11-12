"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
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
import { useUsdcAccount } from "@/hooks/useUsdcAccount";
import { useSybilStatus } from "@/hooks/useSybilStatus";
import { useDonorContribution } from "@/hooks/useDonorContribution";
import { useEquiFundRound } from "@/hooks/useEquiFundRound";

const BASE_SEPOLIA_CHAIN_ID = 84532;

function formatSeconds(seconds: bigint) {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0s";
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

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
  const { data: roundData } = useEquiFundRound();

  const { data: usdcAccount, refetch: refetchUsdc } = useUsdcAccount(
    address as `0x${string}` | undefined
  );
  const { data: sybilStatus, refetch: refetchSybil } = useSybilStatus(
    address as `0x${string}` | undefined
  );
  const { data: donorContribution, refetch: refetchContribution } =
    useDonorContribution(
      address as `0x${string}` | undefined,
      project?.address,
      roundData?.roundId
    );

  const [amount, setAmount] = useState("100");
  const [isApproving, setIsApproving] = useState(false);
  const [isContributing, setIsContributing] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("100");
      setIsApproving(false);
      setIsContributing(false);
    }
  }, [open]);

  const parsedAmount = useMemo(() => {
    try {
      return parseUnits(amount || "0", USDC_DECIMALS);
    } catch (error) {
      return 0n;
    }
  }, [amount]);

  const amountIsValid = parsedAmount > 0n;

  const wrongNetwork = isConnected && chainId !== BASE_SEPOLIA_CHAIN_ID;

  const balance = usdcAccount?.balance ?? 0n;
  const allowance = usdcAccount?.allowance ?? 0n;
  const balanceFormatted = formatUSDC(balance);
  const allowanceFormatted = formatUSDC(allowance);

  const needsApproval = allowance < parsedAmount && amountIsValid;
  const approvalReady = !needsApproval && amountIsValid;
  const insufficientBalance = balance < parsedAmount;

  const canContribute = sybilStatus?.canContribute ?? true;
  const cooldownRemaining = sybilStatus?.timeUntilNextContribution ?? 0n;

  const donorHasContribution = (donorContribution ?? 0n) > 0n;

  const disabledReason = useMemo(() => {
    if (!isConnected) return "Connect your wallet to continue";
    if (wrongNetwork) return "Switch to Base Sepolia";
    if (!project) return "Select a project";
    if (!amountIsValid) return "Enter a valid amount";
    if (insufficientBalance) return "Insufficient USDC balance";
    if (!canContribute) {
      return `Sybil protection active. Try again in ${formatSeconds(
        cooldownRemaining
      )}`;
    }
    return null;
  }, [
    isConnected,
    wrongNetwork,
    project,
    amountIsValid,
    insufficientBalance,
    canContribute,
    cooldownRemaining,
  ]);

  const approveDisabled =
    Boolean(disabledReason) || !needsApproval || isApproving;

  const contributeDisabled =
    Boolean(disabledReason) || !approvalReady || isContributing;

  const hintText = useMemo(() => {
    if (!project) return "Select a project to contribute";
    return `Currently raised ${formatUSDC(
      project.totalRaised
    )} with ${formatUSDC(project.totalMatched)} matched.`;
  }, [project]);

  const handleApprove = useCallback(async () => {
    if (!amountIsValid || !publicClient || !isConnected) return;

    try {
      setIsApproving(true);
      const hash = await writeContractAsync({
        address: USDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [EQUIFUND_POOL, parsedAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetchUsdc();

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
    amountIsValid,
    publicClient,
    isConnected,
    writeContractAsync,
    parsedAmount,
    refetchUsdc,
    toast,
    project?.name,
  ]);

  const handleContribute = useCallback(async () => {
    if (!project || !amountIsValid || !publicClient || !isConnected) return;

    try {
      setIsContributing(true);
      const hash = await writeContractAsync({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "contribute",
        args: [project.address, parsedAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await Promise.all([refetchUsdc(), refetchSybil(), refetchContribution()]);

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
    amountIsValid,
    publicClient,
    isConnected,
    writeContractAsync,
    parsedAmount,
    refetchUsdc,
    refetchSybil,
    refetchContribution,
    toast,
    onClose,
  ]);

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
            <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
              <p>{hintText}</p>
              <p>
                Balance:{" "}
                <span className="font-semibold">{balanceFormatted}</span> •
                Allowance:{" "}
                <span className="font-semibold">{allowanceFormatted}</span>
              </p>
              {donorHasContribution && (
                <p>
                  Your contribution this round:{" "}
                  {formatUSDC(donorContribution ?? 0n)}
                </p>
              )}
              {!canContribute && cooldownRemaining > 0n && (
                <p className="text-destructive">
                  Cooldown active. Try again in{" "}
                  {formatSeconds(cooldownRemaining)}.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-primary">
              Step 1 · Approve USDC {approvalReady ? "✅" : ""}
            </p>
            <p>
              Approve the pool to spend your USDC once. You only need to do this
              again if you increase the amount above your current allowance.
            </p>
            <p className="font-semibold text-primary mt-2">
              Step 2 · Contribute {approvalReady ? "(ready)" : ""}
            </p>
            <p>Confirm the contribution transaction after approval succeeds.</p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={approveDisabled}
              onClick={handleApprove}
            >
              {isApproving
                ? "Approving…"
                : approvalReady
                ? "Approved"
                : "Approve USDC"}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={contributeDisabled}
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
