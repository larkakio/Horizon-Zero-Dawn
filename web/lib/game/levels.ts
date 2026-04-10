export type LevelId = 1 | 2;

export interface LevelConfig {
  id: LevelId;
  name: string;
  enemyCount: number;
  enemySpeed: number;
  enemyHp: number;
  coreRadiusRatio: number;
  pulseEnabled: boolean;
  pulseIntervalMs: number;
  pulseDamage: number;
}

export const LEVELS: Record<LevelId, LevelConfig> = {
  1: {
    id: 1,
    name: "Calibration",
    enemyCount: 2,
    enemySpeed: 38,
    enemyHp: 55,
    coreRadiusRatio: 0.32,
    pulseEnabled: false,
    pulseIntervalMs: 0,
    pulseDamage: 0,
  },
  2: {
    id: 2,
    name: "Overload",
    enemyCount: 4,
    enemySpeed: 58,
    enemyHp: 75,
    coreRadiusRatio: 0.28,
    pulseEnabled: true,
    pulseIntervalMs: 4200,
    pulseDamage: 14,
  },
};

export const STORAGE_KEY_MAX_UNLOCKED = "neon-frontier-max-level";
