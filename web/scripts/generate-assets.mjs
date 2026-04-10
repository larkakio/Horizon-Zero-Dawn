/**
 * Generates public/icon.jpg (1:1, max 1024) and public/thumbnail.jpg (~1.91:1) under 1MB each.
 * Run: node scripts/generate-assets.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0618"/>
      <stop offset="50%" style="stop-color:#12082a"/>
      <stop offset="100%" style="stop-color:#1a0a32"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff2fd0"/>
      <stop offset="50%" style="stop-color:#00fff0"/>
      <stop offset="100%" style="stop-color:#39ff14"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="380" fill="none" stroke="url(#ring)" stroke-width="6" opacity="0.35"/>
  <path d="M512 220 L680 780 L344 780 Z" fill="none" stroke="url(#ring)" stroke-width="14" filter="url(#glow)" stroke-linejoin="round"/>
  <circle cx="512" cy="420" r="48" fill="#00fff0" opacity="0.9"/>
  <text x="512" y="900" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="56" fill="#7dffec" opacity="0.85">NEON FRONTIER</text>
</svg>`;

const thumbSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1910" height="1000" viewBox="0 0 1910 1000">
  <defs>
    <linearGradient id="tb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#050510"/>
      <stop offset="100%" style="stop-color:#1a1038"/>
    </linearGradient>
    <linearGradient id="tr" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff2fd0"/>
      <stop offset="100%" style="stop-color:#00fff0"/>
    </linearGradient>
  </defs>
  <rect width="1910" height="1000" fill="url(#tb)"/>
  <rect x="40" y="40" width="1830" height="920" rx="24" fill="none" stroke="url(#tr)" stroke-width="3" opacity="0.5"/>
  <text x="120" y="220" font-family="Arial Black,sans-serif" font-size="120" fill="url(#tr)">NEON FRONTIER</text>
  <text x="120" y="380" font-family="Arial,sans-serif" font-size="48" fill="#7dffec" opacity="0.9">Machine Hunt · Base L2</text>
  <text x="120" y="480" font-family="Arial,sans-serif" font-size="36" fill="#ff6ec7" opacity="0.85">Swipe the field · Tap to fire</text>
  <circle cx="1500" cy="500" r="200" fill="none" stroke="url(#tr)" stroke-width="8" opacity="0.6"/>
  <circle cx="1500" cy="500" r="40" fill="#00fff0"/>
</svg>`;

async function toJpegUnder1Mb(svg, outPath, startQuality = 88) {
  let q = startQuality;
  let buf;
  for (; q >= 40; q -= 4) {
    buf = await sharp(Buffer.from(svg)).jpeg({ quality: q, mozjpeg: true }).toBuffer();
    if (buf.length <= 1024 * 1024) break;
  }
  writeFileSync(outPath, buf);
  return buf.length;
}

const iconPath = join(publicDir, "icon.jpg");
const thumbPath = join(publicDir, "thumbnail.jpg");

const iconBytes = await toJpegUnder1Mb(iconSvg, iconPath);
const thumbBytes = await toJpegUnder1Mb(thumbSvg, thumbPath);

console.log(`Wrote ${iconPath} (${iconBytes} bytes)`);
console.log(`Wrote ${thumbPath} (${thumbBytes} bytes)`);
