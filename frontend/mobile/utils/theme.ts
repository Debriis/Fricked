import * as SecureStore from "expo-secure-store";

export type ThemeKey =
    | "VOID"
    | "DUSK"
    | "CHALK"
    | "EMBER"
    | "PASTEL"
    | "ACID"
    | "FROST"
    | "NEON"
    | "BATMAN"
    | "ICE"
    | "PURPLE"
    | "VINTAGE";

export type Theme = {
    name: ThemeKey;
    bg: string;
    bgCard: string;
    bgStrip: string;
    border: string;
    borderStrong: string;
    accent: string;
    accentBg: string;
    textPrimary: string;
    textMuted: string;
    textDead: string;
    danger: string;
    dangerBg: string;
    goodColor: string;
    statusBar: "light-content" | "dark-content";

    cardPrimary: string;
    cardSecondary: string;
    textOnSecondary: string;
    /**
     * Text color for the cardPrimary surface specifically. Falls back to
     * textPrimary if a theme doesn't set it.
     */
    textOnPrimary?: string;
};

export const THEMES: Record<ThemeKey, Theme> = {
    VOID: {
        name: "VOID", bg: "#1A1A1A", bgCard: "#080808", bgStrip: "#0d0d0d",
        border: "#1a1a1a", borderStrong: "#2a2a2a", accent: "#ff6b2b", accentBg: "#1a0e08",
        textPrimary: "#ffffff", textMuted: "#444444", textDead: "#1a1a1a",
        danger: "#ff3333", dangerBg: "#1a0505", goodColor: "#4a9a2a", statusBar: "light-content",
        // Morning classes = tan card, evening classes = green card
        cardPrimary: "#7BA7AF",
        cardSecondary: "#DCC9A9",
        textOnSecondary: "#000000",
        textOnPrimary: "#000000",
    },
    DUSK: { name: "DUSK", bg: "#0f0f12", bgCard: "#16161a", bgStrip: "#1e1e24", border: "#28282e", borderStrong: "#38383e", accent: "#b8b8cc", accentBg: "#1c1c22", textPrimary: "#e8e8f2", textMuted: "#565660", textDead: "#242428", danger: "#e05555", dangerBg: "#1e1010", goodColor: "#4aa060", statusBar: "light-content", cardPrimary: "#7BA7AF", cardSecondary: "#DCC9A9", textOnSecondary: "#000000", textOnPrimary: "#000000" },
    ACID: { name: "ACID", bg: "#000a00", bgCard: "#000e00", bgStrip: "#001500", border: "#002000", borderStrong: "#003500", accent: "#00ff41", accentBg: "#001a08", textPrimary: "#ccffcc", textMuted: "#2a5530", textDead: "#0a180a", danger: "#ff3333", dangerBg: "#1a0000", goodColor: "#00cc33", statusBar: "light-content", cardPrimary: "#000e00", cardSecondary: "#000e00", textOnSecondary: "#ccffcc" },
    FROST: { name: "FROST", bg: "#00060f", bgCard: "#000c1c", bgStrip: "#001230", border: "#001a40", borderStrong: "#002450", accent: "#00aaff", accentBg: "#001828", textPrimary: "#d0ecff", textMuted: "#2a5070", textDead: "#0a1828", danger: "#ff4466", dangerBg: "#180010", goodColor: "#00cc66", statusBar: "light-content", cardPrimary: "#000c1c", cardSecondary: "#000c1c", textOnSecondary: "#d0ecff" },
    NEON: { name: "NEON", bg: "#08000f", bgCard: "#0e001c", bgStrip: "#160026", border: "#200038", borderStrong: "#2e0050", accent: "#cc00ff", accentBg: "#1c0030", textPrimary: "#eeddff", textMuted: "#4a2060", textDead: "#1c0030", danger: "#ff3366", dangerBg: "#1a0010", goodColor: "#44cc44", statusBar: "light-content", cardPrimary: "#0e001c", cardSecondary: "#0e001c", textOnSecondary: "#eeddff" },
    CHALK: { name: "CHALK", bg: "#f0ede8", bgCard: "#e8e4de", bgStrip: "#ddd9d2", border: "#c4c0b8", borderStrong: "#a0a098", accent: "#1a1a1a", accentBg: "#d8d4cc", textPrimary: "#111111", textMuted: "#6c6860", textDead: "#c0bcb4", danger: "#c02020", dangerBg: "#f0d8d8", goodColor: "#2a7a2a", statusBar: "dark-content", cardPrimary: "#e8e4de", cardSecondary: "#e8e4de", textOnSecondary: "#111111" },
    EMBER: { name: "EMBER", bg: "#f5f0ea", bgCard: "#ede6de", bgStrip: "#e4ddd4", border: "#d0c8be", borderStrong: "#b8b0a6", accent: "#9a3e18", accentBg: "#f2e4dc", textPrimary: "#1a1210", textMuted: "#8a6858", textDead: "#cac2b8", danger: "#c02020", dangerBg: "#f4d8d8", goodColor: "#3a7a2a", statusBar: "dark-content", cardPrimary: "#ede6de", cardSecondary: "#ede6de", textOnSecondary: "#1a1210" },
    PASTEL: { name: "PASTEL", bg: "#fafaff", bgCard: "#f0f0fa", bgStrip: "#e8e8f8", border: "#d8d8f0", borderStrong: "#c0c0e0", accent: "#d06020", accentBg: "#fef0e4", textPrimary: "#1a1820", textMuted: "#807880", textDead: "#d8d8f0", danger: "#d03060", dangerBg: "#fce8f0", goodColor: "#3a9040", statusBar: "dark-content", cardPrimary: "#f0f0fa", cardSecondary: "#f0f0fa", textOnSecondary: "#1a1820" },
    BATMAN: { name: "BATMAN", bg: "#1A1A1A", bgCard: "#0f0000", bgStrip: "#1a0000", border: "#2e0000", borderStrong: "#550000", accent: "#cc1a1a", accentBg: "#150000", textPrimary: "#e8ddd0", textMuted: "#5a4040", textDead: "#1e0a0a", danger: "#ff2200", dangerBg: "#1a0000", goodColor: "#8a9a6a", statusBar: "light-content", cardPrimary: "#0f0000", cardSecondary: "#0f0000", textOnSecondary: "#e8ddd0" },
    ICE: { name: "ICE", bg: "#ffffff", bgCard: "#f4f7ff", bgStrip: "#eaf0ff", border: "#dde6f5", borderStrong: "#b8ccee", accent: "#2563eb", accentBg: "#eff4ff", textPrimary: "#0a0f1e", textMuted: "#6b7a99", textDead: "#d0daea", danger: "#e03050", dangerBg: "#fff0f3", goodColor: "#1a9a5a", statusBar: "dark-content", cardPrimary: "#f4f7ff", cardSecondary: "#f4f7ff", textOnSecondary: "#0a0f1e" },
    PURPLE: { name: "PURPLE", bg: "#1A1A1A", bgCard: "#0e0a14", bgStrip: "#160f20", border: "#2a1a3e", borderStrong: "#3e2858", accent: "#7b2cbf", accentBg: "#12082a", textPrimary: "#e8e0f0", textMuted: "#6a5080", textDead: "#1e1228", danger: "#cc2255", dangerBg: "#1a0010", goodColor: "#3a9a5a", statusBar: "light-content", cardPrimary: "#0e0a14", cardSecondary: "#0e0a14", textOnSecondary: "#e8e0f0" },

    VINTAGE: {
        name: "VINTAGE",
        bg: "#181818",
        bgCard: "#01344F",
        bgStrip: "#FAE3AC",
        border: "#FAE3AC",
        borderStrong: "#D12128",
        accent: "#D12128",
        accentBg: "#2A1112",
        textPrimary: "#FAE3AC",
        textMuted: "#BEB5A0",
        textDead: "#4B4742",
        danger: "#D12128",
        dangerBg: "#2B1012",
        goodColor: "#69B578",
        statusBar: "light-content",
        // Alternating card surfaces: navy → cream → navy → cream
        cardPrimary: "#01344F",
        cardSecondary: "#FAE3AC",
        textOnSecondary: "#181818",
    },
};

export const ALL_THEME_KEYS: ThemeKey[] = [
    "VOID",
    "DUSK",
    "CHALK",
    "EMBER",
    "PASTEL",
    "ACID",
    "FROST",
    "NEON",
    "BATMAN",
    "ICE",
    "PURPLE",
    "VINTAGE",
];

const THEME_KEY = "fricked_theme";
export const saveTheme = (key: ThemeKey) => SecureStore.setItemAsync(THEME_KEY, key);
export const loadTheme = async (): Promise<ThemeKey> => {
    const val = await SecureStore.getItemAsync(THEME_KEY);
    if (val && val in THEMES) return val as ThemeKey;
    return "VOID";
};