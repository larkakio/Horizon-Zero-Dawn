import type { Hex } from "viem";
import { Attribution } from "ox/erc8021";

/**
 * ERC-8021 data suffix for Builder Code attribution (Base docs).
 * Prefer NEXT_PUBLIC_BUILDER_CODE (e.g. bc_… from base.dev).
 * Optional NEXT_PUBLIC_BUILDER_CODE_SUFFIX: raw 0x hex override.
 */
export function getCheckInDataSuffix(): Hex | undefined {
  const raw = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (raw && raw.startsWith("0x") && raw.length > 2) {
    return raw as Hex;
  }
  const code = process.env.NEXT_PUBLIC_BUILDER_CODE?.trim();
  if (!code) return undefined;
  try {
    return Attribution.toDataSuffix({ codes: [code] });
  } catch {
    return undefined;
  }
}
