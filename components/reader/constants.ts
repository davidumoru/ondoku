export const themes = {
  dawn: {
    label: "Dawn",
    bg: "#FAFAF8",
    fg: "#1C1B1A",
    muted: "#6B6963",
    accent: "#1D4ED8",
    border: "#E8E6E0",
    codeBg: "#F0EEE9",
    accentBorder: "#C8C5BC",
    swatch: "#FAFAF8",
    imageOutline: "rgba(0, 0, 0, 0.1)",
  },
  dusk: {
    label: "Dusk",
    bg: "#141413",
    fg: "#E8E6E0",
    muted: "#878580",
    accent: "#60A5FA",
    border: "#252422",
    codeBg: "#1C1B1A",
    accentBorder: "#4A4845",
    swatch: "#141413",
    imageOutline: "rgba(255, 255, 255, 0.1)",
  },
  sepia: {
    label: "Sepia",
    bg: "#F5EDD7",
    fg: "#3D2B1F",
    muted: "#8B7355",
    accent: "#7C3A12",
    border: "#DDD0B3",
    codeBg: "#EDE3C8",
    accentBorder: "#C4A882",
    swatch: "#F5EDD7",
    imageOutline: "rgba(0, 0, 0, 0.1)",
  },
} as const;

export const fonts = {
  lora: { label: "Lora", value: "var(--font-lora), Georgia, serif" },
  merriweather: { label: "Merriweather", value: "var(--font-merriweather), Georgia, serif" },
  inter: { label: "Inter", value: "var(--font-inter), system-ui, sans-serif" },
  sourceSans: { label: "Source Sans", value: "var(--font-source-sans), system-ui, sans-serif" },
  geist: { label: "Geist", value: "var(--font-geist-sans), system-ui, sans-serif" },
} as const;

export const sizes: { label: string; value: number }[] = [
  { label: "S", value: 15 },
  { label: "M", value: 17 },
  { label: "L", value: 19 },
  { label: "XL", value: 21 },
];

export type Theme = keyof typeof themes;
export type Font = keyof typeof fonts;
export type ThemeColors = (typeof themes)[Theme];

export interface Prefs {
  theme: Theme;
  font: Font;
  size: number;
}

export const DEFAULT_PREFS: Prefs = { theme: "dawn", font: "lora", size: 17 };
