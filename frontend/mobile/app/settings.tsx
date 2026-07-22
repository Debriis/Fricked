import { useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Animated, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";
import { useTheme } from "../utils/ThemeContext";
import { THEMES, ThemeKey, ALL_THEME_KEYS } from "../utils/theme";

const THEME_DESCRIPTIONS: Record<ThemeKey, string> = {
    VOID: "Pure black & orange. The original.",
    DUSK: "Deep charcoal. Subtle cool grays.",
    CHALK: "Cream & black. Brutalist mono.",
    EMBER: "Warm cream & terracotta rust.",
    PASTEL: "Soft white & warm orange.",
    ACID: "Terminal green. Hacker mode.",
    FROST: "Cold blue. Clean & crisp.",
    NEON: "Deep purple. Synthwave vibes.",
    BATMAN: "Crimson & black. Fear is a tool.",
    ICE: "Clean white & blue. Pure clarity.",
    PURPLE: "Black & purple. Modern & smooth.",
    VINTAGE: "Retro editorial. Charcoal, record-store red, navy & cream.",
};

export default function SettingsPage() {
    const router = useRouter();
    const { theme, themeKey, setTheme } = useTheme();

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleThemeSelect = (key: ThemeKey) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
        setTheme(key);
    };

    const styles = getStyles(theme);

    return (
        <View style={styles.root}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {/* Back */}
                    <View style={styles.backRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                            <Text style={styles.backIcon}>‹</Text>
                            <Text style={styles.backText}>MORE</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <View style={styles.titleRow}>
                        <View>
                            <View style={styles.pageTag}>
                                <View style={styles.tagDot} />
                                <Text style={styles.tagText}>PREFERENCES</Text>
                            </View>
                            <Text style={styles.pageTitle}>SETTINGS</Text>
                        </View>
                    </View>

                    {/* Active theme strip */}
                    <View style={styles.activeStrip}>
                        <View>
                            <Text style={styles.activeLabel}>ACTIVE THEME</Text>
                            <Text style={styles.activeName}>{themeKey}</Text>
                            <Text style={styles.activeDesc}>{THEME_DESCRIPTIONS[themeKey]}</Text>
                        </View>
                        <View style={styles.swatches}>
                            {[theme.accent, theme.textPrimary, theme.bgCard, theme.bg].map((c, i) => (
                                <View key={i} style={[styles.swatch, { backgroundColor: c, borderColor: theme.border }]} />
                            ))}
                        </View>
                    </View>

                    {/* Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>SELECT THEME</Text>
                        <View style={styles.sectionLine} />
                    </View>

                    {/* Theme cards */}
                    <View style={styles.grid}>
                        {ALL_THEME_KEYS.map((key, idx) => {
                            const t = THEMES[key];
                            const isActive = key === themeKey;

                            // Alternate card surfaces where a theme defines two distinct
                            // colors (e.g. VINTAGE: navy → cream → navy → cream).
                            // Themes with cardPrimary === cardSecondary render unchanged.
                            const onSecondary = idx % 2 === 1 && t.cardSecondary !== t.cardPrimary;
                            const cardBg = onSecondary ? t.cardSecondary : t.cardPrimary;
                            const nameColor = isActive ? t.accent : (onSecondary ? t.textOnSecondary : t.textPrimary);
                            const descColor = onSecondary ? t.textOnSecondary : t.textMuted;

                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.themeCard,
                                        {
                                            backgroundColor: cardBg,
                                            borderColor: isActive ? t.accent : t.border,
                                            borderWidth: isActive ? 2 : 1,
                                        },
                                    ]}
                                    onPress={() => handleThemeSelect(key)}
                                    activeOpacity={0.8}
                                >
                                    {/* Mini preview — always shows the theme's real app background,
                                        independent of which card surface this tile happens to sit on */}
                                    <View style={[styles.preview, { backgroundColor: t.bg }]}>
                                        <View style={[styles.previewAccent, { backgroundColor: t.accent }]} />
                                        <View style={styles.previewLines}>
                                            <View style={[styles.previewLine, { backgroundColor: t.textPrimary, width: "65%" }]} />
                                            <View style={[styles.previewLine, { backgroundColor: t.textMuted, width: "42%" }]} />
                                            <View style={[styles.previewLine, { backgroundColor: t.textMuted, width: "55%" }]} />
                                        </View>
                                        <View style={[styles.previewDot, { backgroundColor: t.accent }]} />
                                    </View>

                                    {/* Info */}
                                    <View style={styles.cardInfo}>
                                        <View style={styles.cardTop}>
                                            <Text style={[styles.cardName, { color: nameColor }]}>
                                                {key}
                                            </Text>
                                            {isActive && (
                                                <View style={[styles.activeBadge, { backgroundColor: t.accent }]}>
                                                    <Text style={[styles.activeBadgeText, { color: t.bg }]}>ON</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.cardDesc, { color: descColor, opacity: onSecondary ? 0.75 : 1 }]}>
                                            {THEME_DESCRIPTIONS[key]}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>FRICKED</Text>
                    </View>
                </ScrollView>
            </Animated.View>

            <TabBar />
        </View>
    );
}

function getStyles(theme: ReturnType<typeof useTheme>["theme"]) {
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: theme.bg },
        scroll: { flex: 1, paddingHorizontal: 16 },
        backRow: { paddingTop: 20, paddingBottom: 4 },
        backBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
        backIcon: { fontSize: 22, fontWeight: "300", lineHeight: 24, color: theme.accent },
        backText: { fontSize: 9, fontWeight: "900", letterSpacing: 2, color: theme.textMuted },
        titleRow: { flexDirection: "row", alignItems: "flex-end", paddingBottom: 20 },
        pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
        tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.accent },
        tagText: { fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 4, color: theme.textMuted },
        pageTitle: { fontSize: 48, fontWeight: "900", letterSpacing: -2, lineHeight: 56, color: theme.textPrimary },
        activeStrip: {
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 14, paddingVertical: 14,
            borderWidth: 1, borderLeftWidth: 3,
            borderColor: theme.border, borderLeftColor: theme.accent,
            backgroundColor: theme.bgCard, marginBottom: 20,
        },
        activeLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 2, color: theme.textMuted },
        activeName: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginTop: 2, color: theme.accent },
        activeDesc: { fontSize: 9, color: theme.textMuted, marginTop: 2 },
        swatches: { flexDirection: "row", gap: 6 },
        swatch: { width: 18, height: 18, borderWidth: 1 },
        sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
        sectionLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 3, color: theme.textMuted },
        sectionLine: { flex: 1, height: 1, backgroundColor: theme.border },
        grid: { gap: 10, marginBottom: 24 },
        themeCard: { overflow: "hidden" },
        preview: { height: 52, flexDirection: "row", padding: 10, gap: 8 },
        previewAccent: { width: 3, height: "100%" },
        previewLines: { flex: 1, justifyContent: "center", gap: 5 },
        previewLine: { height: 2, borderRadius: 1 },
        previewDot: { width: 8, height: 8, borderRadius: 4, alignSelf: "flex-start", marginTop: 2 },
        cardInfo: { paddingHorizontal: 14, paddingVertical: 12 },
        cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
        cardName: { fontSize: 11, fontWeight: "900", letterSpacing: 2 },
        activeBadge: { paddingHorizontal: 6, paddingVertical: 2 },
        activeBadgeText: { fontSize: 7, fontWeight: "900", letterSpacing: 1 },
        cardDesc: { fontSize: 9, fontWeight: "500", letterSpacing: 0.3 },
        footer: { alignItems: "center", paddingVertical: 32 },
        footerText: { fontSize: 9, fontWeight: "900", letterSpacing: 5, color: theme.textDead },
    });
}