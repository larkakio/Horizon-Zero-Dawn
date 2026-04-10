import { GameCanvas } from "@/components/game/GameCanvas";
import { WalletBar } from "@/components/WalletBar";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-8 px-4 pb-16 pt-8 sm:pt-12">
      <header className="text-center">
        <p className="mb-2 font-[family-name:var(--font-orbitron)] text-xs uppercase tracking-[0.35em] text-cyan-300/80">
          Base · tribal circuits
        </p>
        <h1 className="animate-pulse-glow font-[family-name:var(--font-orbitron)] text-3xl font-black uppercase tracking-tight text-transparent sm:text-4xl bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-400">
          Neon Frontier
        </h1>
        <p className="mt-2 text-sm text-cyan-100/70">
          Machine Hunt — swipe the arena to drift, tap to fire ion bolts. Core
          hits deal more damage.
        </p>
      </header>

      <WalletBar />

      <section aria-label="Game">
        <GameCanvas />
      </section>

      <footer className="text-center text-[11px] uppercase tracking-widest text-white/25">
        Inspired by neo-tribal sci-fi · English UI · Base L2
      </footer>
    </main>
  );
}
