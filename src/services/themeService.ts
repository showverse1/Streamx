export interface AppTheme {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  previewGradient: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  borderGlow: string;
  cardBg: string;
  tag: string;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    subtitle: 'StreamX Ultra Signature',
    description: 'Electric Cyan & Laser Pink with futuristic high-contrast neon aura',
    previewGradient: 'from-cyan-500 via-sky-500 to-fuchsia-600',
    primaryColor: '#00f3ff',
    secondaryColor: '#ff007f',
    accentGlow: 'rgba(0, 243, 255, 0.6)',
    borderGlow: 'rgba(0, 243, 255, 0.45)',
    cardBg: '#030812',
    tag: 'Default Ultra'
  },
  {
    id: 'midnight-oled',
    name: 'Midnight OLED',
    subtitle: 'Pure Obsidian & Diamond Silver',
    description: 'Deep pitch black with crisp diamond white & silver glass accents',
    previewGradient: 'from-white via-slate-300 to-zinc-600',
    primaryColor: '#ffffff',
    secondaryColor: '#94a3b8',
    accentGlow: 'rgba(255, 255, 255, 0.5)',
    borderGlow: 'rgba(255, 255, 255, 0.35)',
    cardBg: '#050505',
    tag: 'Minimalist'
  },
  {
    id: 'crimson-scarlet',
    name: 'Scarlet Cinema',
    subtitle: 'Bollywood Action & Fiery Red',
    description: 'Deep ruby dark tones with explosive scarlet red & sunset gold flares',
    previewGradient: 'from-rose-600 via-red-500 to-amber-500',
    primaryColor: '#ff1a40',
    secondaryColor: '#ffaa00',
    accentGlow: 'rgba(255, 26, 64, 0.65)',
    borderGlow: 'rgba(255, 26, 64, 0.45)',
    cardBg: '#120206',
    tag: 'Action Hits'
  },
  {
    id: 'emerald-matrix',
    name: 'Matrix Emerald',
    subtitle: 'Cyber Green Terminal',
    description: 'High-tech matrix green neon glow with mint cyber aesthetics',
    previewGradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    primaryColor: '#00ff66',
    secondaryColor: '#00e5ff',
    accentGlow: 'rgba(0, 255, 102, 0.6)',
    borderGlow: 'rgba(0, 255, 102, 0.4)',
    cardBg: '#021207',
    tag: 'Sci-Fi'
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    subtitle: 'Cosmic Anime & Ultraviolet',
    description: 'Celestial dark purple with vivid ultraviolet and neon rose aura',
    previewGradient: 'from-purple-500 via-violet-600 to-fuchsia-500',
    primaryColor: '#b026ff',
    secondaryColor: '#f43f5e',
    accentGlow: 'rgba(176, 38, 255, 0.65)',
    borderGlow: 'rgba(176, 38, 255, 0.45)',
    cardBg: '#0d0417',
    tag: 'Anime Vibe'
  },
  {
    id: 'electric-blue',
    name: 'Sapphire Wave',
    subtitle: 'Deep Ocean & Electric Azure',
    description: 'Deep marine dark night with vibrant royal azure and turquoise highlights',
    previewGradient: 'from-blue-500 via-indigo-600 to-cyan-400',
    primaryColor: '#0080ff',
    secondaryColor: '#00f3ff',
    accentGlow: 'rgba(0, 128, 255, 0.6)',
    borderGlow: 'rgba(0, 128, 255, 0.45)',
    cardBg: '#040d1f',
    tag: 'Deep Ocean'
  },
  {
    id: 'sunset-gold',
    name: 'Sunset Luxe',
    subtitle: 'Molten Gold & Warm Amber',
    description: 'Warm obsidian black with 24K molten gold accents and royal amber sheen',
    previewGradient: 'from-amber-400 via-yellow-500 to-orange-600',
    primaryColor: '#ffaa00',
    secondaryColor: '#ff5500',
    accentGlow: 'rgba(255, 170, 0, 0.6)',
    borderGlow: 'rgba(255, 170, 0, 0.45)',
    cardBg: '#140c03',
    tag: 'Luxe VIP'
  },
  {
    id: 'synthwave-80s',
    name: 'Tokyo Synthwave',
    subtitle: 'Arcade Retrowave 1984',
    description: 'Hot neon magenta and radiant laser cyan with 80s arcade vibes',
    previewGradient: 'from-pink-500 via-rose-500 to-indigo-600',
    primaryColor: '#ff00aa',
    secondaryColor: '#00f3ff',
    accentGlow: 'rgba(255, 0, 170, 0.65)',
    borderGlow: 'rgba(255, 0, 170, 0.45)',
    cardBg: '#14021a',
    tag: 'Retro 80s'
  }
];

export function applyThemeToDOM(themeId: string): AppTheme {
  const theme = APP_THEMES.find((t) => t.id === themeId) || APP_THEMES[0];
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme.id);
    document.documentElement.style.setProperty('--theme-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondaryColor);
    document.documentElement.style.setProperty('--theme-accent-glow', theme.accentGlow);
    document.documentElement.style.setProperty('--theme-border-glow', theme.borderGlow);
    document.documentElement.style.setProperty('--theme-card-bg', theme.cardBg);
  }
  return theme;
}
