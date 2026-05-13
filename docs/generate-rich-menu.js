/**
 * Rich Menu PNG Generator
 * Canvas: 2500 x 1686 px, 3 columns x 2 rows
 *
 * Run:  node docs/generate-rich-menu.js
 * Requires: npm install canvas   (in the docs/ folder or project root)
 *
 * On Windows, if canvas fails to install, you need either:
 *   - npm install --global windows-build-tools  (run as admin in PowerShell)
 *   - OR use WSL
 *   - OR design the PNG in Figma using the spec in rich-menu-spec.md
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const W = 2500;
const H = 1686;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG_COLOR    = '#1B4332';
const CARD_COLOR  = '#2D6A4F';
const ACCENT      = '#52B788';
const WHITE       = '#FFFFFF';
const SOFT_WHITE  = '#B7E4C7';
const BADGE_RED   = '#FF3B30';
const BORDER      = 'rgba(82,183,136,0.3)';

// ── Grid ──────────────────────────────────────────────────────────────────────
const COLS = 3;
const ROWS = 2;
const GAP  = 12;
const CELL_W = Math.floor((W - GAP * (COLS + 1)) / COLS);
const CELL_H = Math.floor((H - GAP * (ROWS + 1)) / ROWS);
const RADIUS = 28;

// ── Button definitions ────────────────────────────────────────────────────────
const buttons = [
  // Row 0
  { col: 0, row: 0, label: 'Leave Request',       subtitle: 'Apply for leave',        icon: drawCalendarPlus  },
  { col: 1, row: 0, label: 'OT Request',          subtitle: 'Overtime request',       icon: drawClockArrow    },
  { col: 2, row: 0, label: 'History',             subtitle: 'View your requests',     icon: drawHistory       },
  // Row 1
  { col: 0, row: 1, label: 'Leave Balance',       subtitle: 'Remaining days',         icon: drawPieChart      },
  { col: 1, row: 1, label: 'Manager Portal',       subtitle: 'Admin dashboard',        icon: drawHeadset       },
  { col: 2, row: 1, label: 'Announcement',        subtitle: 'Latest updates',         icon: drawMegaphone, badge: 'Updates' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = BG_COLOR;
ctx.fillRect(0, 0, W, H);

// Dot grid pattern
ctx.fillStyle = 'rgba(255,255,255,0.05)';
for (let x = 40; x < W; x += 60) {
  for (let y = 40; y < H; y += 60) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Corner decorative circles
ctx.fillStyle = 'rgba(255,255,255,0.08)';
[[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy]) => {
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();
});

// Draw each button
buttons.forEach(btn => {
  const x = GAP + btn.col * (CELL_W + GAP);
  const y = GAP + btn.row * (CELL_H + GAP);
  drawCard(ctx, x, y, CELL_W, CELL_H, btn);
});

// ── Save ──────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'rich-menu.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Rich menu PNG saved to: ${outPath}`);
console.log(`Dimensions: ${W}x${H}px`);

// ── Card renderer ─────────────────────────────────────────────────────────────
function drawCard(ctx, x, y, w, h, btn) {
  // Card background
  ctx.fillStyle = CARD_COLOR;
  roundRect(ctx, x, y, w, h, RADIUS);
  ctx.fill();

  // Card border
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, RADIUS);
  ctx.stroke();

  // Accent top bar
  ctx.fillStyle = ACCENT;
  roundRect(ctx, x, y, w, 10, [RADIUS, RADIUS, 0, 0]);
  ctx.fill();

  // Icon (centered, upper half)
  const iconSize = Math.floor(h * 0.22);
  const iconX = x + w / 2;
  const iconY = y + h * 0.38;
  btn.icon(ctx, iconX, iconY, iconSize);

  // Label
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${Math.floor(h * 0.095)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.label, x + w / 2, y + h * 0.68);

  // Subtitle
  ctx.fillStyle = SOFT_WHITE;
  ctx.font = `${Math.floor(h * 0.065)}px Arial, sans-serif`;
  ctx.fillText(btn.subtitle, x + w / 2, y + h * 0.80);

  // Badge
  if (btn.badge) {
    const bx = x + w - 90;
    const by = y + 50;
    const bw = 140;
    const bh = 52;

    ctx.fillStyle = BADGE_RED;
    roundRect(ctx, bx, by, bw, bh, 26);
    ctx.fill();

    ctx.fillStyle = WHITE;
    ctx.font = `bold 30px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.badge, bx + bw / 2, by + bh / 2);
  }
}

// ── Icon drawers (thin outline style, white, ~Lucide/Phosphor) ───────────────

function drawCalendarPlus(ctx, cx, cy, size) {
  const s = size * 0.5;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Calendar body
  ctx.beginPath();
  ctx.roundRect(cx - s, cy - s * 0.7, s * 2, s * 2, size * 0.1);
  ctx.stroke();

  // Top bar
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.2);
  ctx.lineTo(cx + s, cy - s * 0.2);
  ctx.stroke();

  // Calendar pins
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.9);
  ctx.lineTo(cx - s * 0.5, cy - s * 0.5);
  ctx.moveTo(cx + s * 0.5, cy - s * 0.9);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.5);
  ctx.stroke();

  // Plus symbol
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.1);
  ctx.lineTo(cx, cy + s * 0.9);
  ctx.moveTo(cx - s * 0.4, cy + s * 0.5);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.5);
  ctx.stroke();
}

function drawClockArrow(ctx, cx, cy, size) {
  const r = size * 0.5;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Clock face
  ctx.beginPath();
  ctx.arc(cx - size * 0.1, cy, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // Clock hands
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.1, cy);
  ctx.lineTo(cx - size * 0.1, cy - r * 0.5);
  ctx.moveTo(cx - size * 0.1, cy);
  ctx.lineTo(cx - size * 0.1 + r * 0.4, cy + r * 0.2);
  ctx.stroke();

  // Arrow (top-right)
  const ax = cx + r * 0.6;
  const ay = cy - r * 0.4;
  ctx.beginPath();
  ctx.moveTo(ax - r * 0.3, ay);
  ctx.lineTo(ax + r * 0.3, ay);
  ctx.lineTo(ax + r * 0.1, ay - r * 0.3);
  ctx.stroke();
}

function drawHistory(ctx, cx, cy, size) {
  const s = size * 0.5;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Three lines
  const lines = [-s * 0.5, 0, s * 0.5];
  lines.forEach(offsetY => {
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + offsetY);
    ctx.lineTo(cx + s * 0.2, cy + offsetY);
    ctx.stroke();
  });

  // Checkmark on the right
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.35, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.5);
  ctx.lineTo(cx + s, cy - s * 0.1);
  ctx.stroke();
}

function drawPieChart(ctx, cx, cy, size) {
  const r = size * 0.5;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';

  // Full circle outline
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 3/4 filled arc (simulates "remaining days")
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r * 0.92, -Math.PI / 2, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Center line for "pie slice"
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - r);
  ctx.stroke();
}

function drawHeadset(ctx, cx, cy, size) {
  const r = size * 0.45;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Head arc
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.2, r, Math.PI, 0, false);
  ctx.stroke();

  // Left ear cup
  ctx.beginPath();
  ctx.arc(cx - r, cy - r * 0.2, r * 0.25, Math.PI * 0.5, Math.PI * 1.5, true);
  ctx.stroke();

  // Right ear cup
  ctx.beginPath();
  ctx.arc(cx + r, cy - r * 0.2, r * 0.25, -Math.PI * 0.5, Math.PI * 0.5, false);
  ctx.stroke();

  // Mic arm
  ctx.beginPath();
  ctx.moveTo(cx + r, cy + r * 0.05);
  ctx.lineTo(cx + r, cy + r * 0.6);
  ctx.arc(cx + r * 0.7, cy + r * 0.6, r * 0.3, 0, Math.PI, false);
  ctx.stroke();
}

function drawMegaphone(ctx, cx, cy, size) {
  const s = size * 0.5;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Megaphone body (trapezoid)
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.1, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.9, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.9, cy - s * 0.7);
  ctx.closePath();
  ctx.stroke();

  // Handle box
  ctx.beginPath();
  ctx.roundRect(cx - s * 0.55, cy - s * 0.3, s * 0.45, s * 0.6, size * 0.05);
  ctx.stroke();

  // Sound waves
  ctx.beginPath();
  ctx.arc(cx - s * 0.6, cy, s * 0.5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
}

// ── Polyfill: roundRect ───────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  const radii = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = radii.map(v => Math.min(v, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}
