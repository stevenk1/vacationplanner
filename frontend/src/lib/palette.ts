// Distinct, map-friendly colors assigned to sub-periods (used on map markers + overview).
export const SUB_COLORS = [
  '#e07a5f',
  '#3d8bff',
  '#2a9d8f',
  '#9b5de5',
  '#f4a261',
  '#e5687f',
  '#0ea5e9',
  '#16a34a',
];

export function colorForIndex(i: number): string {
  return SUB_COLORS[((i % SUB_COLORS.length) + SUB_COLORS.length) % SUB_COLORS.length];
}
