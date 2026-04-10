"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LEVELS,
  STORAGE_KEY_MAX_UNLOCKED,
  type LevelId,
} from "@/lib/game/levels";

type Vec2 = { x: number; y: number };

type Enemy = {
  pos: Vec2;
  vel: Vec2;
  hp: number;
  maxHp: number;
  r: number;
  coreR: number;
};

type Bolt = { pos: Vec2; vel: Vec2; life: number };

type Particle = { pos: Vec2; vel: Vec2; life: number; hue: number };

const PLAYER_R = 15;
const BOLT_SPEED = 520;
const BOLT_LIFE = 0.85;
const FIRE_COOLDOWN_MS = 280;
const FRICTION = 0.88;
const TAP_DIST = 22;
const SWIPE_MIN = 28;
const PLAYER_MAX_HP = 100;

function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function spawnEnemies(
  w: number,
  h: number,
  level: LevelId,
  padding: number,
): Enemy[] {
  const cfg = LEVELS[level];
  const list: Enemy[] = [];
  const r = 26 + (level === 2 ? 4 : 0);
  const coreR = r * cfg.coreRadiusRatio;
  for (let i = 0; i < cfg.enemyCount; i++) {
    const angle = (i / cfg.enemyCount) * Math.PI * 2 + 0.4;
    const cx = w / 2 + Math.cos(angle) * (w * 0.35);
    const cy = h / 2 + Math.sin(angle) * (h * 0.32);
    list.push({
      pos: {
        x: clamp(cx, padding + r, w - padding - r),
        y: clamp(cy, padding + r, h - padding - r),
      },
      vel: { x: 0, y: 0 },
      hp: cfg.enemyHp,
      maxHp: cfg.enemyHp,
      r,
      coreR,
    });
  }
  return list;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState<LevelId>(1);
  const [maxUnlocked, setMaxUnlocked] = useState<LevelId>(1);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [banner, setBanner] = useState<string | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const endedRef = useRef(false);

  const stateRef = useRef({
    player: { x: 0, y: 0 } as Vec2,
    vel: { x: 0, y: 0 } as Vec2,
    hp: PLAYER_MAX_HP,
    enemies: [] as Enemy[],
    bolts: [] as Bolt[],
    particles: [] as Particle[],
    lastFire: 0,
    pulseAcc: 0,
    pulseRing: 0,
    w: 360,
    h: 520,
  });

  const touchRef = useRef({
    active: false,
    x0: 0,
    y0: 0,
    t0: 0,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MAX_UNLOCKED);
      if (raw === "2") setMaxUnlocked(2);
    } catch {
      /* ignore */
    }
  }, []);

  const resetLevel = useCallback((id: LevelId) => {
    const c = canvasRef.current;
    const w = c?.width ?? 360;
    const h = c?.height ?? 520;
    const pad = 36;
    const cx = w / 2;
    const cy = h * 0.72;
    endedRef.current = false;
    stateRef.current = {
      player: { x: cx, y: cy },
      vel: { x: 0, y: 0 },
      hp: PLAYER_MAX_HP,
      enemies: spawnEnemies(w, h, id, pad),
      bolts: [],
      particles: [],
      lastFire: 0,
      pulseAcc: 0,
      pulseRing: 0,
      w,
      h,
    };
    setPhase("playing");
    setBanner(null);
  }, []);

  useEffect(() => {
    resetLevel(level);
  }, [level, resetLevel]);

  const applySwipeImpulse = (dx: number, dy: number) => {
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const force = clamp(Math.hypot(dx, dy) * 0.14, 2.8, 18);
    stateRef.current.vel.x += nx * force;
    stateRef.current.vel.y += ny * force;
    for (let i = 0; i < 10; i++) {
      stateRef.current.particles.push({
        pos: { ...stateRef.current.player },
        vel: {
          x: (Math.random() - 0.5) * 120 + nx * 40,
          y: (Math.random() - 0.5) * 120 + ny * 40,
        },
        life: 0.35 + Math.random() * 0.25,
        hue: 280 + Math.random() * 60,
      });
    }
  };

  const tryFireToward = (tx: number, ty: number) => {
    if (phaseRef.current !== "playing") return;
    const now = performance.now();
    if (now - stateRef.current.lastFire < FIRE_COOLDOWN_MS) return;
    const p = stateRef.current.player;
    const dx = tx - p.x;
    const dy = ty - p.y;
    const len = Math.hypot(dx, dy) || 1;
    stateRef.current.bolts.push({
      pos: { ...p },
      vel: { x: (dx / len) * BOLT_SPEED, y: (dy / len) * BOLT_SPEED },
      life: BOLT_LIFE,
    });
    stateRef.current.lastFire = now;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const cw = canvasRef.current?.width ?? 360;
    const ch = canvasRef.current?.height ?? 520;
    const scaleX = cw / rect.width;
    const scaleY = ch / rect.height;
    touchRef.current = {
      active: true,
      x0: (e.clientX - rect.left) * scaleX,
      y0: (e.clientY - rect.top) * scaleY,
      t0: performance.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchRef.current.active) return;
    touchRef.current.active = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const cw = canvasRef.current?.width ?? 360;
    const ch = canvasRef.current?.height ?? 520;
    const scaleX = cw / rect.width;
    const scaleY = ch / rect.height;
    const gx = (e.clientX - rect.left) * scaleX;
    const gy = (e.clientY - rect.top) * scaleY;
    const dx = gx - touchRef.current.x0;
    const dy = gy - touchRef.current.y0;
    const d = Math.hypot(dx, dy);
    if (d < TAP_DIST) {
      tryFireToward(gx, gy);
    } else if (d >= SWIPE_MIN) {
      applySwipeImpulse(dx, dy);
    }
  };

  useEffect(() => {
    let frame = 0;
    const cfg = LEVELS[level];

    const drawFrame = (
      ctx: CanvasRenderingContext2D,
      s: typeof stateRef.current,
      lvl: LevelId,
    ) => {
      const w = s.w;
      const h = s.h;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#070814");
      g.addColorStop(0.5, "#0c1028");
      g.addColorStop(1, "#12081c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(0,255,200,0.07)";
      ctx.lineWidth = 1;
      const grid = 44;
      for (let x = 0; x < w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (cfg.pulseEnabled && s.pulseRing > 0) {
        ctx.strokeStyle = `rgba(255, 0, 180, ${s.pulseRing * 0.45})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 95 * (1.2 - s.pulseRing * 0.2), 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const en of s.enemies) {
        ctx.beginPath();
        ctx.arc(en.pos.x, en.pos.y, en.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(30,40,70,0.85)";
        ctx.fill();
        ctx.strokeStyle = "rgba(120, 200, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(en.pos.x, en.pos.y, en.coreR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 200, 0.75)";
        ctx.fill();
        const pct = en.hp / en.maxHp;
        ctx.fillStyle = "rgba(255,60,120,0.9)";
        ctx.fillRect(en.pos.x - 22, en.pos.y - en.r - 12, 44 * pct, 4);
      }

      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, PLAYER_R, 0, Math.PI * 2);
      const pg = ctx.createRadialGradient(
        s.player.x,
        s.player.y,
        2,
        s.player.x,
        s.player.y,
        PLAYER_R,
      );
      pg.addColorStop(0, "#ff2fd0");
      pg.addColorStop(1, "#4b0082");
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = "rgba(180, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (const b of s.bolts) {
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, 4, 0, Math.PI * 2);
        ctx.shadowColor = "#00fff0";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(0, 255, 240, 0.95)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const p of s.particles) {
        ctx.globalAlpha = clamp(p.life * 3, 0, 1);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, 1)`;
        ctx.fillRect(p.pos.x - 1.5, p.pos.y - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(8, 8, w - 16, 36);
      ctx.fillStyle = "#7dffec";
      ctx.font = '600 13px "DM Sans", system-ui, sans-serif';
      ctx.fillText(`SECTOR ${lvl} — ${cfg.name.toUpperCase()}`, 16, 22);
      ctx.fillStyle = "#ff6ec7";
      ctx.font = '11px "DM Sans", system-ui, sans-serif';
      ctx.fillText("Swipe field to move · Tap to fire bolt", 16, 36);

      const hpw = (w - 32) * (s.hp / PLAYER_MAX_HP);
      ctx.fillStyle = "rgba(255,0,120,0.25)";
      ctx.fillRect(16, h - 28, w - 32, 8);
      ctx.fillStyle = "#ff3b9a";
      ctx.fillRect(16, h - 28, hpw, 8);
    };

    const tick = () => {
      const s = stateRef.current;
      const dt = 1 / 60;
      const playing = phaseRef.current === "playing";

      if (playing) {
        s.player.x += s.vel.x * dt;
        s.player.y += s.vel.y * dt;
        s.vel.x *= FRICTION;
        s.vel.y *= FRICTION;

        const pad = PLAYER_R + 8;
        s.player.x = clamp(s.player.x, pad, s.w - pad);
        s.player.y = clamp(s.player.y, pad, s.h - pad);

        for (const en of s.enemies) {
          const dx = s.player.x - en.pos.x;
          const dy = s.player.y - en.pos.y;
          const len = Math.hypot(dx, dy) || 1;
          en.vel.x = (dx / len) * cfg.enemySpeed;
          en.vel.y = (dy / len) * cfg.enemySpeed;
          en.pos.x += en.vel.x * dt;
          en.pos.y += en.vel.y * dt;
          if (dist(en.pos, s.player) < en.r + PLAYER_R - 2) {
            s.hp -= 38 * dt;
          }
        }

        if (cfg.pulseEnabled && cfg.pulseIntervalMs > 0) {
          s.pulseAcc += (1000 / 60) * dt * 60;
          if (s.pulseAcc >= cfg.pulseIntervalMs) {
            s.pulseAcc = 0;
            s.pulseRing = 1;
            const cx = s.w / 2;
            const cy = s.h / 2;
            const r = Math.hypot(s.player.x - cx, s.player.y - cy);
            if (r < 95) {
              s.hp -= cfg.pulseDamage;
            }
          }
        }
        if (s.pulseRing > 0) {
          s.pulseRing = Math.max(0, s.pulseRing - dt * 1.4);
        }

        outer: for (let bi = s.bolts.length - 1; bi >= 0; bi--) {
          const b = s.bolts[bi]!;
          b.pos.x += b.vel.x * dt;
          b.pos.y += b.vel.y * dt;
          b.life -= dt;
          if (
            b.life <= 0 ||
            b.pos.x < 0 ||
            b.pos.y < 0 ||
            b.pos.x > s.w ||
            b.pos.y > s.h
          ) {
            s.bolts.splice(bi, 1);
            continue;
          }
          for (let ei = s.enemies.length - 1; ei >= 0; ei--) {
            const en = s.enemies[ei]!;
            const d = dist(b.pos, en.pos);
            const coreHit = d < en.coreR;
            const bodyHit = d < en.r;
            if (bodyHit) {
              const dmg = coreHit ? 26 : 11;
              en.hp -= dmg;
              for (let k = 0; k < 8; k++) {
                s.particles.push({
                  pos: { ...b.pos },
                  vel: {
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                  },
                  life: 0.2 + Math.random() * 0.2,
                  hue: coreHit ? 160 : 320,
                });
              }
              s.bolts.splice(bi, 1);
              if (en.hp <= 0) s.enemies.splice(ei, 1);
              continue outer;
            }
          }
        }

        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i]!;
          p.life -= dt;
          p.pos.x += p.vel.x * dt;
          p.pos.y += p.vel.y * dt;
          if (p.life <= 0) s.particles.splice(i, 1);
        }

        if (!endedRef.current && s.hp <= 0) {
          endedRef.current = true;
          setPhase("lost");
          setBanner("SIGNAL LOST — tap Restart sector");
        } else if (!endedRef.current && s.enemies.length === 0) {
          endedRef.current = true;
          setPhase("won");
          if (level === 1) {
            try {
              localStorage.setItem(STORAGE_KEY_MAX_UNLOCKED, "2");
            } catch {
              /* ignore */
            }
            setMaxUnlocked(2);
            setBanner("SECTOR 2 UNLOCKED — Overload ready");
          } else {
            setBanner("SECTOR CLEARED — legendary hunt");
          }
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) drawFrame(ctx, s, level);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [level]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        width={360}
        height={520}
        className="w-full h-auto touch-none rounded-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(0,255,240,0.12)] bg-[#070814]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-fuchsia-500/50 bg-fuchsia-950/40 px-4 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-900/50"
          onClick={() => resetLevel(level)}
        >
          Restart sector
        </button>
        {maxUnlocked >= 2 && (
          <button
            type="button"
            disabled={level === 1}
            className="rounded-lg border border-cyan-400/50 bg-cyan-950/40 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-40"
            onClick={() => setLevel(1)}
          >
            Sector 1
          </button>
        )}
        {maxUnlocked >= 2 && (
          <button
            type="button"
            disabled={level === 2}
            className="rounded-lg border border-emerald-400/50 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40"
            onClick={() => setLevel(2)}
          >
            Sector 2
          </button>
        )}
      </div>
      {banner && (
        <p className="mt-3 text-center text-sm font-medium tracking-wide text-cyan-200/95">
          {banner}
        </p>
      )}
      {phase === "won" && (
        <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-fuchsia-300/90">
          {level === 1
            ? "Calibration complete — unlocks Overload"
            : "Overload cleared"}
        </p>
      )}
    </div>
  );
}
