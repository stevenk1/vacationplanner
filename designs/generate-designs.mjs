// Generates Excalidraw wireframes for the Holiday Idea Planner.
// Run: node designs/generate-designs.mjs
// Output: *.excalidraw files in this folder, openable on excalidraw.com or the VS Code Excalidraw extension.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

// ---- palette -------------------------------------------------------------
const INK = '#1e1e1e';
const MUTE = '#6b7280';
const LINE = '#cbd5e1';
const PANEL = '#ffffff';
const TINT = '#f8fafc';
const WHITE = '#ffffff';
const SUB = ['#e07a5f', '#3d8bff', '#2a9d8f', '#9b5de5', '#f4a261']; // sub-period colors

// ---- element helpers -----------------------------------------------------
let _id = 0;
const nid = () => 'el' + ++_id;
const nseed = () => (_id * 99991 + 12345) % 2147483647;

function base(type, x, y, w, h, extra = {}) {
  return {
    id: nid(), type, x, y, width: w, height: h, angle: 0,
    strokeColor: INK, backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1,
    opacity: 100, groupIds: [], frameId: null, roundness: null,
    seed: nseed(), version: 1, versionNonce: nseed(), isDeleted: false,
    boundElements: [], updated: 1, link: null, locked: false, ...extra,
  };
}
function rect(x, y, w, h, o = {}) {
  return base('rectangle', x, y, w, h, {
    backgroundColor: o.bg ?? 'transparent',
    strokeColor: o.stroke ?? LINE,
    strokeWidth: o.sw ?? 1,
    strokeStyle: o.dashed ? 'dashed' : 'solid',
    fillStyle: o.fill ?? 'solid',
    roughness: o.rough ?? 1,
    roundness: o.round === false ? null : { type: 3 },
    opacity: o.opacity ?? 100,
  });
}
function ellipse(x, y, w, h, o = {}) {
  return base('ellipse', x, y, w, h, {
    backgroundColor: o.bg ?? 'transparent',
    strokeColor: o.stroke ?? LINE,
    strokeWidth: o.sw ?? 1,
    fillStyle: 'solid',
    roughness: o.rough ?? 1,
  });
}
function text(x, y, str, o = {}) {
  const size = o.size ?? 16;
  const lines = String(str).split('\n');
  const lh = 1.25;
  const w = o.width ?? Math.max(8, Math.max(...lines.map((l) => l.length)) * size * 0.58);
  const h = lines.length * size * lh;
  return base('text', x, y, w, h, {
    text: str, originalText: str, fontSize: size, fontFamily: o.font ?? 1,
    textAlign: o.align ?? 'left', verticalAlign: 'top', containerId: null,
    lineHeight: lh, baseline: Math.round(size * 0.9),
    strokeColor: o.color ?? INK, roughness: 1, roundness: null,
  });
}
function seg(x, y, pts, o = {}) {
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  return base(o.arrow ? 'arrow' : 'line', x, y, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), {
    points: pts, lastCommittedPoint: null,
    startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: o.arrow ? 'arrow' : null,
    strokeColor: o.stroke ?? LINE, strokeWidth: o.sw ?? 1,
    strokeStyle: o.dashed ? 'dashed' : 'solid', roughness: o.rough ?? 1, roundness: null,
  });
}

// composite: labeled "screen" container with a caption above it
function screen(els, x, y, w, h, title, caption) {
  els.push(text(x, y - 64, title, { size: 30, color: INK }));
  if (caption) els.push(text(x, y - 28, caption, { size: 15, color: MUTE }));
  els.push(rect(x, y, w, h, { bg: TINT, stroke: '#94a3b8', sw: 2 }));
}
// composite: input field with label
function field(els, x, y, w, label, value, o = {}) {
  els.push(text(x, y, label, { size: 13, color: MUTE }));
  els.push(rect(x, y + 20, w, o.h ?? 38, { bg: WHITE, stroke: LINE }));
  if (o.icon) els.push(text(x + 12, y + 30, o.icon, { size: 16 }));
  els.push(text(x + (o.icon ? 38 : 14), y + 30, value, { size: 15, color: o.valueColor ?? INK }));
}
// composite: pill button
function button(els, x, y, w, h, label, o = {}) {
  els.push(rect(x, y, w, h, { bg: o.bg ?? SUB[0], stroke: o.stroke ?? o.bg ?? SUB[0], round: true }));
  els.push(text(x, y + h / 2 - 9, label, { size: 15, color: o.color ?? WHITE, align: 'center', width: w }));
}
// composite: color swatch row
function swatches(els, x, y, colors, sel) {
  colors.forEach((c, i) => {
    const cx = x + i * 38;
    els.push(ellipse(cx, y, 26, 26, { bg: c, stroke: i === sel ? INK : c, sw: i === sel ? 3 : 1, rough: 0 }));
  });
}

// Per-country theme: flag colors (in flag order), a landmark emoji, and a readable accent.
// In the real app these are derived from the geocoded country code via a lookup table.
const COUNTRY = {
  IT: { flag: '🇮🇹', name: 'Italy', colors: ['#009246', '#F1F2F1', '#CE2B37'], landmark: '🏛️', accent: '#CE2B37' },
  NO: { flag: '🇳🇴', name: 'Norway', colors: ['#BA0C2F', '#FFFFFF', '#00205B'], landmark: '⛰️', accent: '#00205B' },
  ES: { flag: '🇪🇸', name: 'Spain', colors: ['#AA151B', '#F1BF00', '#AA151B'], landmark: '🍊', accent: '#AA151B' },
  SCT: { flag: '🏴', name: 'Scotland', colors: ['#005EB8', '#FFFFFF', '#005EB8'], landmark: '🏰', accent: '#005EB8' },
  GR: { flag: '🇬🇷', name: 'Greece', colors: ['#0D5EAF', '#FFFFFF', '#0D5EAF'], landmark: '⛵', accent: '#0D5EAF' },
};

// vertical flag-color stripe band with flag + landmark chips, used as the card/hero theme
function flagBand(els, x, y, w, h, c, o = {}) {
  const n = c.colors.length, sw = w / n;
  c.colors.forEach((col, i) => els.push(rect(x + i * sw, y, sw + 0.6, h, { bg: col, stroke: col, round: false, rough: 0 })));
  els.push(rect(x, y, w, h, { stroke: '#e2e8f0', round: false, rough: 0 })); // crisp outer border
  if (o.flag !== false) {
    els.push(rect(x + 12, y + h / 2 - 22, 44, 44, { bg: WHITE, stroke: WHITE, rough: 0 }));
    els.push(text(x + 18, y + h / 2 - 16, c.flag, { size: 30 }));
  }
  if (o.landmark !== false) {
    els.push(rect(x + w - 56, y + h / 2 - 22, 44, 44, { bg: WHITE, stroke: WHITE, rough: 0 }));
    els.push(text(x + w - 50, y + h / 2 - 16, c.landmark, { size: 26 }));
  }
}

function file(name, elements) {
  const doc = {
    type: 'excalidraw', version: 2, source: 'holiday-planner-wireframes',
    elements,
    appState: { gridSize: null, viewBackgroundColor: '#ffffff' },
    files: {},
  };
  writeFileSync(`${OUT}/${name}`, JSON.stringify(doc, null, 2));
  console.log(`  ${name}  (${elements.length} elements)`);
}

// =========================================================================
// 01 — Holidays list
// =========================================================================
function holidaysList() {
  _id = 0;
  const E = [];
  const X = 40, Y = 40, W = 1180, H = 720;
  screen(E, X, Y, W, H, 'Holidays list', 'Home page — grid of holiday cards with flag, theme color, date range + "New holiday"');

  // top nav
  E.push(rect(X + 20, Y + 20, W - 40, 56, { bg: WHITE, stroke: LINE }));
  E.push(text(X + 40, Y + 38, '🌍  Holiday Planner', { size: 22 }));
  E.push(text(W - 120, Y + 44, 'plan trips beautifully', { size: 13, color: MUTE }));

  // title + new button
  E.push(text(X + 40, Y + 100, 'Your Holidays', { size: 28 }));
  button(E, W - 130, Y + 96, 150, 42, '＋  New Holiday', { bg: SUB[0] });

  const cards = [
    { t: 'Summer in Tuscany', cc: 'IT', em: '☀️', d: '12 – 26 Jul 2026', loc: 'Tuscany, Italy', meta: '3 sub-periods · 14 places' },
    { t: 'Norway Fjords', cc: 'NO', em: '⛰️', d: '3 – 13 Aug 2026', loc: 'Western Norway', meta: '2 sub-periods · 9 places' },
    { t: 'Andalusia Roadtrip', cc: 'ES', em: '🍊', d: '20 Sep – 1 Oct 2026', loc: 'Andalusia, Spain', meta: '4 sub-periods · 18 places' },
    { t: 'Scottish Highlands', cc: 'SCT', em: '🥃', d: '5 – 12 May 2026', loc: 'Highlands, Scotland', meta: '2 sub-periods · 7 places' },
    { t: 'Greek Islands', cc: 'GR', em: '⛵', d: '1 – 15 Jun 2026', loc: 'Cyclades, Greece', meta: '5 sub-periods · 21 places' },
  ];
  const cw = 360, ch = 244, gx = 26, gy = 26;
  const sx = X + 40, sy = Y + 156;
  cards.forEach((cd, i) => {
    const c = COUNTRY[cd.cc];
    const col = i % 3, row = Math.floor(i / 3);
    const x = sx + col * (cw + gx), y = sy + row * (ch + gy);
    E.push(rect(x, y, cw, ch, { bg: WHITE, stroke: LINE }));
    // country-themed flag-stripe band
    flagBand(E, x, y, cw, 92, c);
    // left accent ribbon in the flag's dominant color
    E.push(rect(x, y + 92, 6, ch - 92, { bg: c.accent, stroke: c.accent, round: false }));
    // body
    E.push(text(x + 20, y + 104, cd.t, { size: 21 }));
    E.push(text(x + 20, y + 138, '🗓  ' + cd.d, { size: 14, color: MUTE }));
    E.push(text(x + 20, y + 164, '📍 ' + cd.loc + '  ' + c.flag, { size: 15, color: MUTE }));
    E.push(seg(x + 20, y + 198, [[0, 0], [cw - 40, 0]], { stroke: LINE }));
    E.push(text(x + 20, y + 212, cd.meta, { size: 13, color: c.accent }));
    E.push(text(x + cw - 44, y + 210, cd.em, { size: 18 }));
  });
  // ghost "new" card (6th slot)
  const gxp = sx + 2 * (cw + gx), gyp = sy + 1 * (ch + gy);
  E.push(rect(gxp, gyp, cw, ch, { bg: TINT, stroke: '#94a3b8', dashed: true, sw: 2 }));
  E.push(text(gxp + cw / 2 - 70, gyp + ch / 2 - 26, '＋', { size: 40, color: MUTE, align: 'center', width: 140 }));
  E.push(text(gxp + cw / 2 - 70, gyp + ch / 2 + 18, 'New Holiday', { size: 16, color: MUTE, align: 'center', width: 140 }));

  file('01-holidays-list.excalidraw', E);
}

// =========================================================================
// 02 — Holiday detail
// =========================================================================
function holidayDetail() {
  _id = 0;
  const E = [];
  const X = 40, Y = 40, W = 1180, H = 760;
  screen(E, X, Y, W, H, 'Holiday detail', 'Themed hero · itinerary (sub-periods) · interactive map · "drive from stay" overview');

  E.push(text(X + 24, Y + 18, '←  All holidays', { size: 14, color: MUTE }));

  // hero banner — themed to the country (accent fill + flag-stripe ribbon)
  const C = COUNTRY.IT;
  const hx = X + 24, hy = Y + 46, hw = W - 48, hh = 130;
  E.push(rect(hx, hy, hw, hh, { bg: C.accent, stroke: C.accent }));
  flagBand(E, hx + hw - 168, hy, 168, hh, C, { flag: false }); // flag-stripe ribbon on the right
  E.push(text(hx + 24, hy + 30, C.flag, { size: 64 }));
  E.push(text(hx + 110, hy + 24, 'Summer in Tuscany  ☀️', { size: 32, color: WHITE }));
  E.push(text(hx + 112, hy + 72, '12 – 26 July 2026  ·  14 days', { size: 17, color: WHITE }));
  E.push(text(hx + 112, hy + 98, '📍 Tuscany, Italy', { size: 15, color: WHITE }));
  button(E, hx + hw - 168 - 124, hy + 22, 108, 40, '✎  Edit', { bg: WHITE, color: INK, stroke: WHITE });

  const top = hy + hh + 24;

  // ---- left rail: itinerary (sub-periods) ----
  const rx = X + 24, rw = 318;
  E.push(text(rx, top, 'Itinerary', { size: 22 }));
  const subs = [
    { c: SUB[0], n: 'Coastal Days', d: '12 – 18 Jul', stay: 'Villa Mare, Viareggio', places: ['🏖️ Cinque Terre', '🍝 Lucca', '⛪ Pisa'] },
    { c: SUB[1], n: 'Hilltop Towns', d: '18 – 22 Jul', stay: 'Agriturismo Siena', places: ['🏛️ Siena', '🍷 Montepulciano', '🌅 Val d’Orcia'] },
    { c: SUB[2], n: 'City Finale', d: '22 – 26 Jul', stay: 'Hotel Firenze', places: ['🖼️ Uffizi', '🍦 Florence', '🏰 Fiesole'] },
  ];
  let cy = top + 34;
  subs.forEach((s) => {
    const ch = 52 + s.places.length * 24 + 16;
    E.push(rect(rx, cy, rw, ch, { bg: WHITE, stroke: LINE }));
    E.push(rect(rx, cy, 6, ch, { bg: s.c, stroke: s.c }));
    E.push(ellipse(rx + 16, cy + 16, 12, 12, { bg: s.c, stroke: s.c, rough: 0 }));
    E.push(text(rx + 36, cy + 12, s.n, { size: 17 }));
    E.push(text(rx + rw - 96, cy + 14, s.d, { size: 12, color: MUTE }));
    E.push(text(rx + 16, cy + 36, '🏠 ' + s.stay, { size: 13, color: MUTE }));
    s.places.forEach((p, i) => E.push(text(rx + 24, cy + 60 + i * 24, p, { size: 14 })));
    cy += ch + 14;
  });

  // ---- center: map ----
  const mx = rx + rw + 22, mw = 506, mh = 472;
  E.push(rect(mx, top, mw, mh, { bg: '#eaf1f1', stroke: LINE }));
  E.push(text(mx + 14, top + 12, '🗺️  Map  ·  stays + places, colored per sub-period', { size: 13, color: MUTE }));
  // fake roads
  E.push(seg(mx + 60, top + 120, [[0, 0], [120, 60], [260, 40], [380, 130]], { stroke: '#c4d4d4', sw: 2 }));
  E.push(seg(mx + 90, top + 360, [[0, 0], [90, -80], [230, -40], [330, -150]], { stroke: '#c4d4d4', sw: 2 }));
  // markers: stays (home) + places (pins) colored by sub-period
  const pin = (px, py, label, color, home) => {
    E.push(ellipse(px, py, 26, 26, { bg: color, stroke: WHITE, sw: 2, rough: 0 }));
    E.push(text(px + 4, py + 4, home ? '🏠' : '📍', { size: 14, color: WHITE }));
    if (label) E.push(text(px + 30, py + 4, label, { size: 12, color: INK }));
  };
  pin(mx + 70, top + 100, 'Villa Mare', SUB[0], true);
  pin(mx + 150, top + 150, 'Cinque Terre', SUB[0]);
  pin(mx + 110, top + 210, 'Lucca', SUB[0]);
  pin(mx + 250, top + 250, 'Agriturismo', SUB[1], true);
  pin(mx + 320, top + 200, 'Siena', SUB[1]);
  pin(mx + 360, top + 320, 'Hotel Firenze', SUB[2], true);
  pin(mx + 300, top + 380, 'Uffizi', SUB[2]);
  // popup callout example
  E.push(rect(mx + 150, top + 150 - 64, 230, 52, { bg: WHITE, stroke: INK, sw: 1 }));
  E.push(text(mx + 162, top + 150 - 56, 'Cinque Terre', { size: 13 }));
  E.push(text(mx + 162, top + 150 - 38, '🚗 1h 25m · 92 km from stay', { size: 12, color: MUTE }));
  // legend
  E.push(rect(mx + 12, top + mh - 70, 190, 58, { bg: WHITE, stroke: LINE }));
  E.push(text(mx + 22, top + mh - 62, '🏠 Stay     📍 Place', { size: 12 }));
  subs.forEach((s, i) => {
    E.push(ellipse(mx + 22 + i * 58, top + mh - 38, 11, 11, { bg: s.c, stroke: s.c, rough: 0 }));
    E.push(text(mx + 36 + i * 58, top + mh - 40, s.n.split(' ')[0], { size: 10, color: MUTE }));
  });

  // ---- right: drive-from-stay overview ----
  const ox = mx + mw + 22, ow = W - 48 - (ox - (X + 24));
  E.push(rect(ox, top, ow, mh, { bg: WHITE, stroke: LINE }));
  E.push(text(ox + 16, top + 14, '⏱  Drive from stay', { size: 17 }));
  E.push(text(ox + ow - 92, top + 18, 'sort: time ▾', { size: 12, color: MUTE }));
  E.push(seg(ox + 12, top + 46, [[0, 0], [ow - 24, 0]], { stroke: LINE }));
  const rows = [
    { g: subs[0], items: [['🍝 Lucca', '22m', '24 km'], ['⛪ Pisa', '35m', '41 km'], ['🏖️ Cinque Terre', '1h 25m', '92 km']] },
    { g: subs[1], items: [['🏛️ Siena', '15m', '12 km'], ['🍷 Montepulciano', '48m', '55 km'], ['🌅 Val d’Orcia', '40m', '46 km']] },
    { g: subs[2], items: [['🍦 Florence', '8m', '5 km'], ['🖼️ Uffizi', '10m', '6 km'], ['🏰 Fiesole', '20m', '14 km']] },
  ];
  let ry = top + 58;
  rows.forEach((r) => {
    E.push(ellipse(ox + 16, ry + 3, 10, 10, { bg: r.g.c, stroke: r.g.c, rough: 0 }));
    E.push(text(ox + 32, ry, r.g.n + '  ·  🏠 ' + r.g.stay.split(',')[0], { size: 12, color: MUTE }));
    ry += 26;
    r.items.forEach((it) => {
      E.push(text(ox + 20, ry, it[0], { size: 14 }));
      E.push(text(ox + ow - 118, ry, '🚗 ' + it[1], { size: 13, color: r.g.c }));
      E.push(text(ox + ow - 52, ry, it[2], { size: 12, color: MUTE }));
      ry += 26;
    });
    ry += 10;
  });

  file('02-holiday-detail.excalidraw', E);
}

// =========================================================================
// 03 — Forms (3 dialogs)
// =========================================================================
function forms() {
  _id = 0;
  const E = [];
  const X = 40, Y = 40, W = 1300, H = 660;
  screen(E, X, Y, W, H, 'Add / edit forms', 'Create-or-edit dialogs: holiday · sub-period (with stay) · add place');

  const mw = 380, mh = 560, my = Y + 50;
  const modal = (x, title, em) => {
    E.push(rect(x, my, mw, mh, { bg: WHITE, stroke: '#94a3b8', sw: 2 }));
    E.push(text(x + 24, my + 20, em + '  ' + title, { size: 20 }));
    E.push(text(x + mw - 36, my + 20, '✕', { size: 18, color: MUTE }));
    E.push(seg(x + 20, my + 56, [[0, 0], [mw - 40, 0]], { stroke: LINE }));
  };
  const footer = (x, primary) => {
    button(E, x + mw - 200, my + mh - 56, 84, 38, 'Cancel', { bg: WHITE, color: INK, stroke: LINE });
    button(E, x + mw - 108, my + mh - 56, 88, 38, primary, { bg: SUB[0] });
  };

  // Modal 1 — Holiday
  const x1 = X + 30;
  modal(x1, 'New Holiday', '🌍');
  let y = my + 76;
  field(E, x1 + 24, y, mw - 48, 'Title', 'Summer in Tuscany'); y += 70;
  field(E, x1 + 24, y, (mw - 48 - 16) / 2, 'Start date', '12 Jul 2026');
  field(E, x1 + 24 + (mw - 48 - 16) / 2 + 16, y, (mw - 48 - 16) / 2, 'End date', '26 Jul 2026'); y += 70;
  field(E, x1 + 24, y, mw - 48, 'Location', 'Tuscany, Italy', { icon: '🔍' });
  E.push(text(x1 + 24, y + 62, '→ detected  🇮🇹 Italy (IT)', { size: 12, color: SUB[2] })); y += 86;
  E.push(text(x1 + 24, y, 'Theme — auto from country', { size: 13, color: MUTE }));
  const Cf = COUNTRY.IT;
  flagBand(E, x1 + 24, y + 20, 196, 36, Cf, { flag: false }); // flag-color preview + landmark
  E.push(text(x1 + 250, y - 2, 'Emoji', { size: 13, color: MUTE }));
  E.push(rect(x1 + 250, y + 18, 40, 36, { bg: WHITE, stroke: LINE }));
  E.push(text(x1 + 260, y + 25, '☀️', { size: 18 }));
  E.push(ellipse(x1 + 24, y + 64, 20, 20, { bg: Cf.accent, stroke: INK, sw: 2, rough: 0 }));
  E.push(text(x1 + 52, y + 66, 'accent ' + Cf.accent + '  ·  change ▾', { size: 12, color: MUTE }));
  y += 96;
  E.push(text(x1 + 24, y, 'Notes', { size: 13, color: MUTE }));
  E.push(rect(x1 + 24, y + 20, mw - 48, 56, { bg: WHITE, stroke: LINE }));
  footer(x1, 'Save');

  // Modal 2 — Sub-period
  const x2 = X + 30 + mw + 30;
  modal(x2, 'Add Sub-period', '🗓️');
  y = my + 76;
  field(E, x2 + 24, y, mw - 48, 'Name', 'Coastal Days'); y += 70;
  field(E, x2 + 24, y, (mw - 48 - 16) / 2, 'Start', '12 Jul');
  field(E, x2 + 24 + (mw - 48 - 16) / 2 + 16, y, (mw - 48 - 16) / 2, 'End', '18 Jul'); y += 70;
  E.push(text(x2 + 24, y, 'Map color', { size: 13, color: MUTE }));
  swatches(E, x2 + 24, y + 22, SUB, 0); y += 64;
  field(E, x2 + 24, y, mw - 48, 'Stay name', 'Villa Mare'); y += 70;
  field(E, x2 + 24, y, mw - 48, 'Stay location', 'Viareggio, Italy', { icon: '🔍' }); y += 64;
  E.push(rect(x2 + 24, y, mw - 48, 92, { bg: '#eaf1f1', stroke: LINE }));
  E.push(text(x2 + 36, y + 8, 'stay preview', { size: 11, color: MUTE }));
  E.push(ellipse(x2 + 24 + (mw - 48) / 2 - 12, y + 40, 24, 24, { bg: SUB[0], stroke: WHITE, sw: 2, rough: 0 }));
  E.push(text(x2 + 24 + (mw - 48) / 2 - 8, y + 44, '🏠', { size: 13 }));
  footer(x2, 'Add');

  // Modal 3 — Add place
  const x3 = X + 30 + (mw + 30) * 2;
  modal(x3, 'Add Place', '📍');
  y = my + 76;
  field(E, x3 + 24, y, mw - 48, 'Search location', 'cinque…', { icon: '🔍' }); y += 64;
  // results dropdown
  E.push(rect(x3 + 24, y, mw - 48, 96, { bg: WHITE, stroke: LINE }));
  ['Cinque Terre, La Spezia, Italy', 'Cinquale, Massa, Italy', 'Cinto Euganeo, Padova, Italy'].forEach((r, i) => {
    if (i === 0) E.push(rect(x3 + 26, y + 2 + i * 31, mw - 52, 30, { bg: '#fdeee9', stroke: '#fdeee9' }));
    E.push(text(x3 + 36, y + 9 + i * 31, '📍 ' + r, { size: 13 }));
  });
  y += 116;
  E.push(text(x3 + 24, y, 'Category', { size: 13, color: MUTE }));
  const cats = ['🏖️ Beach', '🍝 Food', '🏛️ Culture', '🌅 Nature', '⛪ Landmark'];
  let cxp = x3 + 24, cyp = y + 22;
  cats.forEach((c, i) => {
    const w = c.length * 8 + 26;
    if (cxp + w > x3 + mw - 24) { cxp = x3 + 24; cyp += 36; }
    E.push(rect(cxp, cyp, w, 30, { bg: i === 0 ? '#fdeee9' : WHITE, stroke: i === 0 ? SUB[0] : LINE, round: true }));
    E.push(text(cxp + 10, cyp + 7, c, { size: 13 }));
    cxp += w + 10;
  });
  y = cyp + 52;
  E.push(text(x3 + 24, y, 'Notes', { size: 13, color: MUTE }));
  E.push(rect(x3 + 24, y + 20, mw - 48, 48, { bg: WHITE, stroke: LINE })); y += 84;
  E.push(rect(x3 + 24, y, mw - 48, 50, { bg: '#eef6f5', stroke: '#2a9d8f' }));
  E.push(text(x3 + 36, y + 9, '🚗 Driving time is auto-calculated', { size: 12, color: '#2a9d8f' }));
  E.push(text(x3 + 36, y + 27, 'from Villa Mare (this sub-period’s stay)', { size: 12, color: '#2a9d8f' }));
  footer(x3, 'Add');

  file('03-forms.excalidraw', E);
}

// =========================================================================
// 04 — Mobile / responsive
// =========================================================================
function mobile() {
  _id = 0;
  const E = [];
  const X = 40, Y = 40, W = 820, H = 720;
  screen(E, X, Y, W, H, 'Mobile / responsive', 'Narrow-screen reflow — list as single column; detail stacks map above, overview below');

  const phone = (px, label) => {
    E.push(rect(px, Y + 30, 300, 640, { bg: WHITE, stroke: '#94a3b8', sw: 2 }));
    E.push(rect(px + 110, Y + 30, 80, 18, { bg: '#94a3b8', stroke: '#94a3b8' })); // notch
    E.push(text(px, Y + 690, label, { size: 13, color: MUTE, align: 'center', width: 300 }));
    return { x: px, top: Y + 60 };
  };

  // Phone A — Holidays list
  const a = phone(X + 60, 'Holidays — single column');
  E.push(text(a.x + 18, a.top + 6, '🌍 Holidays', { size: 18 }));
  button(E, a.x + 230, a.top, 50, 30, '＋', { bg: SUB[0] });
  const mcards = [
    { cc: 'IT', t: 'Summer in Tuscany', d: '12 – 26 Jul 2026', loc: 'Tuscany, Italy' },
    { cc: 'NO', t: 'Norway Fjords', d: '3 – 13 Aug 2026', loc: 'Western Norway' },
    { cc: 'GR', t: 'Greek Islands', d: '1 – 15 Jun 2026', loc: 'Cyclades, Greece' },
  ];
  let y = a.top + 44;
  mcards.forEach((m) => {
    const c = COUNTRY[m.cc];
    E.push(rect(a.x + 16, y, 264, 144, { bg: WHITE, stroke: LINE }));
    flagBand(E, a.x + 16, y, 264, 58, c);
    E.push(rect(a.x + 16, y + 58, 5, 86, { bg: c.accent, stroke: c.accent, round: false }));
    E.push(text(a.x + 30, y + 70, m.t, { size: 16 }));
    E.push(text(a.x + 30, y + 96, '🗓 ' + m.d, { size: 12, color: MUTE }));
    E.push(text(a.x + 30, y + 118, '📍 ' + m.loc, { size: 12, color: MUTE }));
    y += 160;
  });

  // Phone B — Holiday detail (stacked)
  const b = phone(X + 460, 'Detail — map on top, drive list below');
  // compact hero — themed to country
  const cC = COUNTRY.IT;
  E.push(rect(b.x + 16, b.top, 264, 70, { bg: cC.accent, stroke: cC.accent }));
  flagBand(E, b.x + 16 + 264 - 56, b.top, 56, 70, cC, { flag: false }); // mini ribbon
  E.push(text(b.x + 28, b.top + 18, cC.flag, { size: 26 }));
  E.push(text(b.x + 66, b.top + 12, 'Summer in Tuscany', { size: 15, color: WHITE }));
  E.push(text(b.x + 66, b.top + 38, '12 – 26 Jul · ☀️', { size: 12, color: WHITE }));
  // sub-period chips
  let cx = b.x + 16; const chipY = b.top + 84;
  [['Coastal', SUB[0], true], ['Hilltop', SUB[1]], ['City', SUB[2]]].forEach(([n, c, on]) => {
    const w = n.length * 8 + 24;
    E.push(rect(cx, chipY, w, 28, { bg: on ? c : WHITE, stroke: c, round: true }));
    E.push(text(cx + 12, chipY + 6, n, { size: 12, color: on ? WHITE : c }));
    cx += w + 8;
  });
  // map (full width)
  const mTop = chipY + 40;
  E.push(rect(b.x + 16, mTop, 264, 180, { bg: '#eaf1f1', stroke: LINE }));
  E.push(text(b.x + 26, mTop + 8, '🗺️ Map', { size: 12, color: MUTE }));
  E.push(ellipse(b.x + 80, mTop + 70, 22, 22, { bg: SUB[0], stroke: WHITE, sw: 2, rough: 0 }));
  E.push(text(b.x + 84, mTop + 73, '🏠', { size: 11 }));
  E.push(ellipse(b.x + 160, mTop + 100, 20, 20, { bg: SUB[0], stroke: WHITE, sw: 2, rough: 0 }));
  E.push(text(b.x + 164, mTop + 103, '📍', { size: 10 }));
  E.push(ellipse(b.x + 210, mTop + 60, 20, 20, { bg: SUB[1], stroke: WHITE, sw: 2, rough: 0 }));
  E.push(text(b.x + 214, mTop + 63, '📍', { size: 10 }));
  // drive list below map
  const lTop = mTop + 196;
  E.push(text(b.x + 16, lTop, '⏱ Drive from stay', { size: 14 }));
  const items = [['🍝 Lucca', '22m'], ['⛪ Pisa', '35m'], ['🏖️ Cinque Terre', '1h 25m'], ['🏛️ Siena', '15m']];
  let ly = lTop + 28;
  items.forEach((it) => {
    E.push(text(b.x + 20, ly, it[0], { size: 13 }));
    E.push(text(b.x + 210, ly, '🚗 ' + it[1], { size: 12, color: SUB[0] }));
    E.push(seg(b.x + 16, ly + 22, [[0, 0], [264, 0]], { stroke: LINE }));
    ly += 32;
  });

  file('04-mobile-responsive.excalidraw', E);
}

// ---- run -----------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
console.log('Generating Excalidraw wireframes:');
holidaysList();
holidayDetail();
forms();
mobile();
console.log('Done.');
