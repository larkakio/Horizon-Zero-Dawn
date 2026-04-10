"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { isAddress } from "viem";
import { checkInAbi } from "@/lib/check-in-abi";
import { getCheckInDataSuffix } from "@/lib/builder-code";

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { connectors, connect, isPending: connectPending } = useConnect();
  const { switchChainAsync, isPending: switchPending } = useSwitchChain();
  const { writeContractAsync, isPending: txPending } = useWriteContract();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const contractAddress = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS as
    | `0x${string}`
    | undefined;

  const contractReady = contractAddress && isAddress(contractAddress);

  const wrongNetwork = isConnected && chainId !== base.id;

  const dataSuffix = useMemo(() => getCheckInDataSuffix(), []);

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  async function ensureBase() {
    if (chainId === base.id) return;
    await switchChainAsync({ chainId: base.id });
  }

  async function handleCheckIn() {
    setMsg(null);
    if (!contractReady) {
      setMsg("Set NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS after deploy.");
      return;
    }
    try {
      await ensureBase();
      await writeContractAsync({
        address: contractAddress,
        abi: checkInAbi,
        functionName: "checkIn",
        chainId: base.id,
        ...(dataSuffix ? { dataSuffix } : {}),
      });
      setMsg("Check-in confirmed on Base.");
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string };
      setMsg(err.shortMessage ?? err.message ?? "Transaction failed");
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {wrongNetwork && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-950/50 px-4 py-3 text-sm text-amber-100"
        >
          <span>Wrong network — switch to Base for check-in.</span>
          <button
            type="button"
            className="rounded-lg bg-amber-400/20 px-3 py-1.5 font-semibold text-amber-50 hover:bg-amber-400/30"
            disabled={switchPending}
            onClick={() => switchChainAsync({ chainId: base.id })}
          >
            {switchPending ? "Switching…" : "Switch to Base"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!isConnected ? (
          <>
            <button
              type="button"
              className="rounded-xl border border-cyan-400/50 bg-gradient-to-r from-fuchsia-600/40 to-cyan-600/30 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(0,255,240,0.25)]"
              onClick={() => setSheetOpen(true)}
              disabled={connectPending}
            >
              {connectPending ? "Connecting…" : "Connect wallet"}
            </button>
          </>
        ) : (
          <>
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-cyan-100/90">
              {shortAddr}
            </span>
            <button
              type="button"
              className="rounded-lg border border-fuchsia-500/40 px-3 py-2 text-sm text-fuchsia-200"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
            <button
              type="button"
              className="rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50"
              disabled={txPending || !contractReady}
              onClick={handleCheckIn}
            >
              {txPending ? "Signing…" : "Daily check-in"}
            </button>
          </>
        )}
      </div>

      {msg && (
        <p className="text-center text-xs text-cyan-200/80">{msg}</p>
      )}

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-[#0a0d1a] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-center text-sm font-semibold text-cyan-100">
              Choose a wallet
            </p>
            <div className="flex flex-col gap-2">
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
                  disabled={connectPending}
                  onClick={() => {
                    connect({ connector: c });
                    setSheetOpen(false);
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg py-2 text-sm text-white/50"
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
