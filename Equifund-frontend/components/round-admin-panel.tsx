"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { Loader2, ShieldCheck } from "lucide-react";
import { parseUnits } from "viem";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEquiFundRound } from "@/hooks/useEquiFundRound";
import { usePoolOwner } from "@/hooks/usePoolOwner";
import { useUsdcAccount } from "@/hooks/useUsdcAccount";
import { EQUIFUND_POOL } from "@/lib/address";
import { EQUIFUND_POOL_ABI } from "@/abi/equifundPool";
import { formatUSDC, USDC_DECIMALS } from "@/lib/format";
import { MOCK_USDC_ABI } from "@/abi/mockUsdc";
import { USDC } from "@/lib/address";

const MIN_DURATION_SECONDS = 3600; // 1 hour

export default function RoundAdminPanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  const { data: owner, isLoading: ownerLoading } = usePoolOwner();
  const {
    data: roundData,
    isLoading: roundLoading,
    refetch: refetchRound,
  } = useEquiFundRound();
  const { data: ownerUsdc, refetch: refetchOwnerUsdc } = useUsdcAccount(
    address as `0x${string}` | undefined
  );

  const [durationDays, setDurationDays] = useState("7");
  const [isCreating, setIsCreating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [fundAmount, setFundAmount] = useState("5000");
  const [isApprovingFunds, setIsApprovingFunds] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const isOwner = useMemo(() => {
    if (!owner || !address) return false;
    return owner.toLowerCase() === address.toLowerCase();
  }, [owner, address]);

  const roundId = roundData?.roundId ?? 0n;
  const hasActiveRound = roundId > 0n && !(roundData?.finalized ?? true);
  const roundEndMs = Number(roundData?.endTime ?? 0n) * 1000;
  const canFinalize =
    hasActiveRound && roundEndMs > 0 && roundEndMs <= Date.now();

  const lockedMatchingPool = roundData?.matchingPool ?? 0n;
  const availableMatchingPool = roundData?.matchingPoolBalance ?? 0n;

  const ownerBalance = ownerUsdc?.balance ?? 0n;
  const ownerAllowance = ownerUsdc?.allowance ?? 0n;

  const fundAmountParsed = useMemo(() => {
    try {
      return parseUnits(fundAmount || "0", USDC_DECIMALS);
    } catch (error) {
      return 0n;
    }
  }, [fundAmount]);

  const fundAmountValid = fundAmountParsed > 0n;
  const needsFundApproval =
    ownerAllowance < fundAmountParsed && fundAmountValid;
  const fundApprovalReady = !needsFundApproval && fundAmountValid;
  const insufficientFundBalance = ownerBalance < fundAmountParsed;

  const parsedDurationSeconds = useMemo(() => {
    const numeric = Number(durationDays);
    if (!Number.isFinite(numeric) || numeric <= 0) return MIN_DURATION_SECONDS;
    const seconds = Math.floor(numeric * 86400);
    return BigInt(Math.max(seconds, MIN_DURATION_SECONDS));
  }, [durationDays]);

  const handleCreateRound = async () => {
    if (!isOwner || !publicClient) return;

    try {
      setIsCreating(true);
      const hash = await writeContractAsync({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "createRound",
        args: [parsedDurationSeconds],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetchRound();

      toast({
        title: "Round created",
        description: "A new funding round is now live.",
      });
    } catch (error) {
      console.error("createRound error", error);
      toast({
        title: "Unable to create round",
        description:
          error instanceof Error ? error.message : "Transaction reverted.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleApproveFunds = async () => {
    if (!publicClient || !isOwner || !fundAmountValid) return;

    try {
      setIsApprovingFunds(true);
      const hash = await writeContractAsync({
        address: USDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [EQUIFUND_POOL, fundAmountParsed],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetchOwnerUsdc();

      toast({
        title: "Allowance updated",
        description: "USDC allowance approved for matching pool deposits.",
      });
    } catch (error) {
      console.error("approve matching funds error", error);
      toast({
        title: "Approval failed",
        description:
          error instanceof Error ? error.message : "Unable to approve funds.",
        variant: "destructive",
      });
    } finally {
      setIsApprovingFunds(false);
    }
  };

  const handleAddMatchingFunds = async () => {
    if (!publicClient || !isOwner || !fundAmountValid) return;

    try {
      setIsAddingFunds(true);
      const hash = await writeContractAsync({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "addMatchingFunds",
        args: [fundAmountParsed],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await Promise.all([refetchOwnerUsdc(), refetchRound()]);

      toast({
        title: "Matching pool funded",
        description: `${formatUSDC(fundAmountParsed)} added to the pool.`,
      });

      setFundAmount("5000");
    } catch (error) {
      console.error("addMatchingFunds error", error);
      toast({
        title: "Unable to add funds",
        description:
          error instanceof Error ? error.message : "Transaction reverted.",
        variant: "destructive",
      });
    } finally {
      setIsAddingFunds(false);
    }
  };

  const handleFinalizeRound = async () => {
    if (!isOwner || !publicClient) return;

    try {
      setIsFinalizing(true);
      const hash = await writeContractAsync({
        address: EQUIFUND_POOL,
        abi: EQUIFUND_POOL_ABI,
        functionName: "finalizeRound",
        args: [],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      await refetchRound();

      toast({
        title: "Round finalized",
        description: "Matching allocations have been calculated.",
      });
    } catch (error) {
      console.error("finalizeRound error", error);
      toast({
        title: "Unable to finalize round",
        description:
          error instanceof Error ? error.message : "Transaction reverted.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (ownerLoading || roundLoading) {
    return (
      <section className="px-4">
        <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-card/60 p-8 text-muted-foreground flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading round controls…
        </div>
      </section>
    );
  }

  if (!isOwner) {
    return (
      <section className="px-4">
        <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-card/60 p-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 text-primary font-semibold">
            <ShieldCheck size={18} /> Owner access required
          </div>
          <p className="mt-3">
            Connect with the EquiFundPool owner wallet to manage funding rounds.
            Current owner: {owner ?? "unknown"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4">
      <div className="max-w-5xl mx-auto rounded-3xl border border-primary/20 bg-primary/5 p-10 space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Round management
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Control the quadratic funding window
          </h2>
          <p className="text-muted-foreground mt-2">
            Create rounds when matching funds are ready, and finalize them after
            the end time to distribute matching allocations.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-background/80 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Create a new round</h3>
            <p className="text-sm text-muted-foreground">
              Duration is measured in days. Matching pool available:{" "}
              {formatUSDC(availableMatchingPool)}.
            </p>

            <div>
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="round-duration"
              >
                Round duration (days)
              </label>
              <Input
                id="round-duration"
                type="number"
                min="0.01"
                step="0.5"
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Minimum 1 hour. Matching pool balance is locked into the round
                when created.
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={
                hasActiveRound || isCreating || availableMatchingPool === 0n
              }
              onClick={handleCreateRound}
            >
              {isCreating
                ? "Creating round…"
                : hasActiveRound
                ? "Round active"
                : "Create round"}
            </Button>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-background/80 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Current round</h3>
            {hasActiveRound ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Round #{roundId.toString()} · ends{" "}
                  {roundEndMs > 0
                    ? new Date(roundEndMs).toLocaleString()
                    : "TBD"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Locked matching pool: {formatUSDC(lockedMatchingPool)}
                </p>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={!canFinalize || isFinalizing}
                  onClick={handleFinalizeRound}
                >
                  {isFinalizing
                    ? "Finalizing…"
                    : canFinalize
                    ? "Finalize round"
                    : "Waiting for end time"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active round. Create a new round when you are ready to accept
                contributions.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Add matching funds</h3>
          <p className="text-sm text-muted-foreground">
            Current USDC balance: {formatUSDC(ownerBalance)} • Allowance:{" "}
            {formatUSDC(ownerAllowance)}
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="matching-amount"
              >
                Amount (USDC)
              </label>
              <Input
                id="matching-amount"
                type="number"
                min="0"
                step="0.01"
                value={fundAmount}
                onChange={(event) => setFundAmount(event.target.value)}
                className="mt-2"
              />
              {insufficientFundBalance && (
                <p className="text-xs text-destructive mt-2">
                  Insufficient balance for this amount.
                </p>
              )}
            </div>

            <div className="flex items-end gap-3 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={
                  !fundAmountValid ||
                  insufficientFundBalance ||
                  isApprovingFunds ||
                  !needsFundApproval
                }
                onClick={handleApproveFunds}
              >
                {isApprovingFunds
                  ? "Approving…"
                  : needsFundApproval
                  ? "Approve USDC"
                  : "Approved"}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={
                  !fundAmountValid ||
                  insufficientFundBalance ||
                  !fundApprovalReady ||
                  isAddingFunds
                }
                onClick={handleAddMatchingFunds}
              >
                {isAddingFunds ? "Adding…" : "Add funds"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Matching funds are held in the pool until you create the next round.
            Approval is required once per amount increase.
          </p>
        </div>
      </div>
    </section>
  );
}
