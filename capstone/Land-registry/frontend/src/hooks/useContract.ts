"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi";
import { useState, useCallback, useEffect } from "react";
import { LAND_REGISTRY_ABI, LAND_REGISTRY_ADDRESS, ADMIN_ROLE, REGISTRAR_ROLE } from "@/lib/contract";
import { TARGET_CHAIN } from "@/lib/wagmi";
import type { TxState } from "@/types";

// ─── Base hook returning typed contract config ────────────────────────────────

function contractArgs() {
  return {
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    chainId: TARGET_CHAIN.id,
  } as const;
}

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useLand(landId: bigint | undefined) {
  return useReadContract({
    ...contractArgs(),
    functionName: "getLand",
    args: landId !== undefined ? [landId] : undefined,
    query: { enabled: landId !== undefined, refetchInterval: 10000 },
  });
}

export function useOwnerLands(owner: `0x${string}` | undefined) {
  return useReadContract({
    ...contractArgs(),
    functionName: "getLandsByOwner",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner, refetchInterval: 10000 },
  });
}

export function useTransferHistory(landId: bigint | undefined) {
  return useReadContract({
    ...contractArgs(),
    functionName: "getTransferHistory",
    args: landId !== undefined ? [landId] : undefined,
    query: { enabled: landId !== undefined, refetchInterval: 10000 },
  });
}

export function usePendingTransfer(landId: bigint | undefined) {
  return useReadContract({
    ...contractArgs(),
    functionName: "getPendingTransfer",
    args: landId !== undefined ? [landId] : undefined,
    query: { enabled: landId !== undefined, refetchInterval: 10000 },
  });
}

export function useTotalLands() {
  return useReadContract({
    ...contractArgs(),
    functionName: "totalLands",
    query: { refetchInterval: 10000 },
  });
}

export function useIsAdmin(account: `0x${string}` | undefined) {
  return useReadContract({
    ...contractArgs(),
    functionName: "hasRole",
    args: account ? [ADMIN_ROLE, account] : undefined,
    query: { enabled: !!account },
  });
}

export function useIsRegistrar(account: `0x${string}` | undefined) {
  return useReadContract({
    ...contractArgs(),
    functionName: "hasRole",
    args: account ? [REGISTRAR_ROLE, account] : undefined,
    query: { enabled: !!account },
  });
}

export function useIsPaused() {
  return useReadContract({
    ...contractArgs(),
    functionName: "paused",
  });
}

// ─── Write hooks (generic pattern) ───────────────────────────────────────────

export function useContractWrite() {
  const { writeContractAsync } = useWriteContract();
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [receiptHash, setReceiptHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: receiptHash,
    chainId: TARGET_CHAIN.id,
  });

  // Transition to "success" once the receipt confirms
  useEffect(() => {
    if (isSuccess && txState.status === "confirming") {
      setTxState(prev => ({
        ...prev,
        status: "success",
        message: "Transaction confirmed!",
      }));
    }
  }, [isSuccess, txState.status]);

  const execute = useCallback(
    async (
      functionName: string,
      args: unknown[],
      onSuccess?: (hash: `0x${string}`) => void
    ) => {
      try {
        setTxState({ status: "pending", message: "Waiting for wallet..." });

        const hash = await writeContractAsync({
          ...contractArgs(),
          functionName: functionName as never,
          args: args as never,
        });

        setReceiptHash(hash);
        setTxState({ status: "confirming", hash, message: "Transaction sent. Confirming..." });
        onSuccess?.(hash);
        return hash;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        setTxState({ status: "error", message: msg });
        throw err;
      }
    },
    [writeContractAsync]
  );

  const reset = useCallback(() => {
    setTxState({ status: "idle" });
    setReceiptHash(undefined);
  }, []);

  return { execute, txState, isConfirming, reset };
}

// ─── Convenience role hook ────────────────────────────────────────────────────

export function useRoles() {
  const { address } = useAccount();
  const { data: isAdmin } = useIsAdmin(address);
  const { data: isRegistrar } = useIsRegistrar(address);
  return {
    address,
    isAdmin: !!isAdmin,
    isRegistrar: !!isRegistrar,
    canRegister: !!isAdmin || !!isRegistrar,
  };
}
