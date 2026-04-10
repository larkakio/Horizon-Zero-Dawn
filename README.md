# Neon Frontier — Machine Hunt (Base)

Horizon-inspired **neon cyberpunk** mobile web game: swipe the arena to move, tap to fire ion bolts at machine constructs with weak-point cores. **Sector 2** unlocks after clearing **Sector 1** (stored in `localStorage`). **Daily check-in** uses a Foundry **`CheckIn`** contract on **Base mainnet** with **ERC-8021 Builder Code** attribution via `ox` (`dataSuffix` on `checkIn`).

## Repository layout

| Path | Purpose |
|------|---------|
| [`web/`](web/) | **Next.js (App Router)** — Vercel **Root Directory** = `web` |
| [`src/CheckIn.sol`](src/CheckIn.sol) | Daily check-in contract (`msg.value` must be 0) |
| [`test/CheckIn.t.sol`](test/CheckIn.t.sol) | Foundry tests |
| [`script/DeployCheckIn.s.sol`](script/DeployCheckIn.s.sol) | Deploy script |

**Deployed `CheckIn` (Base mainnet):** [`0x0A138315a532B294da09Df49C2C1861a8a996D35`](https://basescan.org/address/0x0A138315a532B294da09Df49C2C1861a8a996D35) — deployment tx [`0xd4e1d1bdcc96f604e8a6f14319c92f596fd6d1bd35d7fd05cdadf233ee793975`](https://basescan.org/tx/0xd4e1d1bdcc96f604e8a6f14319c92f596fd6d1bd35d7fd05cdadf233ee793975).

## Base App

- Standard **web app + wallet** ([migrate to standard web app](https://docs.base.org/apps/quickstart/migrate-to-standard-web-app)). No Farcaster mini-app SDK required.
- Register the app on [base.dev](https://www.base.dev) and set **`NEXT_PUBLIC_BASE_APP_ID`** (rendered as `<meta name="base:app_id" />`).
- **Builder Codes**: set `NEXT_PUBLIC_BUILDER_CODE` from base.dev; transactions append attribution per [Builder Codes — app developers](https://docs.base.org/base-chain/builder-codes/app-developers).

## Environment (`web/.env`)

Copy [`web/.env.example`](web/.env.example) to `web/.env.local` and fill in remaining keys (contract address is already set in `.env.example` for this deployment):

- **`NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS`** — `CheckIn` on Base (see deployed address above).
- **`NEXT_PUBLIC_BUILDER_CODE`** — from base.dev (optional `NEXT_PUBLIC_BUILDER_CODE_SUFFIX` hex override).
- **`NEXT_PUBLIC_SITE_URL`** — production URL (also used as `metadataBase` for OG images).
- Optional **`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`** for WalletConnect.

## Smart contract

```bash
forge test
forge build
# Deploy (set RPC and key via env or flags):
forge script script/DeployCheckIn.s.sol:DeployCheckIn --rpc-url $BASE_RPC_URL --broadcast
```

`NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS` is set in [`web/.env.example`](web/.env.example); create `web/.env.local` from it for local dev (gitignored).

## Web app

From the **repository root**, `package.json` forwards scripts into `web/`:

```bash
npm install --prefix web   # first time, from root
npm run dev                # same as: cd web && npm run dev
```

Or work only inside `web/`:

```bash
cd web
npm install
npm run build
npm run lint
npm run dev
```

**Brand assets** (JPG, ≤1MB): `npm run generate:assets` writes `public/icon.jpg` (1:1) and `public/thumbnail.jpg` (~1.91:1).

## Verification checklist

- `forge test` — all tests pass.
- `cd web && npm run build` — TypeScript + Next build succeed.
- In-game: finish Sector 1 → Sector 2 unlocks (and persists after refresh).
- Wallet: wrong-network banner on non-Base; **Daily check-in** switches to Base then submits `checkIn` with Builder `dataSuffix` when configured.

## Legal note

UI uses an original **“Neon Frontier”** theme (tribal hunter vs. machines). It is not affiliated with or endorsed by any commercial game franchise.
