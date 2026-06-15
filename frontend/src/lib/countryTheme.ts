// Maps an ISO 3166-1 alpha-2 country code to a visual theme:
// flag emoji + flag-color stripe palette + a landmark emoji + a readable accent color.

export interface CountryTheme {
  code: string;
  name: string;
  flag: string;
  colors: string[]; // flag-color stripes (in flag order)
  landmark: string;
  accent: string; // dominant, readable-on-white color
}

type Entry = { name: string; colors: string[]; landmark: string; accent: string };

const TABLE: Record<string, Entry> = {
  IT: { name: 'Italy', colors: ['#009246', '#F1F2F1', '#CE2B37'], landmark: '🏛️', accent: '#CE2B37' },
  FR: { name: 'France', colors: ['#0055A4', '#FFFFFF', '#EF4135'], landmark: '🗼', accent: '#0055A4' },
  ES: { name: 'Spain', colors: ['#AA151B', '#F1BF00', '#AA151B'], landmark: '🍊', accent: '#AA151B' },
  PT: { name: 'Portugal', colors: ['#046A38', '#DA291C', '#FFE900'], landmark: '⛵', accent: '#046A38' },
  DE: { name: 'Germany', colors: ['#000000', '#DD0000', '#FFCE00'], landmark: '🍺', accent: '#B11217' },
  NL: { name: 'Netherlands', colors: ['#AE1C28', '#FFFFFF', '#21468B'], landmark: '🌷', accent: '#21468B' },
  BE: { name: 'Belgium', colors: ['#000000', '#FDDA24', '#EF3340'], landmark: '🍫', accent: '#EF3340' },
  GB: { name: 'United Kingdom', colors: ['#012169', '#FFFFFF', '#C8102E'], landmark: '🎡', accent: '#012169' },
  IE: { name: 'Ireland', colors: ['#169B62', '#FFFFFF', '#FF883E'], landmark: '🍀', accent: '#169B62' },
  CH: { name: 'Switzerland', colors: ['#D52B1E', '#FFFFFF', '#D52B1E'], landmark: '🏔️', accent: '#D52B1E' },
  AT: { name: 'Austria', colors: ['#ED2939', '#FFFFFF', '#ED2939'], landmark: '🎻', accent: '#ED2939' },
  NO: { name: 'Norway', colors: ['#BA0C2F', '#FFFFFF', '#00205B'], landmark: '⛰️', accent: '#00205B' },
  SE: { name: 'Sweden', colors: ['#006AA7', '#FECC00', '#006AA7'], landmark: '🌲', accent: '#006AA7' },
  DK: { name: 'Denmark', colors: ['#C8102E', '#FFFFFF', '#C8102E'], landmark: '🧜', accent: '#C8102E' },
  FI: { name: 'Finland', colors: ['#FFFFFF', '#003580', '#FFFFFF'], landmark: '❄️', accent: '#003580' },
  IS: { name: 'Iceland', colors: ['#02529C', '#FFFFFF', '#DC1E35'], landmark: '🌋', accent: '#02529C' },
  GR: { name: 'Greece', colors: ['#0D5EAF', '#FFFFFF', '#0D5EAF'], landmark: '⛵', accent: '#0D5EAF' },
  HR: { name: 'Croatia', colors: ['#FF0000', '#FFFFFF', '#171796'], landmark: '🏖️', accent: '#171796' },
  PL: { name: 'Poland', colors: ['#FFFFFF', '#DC143C', '#FFFFFF'], landmark: '🏰', accent: '#DC143C' },
  CZ: { name: 'Czechia', colors: ['#11457E', '#FFFFFF', '#D7141A'], landmark: '🍺', accent: '#11457E' },
  HU: { name: 'Hungary', colors: ['#CD2A3E', '#FFFFFF', '#436F4D'], landmark: '🛁', accent: '#CD2A3E' },
  TR: { name: 'Türkiye', colors: ['#E30A17', '#FFFFFF', '#E30A17'], landmark: '🕌', accent: '#E30A17' },
  MA: { name: 'Morocco', colors: ['#C1272D', '#006233', '#C1272D'], landmark: '🐪', accent: '#006233' },
  US: { name: 'United States', colors: ['#3C3B6E', '#FFFFFF', '#B22234'], landmark: '🗽', accent: '#3C3B6E' },
  CA: { name: 'Canada', colors: ['#FF0000', '#FFFFFF', '#FF0000'], landmark: '🍁', accent: '#FF0000' },
  MX: { name: 'Mexico', colors: ['#006847', '#FFFFFF', '#CE1126'], landmark: '🌵', accent: '#006847' },
  JP: { name: 'Japan', colors: ['#FFFFFF', '#BC002D', '#FFFFFF'], landmark: '🗾', accent: '#BC002D' },
  TH: { name: 'Thailand', colors: ['#A51931', '#FFFFFF', '#2D2A4A'], landmark: '🛺', accent: '#2D2A4A' },
  AU: { name: 'Australia', colors: ['#00008B', '#FFFFFF', '#FF0000'], landmark: '🦘', accent: '#00008B' },
  NZ: { name: 'New Zealand', colors: ['#00247D', '#FFFFFF', '#CC142B'], landmark: '🥝', accent: '#00247D' },
  BR: { name: 'Brazil', colors: ['#009C3B', '#FFDF00', '#002776'], landmark: '🏝️', accent: '#009C3B' },
  ZA: { name: 'South Africa', colors: ['#007A4D', '#FFB81C', '#DE3831'], landmark: '🦁', accent: '#007A4D' },
};

const FALLBACK_ACCENTS = ['#e07a5f', '#3d8bff', '#2a9d8f', '#9b5de5', '#f4a261', '#e5687f', '#0ea5e9', '#16a34a'];

/** Flag emoji from a 2-letter ISO code (regional indicator symbols). */
export function flagEmoji(code?: string): string {
  if (!code) return '🏳️';
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return '🏳️';
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function getCountryTheme(code?: string, accentOverride?: string): CountryTheme {
  const cc = (code || '').trim().toUpperCase();
  const entry = TABLE[cc];
  if (entry) {
    return {
      code: cc,
      name: entry.name,
      flag: flagEmoji(cc),
      colors: entry.colors,
      landmark: entry.landmark,
      accent: accentOverride || entry.accent,
    };
  }
  // Unknown country: still show its flag, derive a pleasant accent + neutral stripes.
  const accent = accentOverride || FALLBACK_ACCENTS[hash(cc || 'XX') % FALLBACK_ACCENTS.length];
  return {
    code: cc,
    name: cc || 'Somewhere',
    flag: flagEmoji(cc),
    colors: [accent, '#F4F5F7', accent],
    landmark: '📍',
    accent,
  };
}
