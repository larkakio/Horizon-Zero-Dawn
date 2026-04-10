import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { injected, walletConnect, baseAccount } from "@wagmi/connectors";
import { base, mainnet } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
  injected({ shimDisconnect: true }),
  baseAccount({
    appName: "Neon Frontier",
  }),
  ...(projectId
    ? [
        walletConnect({
          projectId,
          showQrModal: true,
          metadata: {
            name: "Neon Frontier",
            description: "Neon Frontier — Machine Hunt",
            url:
              process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
            icons: ["/icon.jpg"],
          },
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [base, mainnet],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
