import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated,
    StatusBar, Alert,
} from "react-native";
import { getProfile } from "../utils/api";
import { getToken, removeToken, clearCredentials } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";
import { useTheme } from "../utils/ThemeContext";

type ProfileData = {
    name?: string;
    regNo?: string;
    email?: string;
    department?: string;
    semester?: string;
    section?: string;
    batch?: string;
    program?: string;
    cgpa?: string | number;
};

type MenuRow = {
    id: string;
    label: string;
    sublabel: string;
    icon: string;
    onPress: () => void;
    danger?: boolean;
};

export default function MorePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { theme } = useTheme();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (!token) { router.replace("/"); return; }
            try {
                const res = await getProfile(token);
                setProfile(res.data?.profile || res.data || {});
            } catch {
                setProfile({});
            } finally {
                setLoading(false);
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                ]).start();
            }
        })();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "LOGOUT",
            "Are you sure you want to log out?",
            [
                { text: "CANCEL", style: "cancel" },
                {
                    text: "LOGOUT",
                    style: "destructive",
                    onPress: async () => {
                        await removeToken();
                        await clearCredentials();
                        router.dismissAll();
                        router.replace("/");
                    },
                },
            ],
            { userInterfaceStyle: "dark" }
        );
    };

    const handleRemoveProfile = () => {
        Alert.alert(
            "REMOVE PROFILE",
            "This will clear your saved credentials. You'll need to log in manually next time.",
            [
                { text: "CANCEL", style: "cancel" },
                {
                    text: "REMOVE",
                    style: "destructive",
                    onPress: async () => {
                        await clearCredentials();
                        await removeToken();
                        router.dismissAll();
                        router.replace("/");
                    },
                },
            ],
            { userInterfaceStyle: "dark" }
        );
    };

    const MENU_ROWS: MenuRow[] = [
        {
            id: "profile",
            label: "PROFILE",
            sublabel: "View your student identity",
            icon: "◎",
            onPress: () => router.push("/profile"),
        },
        {
            id: "settings",
            label: "SETTINGS",
            sublabel: "Themes, display preferences",
            icon: "◈",
            onPress: () => router.push("/settings"),
        },
        {
            id: "remove",
            label: "REMOVE PROFILE",
            sublabel: "Clear saved credentials",
            icon: "⊗",
            onPress: handleRemoveProfile,
            danger: true,
        },
        {
            id: "logout",
            label: "LOGOUT",
            sublabel: "End current session",
            icon: "↗",
            onPress: handleLogout,
            danger: true,
        },
    ];

    const initials = (profile?.name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <View style={[styles.root, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.pageTag}>
                            <View style={[styles.tagDot, { backgroundColor: theme.accent }]} />
                            <Text style={[styles.tagText, { color: theme.textMuted }]}>NAVIGATION</Text>
                        </View>
                        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>MORE</Text>
                    </View>
                </Animated.View>

                {/* Profile mini-card */}
                {loading ? (
                    <View style={[styles.miniCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                        <ActivityIndicator size="small" color={theme.accent} />
                    </View>
                ) : profile ? (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <TouchableOpacity
                            style={[styles.miniCard, { backgroundColor: theme.bgCard, borderColor: theme.border, borderLeftColor: theme.accent }]}
                            onPress={() => router.push("/profile")}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.miniAvatar, { backgroundColor: theme.bgStrip, borderColor: theme.accent }]}>
                                <Text style={[styles.miniAvatarText, { color: theme.accent }]}>{initials}</Text>
                            </View>
                            <View style={styles.miniInfo}>
                                <Text style={[styles.miniName, { color: theme.textPrimary }]} numberOfLines={1}>
                                    {profile.name?.toUpperCase() || "STUDENT"}
                                </Text>
                                <Text style={[styles.miniReg, { color: theme.textMuted }]}>
                                    {profile.regNo || ""}
                                </Text>
                            </View>
                            {profile.cgpa ? (
                                <View style={styles.miniCgpa}>
                                    <Text style={[styles.miniCgpaLabel, { color: theme.textMuted }]}>CGPA</Text>
                                    <Text style={[styles.miniCgpaVal, { color: theme.accent }]}>{profile.cgpa}</Text>
                                </View>
                            ) : null}
                            <Text style={[styles.miniChevron, { color: theme.textMuted }]}>›</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : null}

                {/* Section label */}
                <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
                    <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>OPTIONS</Text>
                    <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
                </Animated.View>

                {/* Menu rows */}
                <Animated.View style={[styles.menuBlock, { opacity: fadeAnim, backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    {MENU_ROWS.map((row, idx) => (
                        <TouchableOpacity
                            key={row.id}
                            style={[
                                styles.menuRow,
                                { borderBottomColor: theme.border },
                                idx === MENU_ROWS.length - 1 && { borderBottomWidth: 0 },
                            ]}
                            onPress={row.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { borderColor: row.danger ? theme.danger : theme.border }]}>
                                <Text style={[styles.menuIconText, { color: row.danger ? theme.danger : theme.accent }]}>
                                    {row.icon}
                                </Text>
                            </View>
                            <View style={styles.menuText}>
                                <Text style={[styles.menuLabel, { color: row.danger ? theme.danger : theme.textPrimary }]}>
                                    {row.label}
                                </Text>
                                <Text style={[styles.menuSub, { color: theme.textMuted }]}>
                                    {row.sublabel}
                                </Text>
                            </View>
                            <Text style={[styles.menuChevron, { color: row.danger ? theme.danger : theme.textMuted }]}>›</Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <Text style={[styles.footerText, { color: theme.textDead }]}>FRICKED</Text>
                </Animated.View>
            </ScrollView>

            <TabBar />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1, paddingHorizontal: 16 },

    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
        paddingTop: 20, paddingBottom: 16,
    },
    pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    tagDot: { width: 5, height: 5, borderRadius: 2.5 },
    tagText: { fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 15 },
    pageTitle: { fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 10 },

    miniCard: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 14, paddingVertical: 14,
        borderWidth: 1, borderLeftWidth: 3,
        marginBottom: 20,
    },
    miniAvatar: {
        width: 44, height: 44,
        borderWidth: 1,
        justifyContent: "center", alignItems: "center",
    },
    miniAvatarText: { fontSize: 16, fontWeight: "900", letterSpacing: -0.5 },
    miniInfo: { flex: 1 },
    miniName: { fontSize: 13, fontWeight: "900", letterSpacing: -0.5 },
    miniReg: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
    miniCgpa: { alignItems: "center", marginRight: 8 },
    miniCgpaLabel: { fontSize: 7, fontWeight: "900", letterSpacing: 1.5 },
    miniCgpaVal: { fontSize: 18, fontWeight: "900", letterSpacing: -1 },
    miniChevron: { fontSize: 20, fontWeight: "300" },

    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    sectionLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 3 },
    sectionLine: { flex: 1, height: 1 },

    menuBlock: {
        borderWidth: 1,
        marginBottom: 24,
    },
    menuRow: {
        flexDirection: "row", alignItems: "center", gap: 14,
        paddingHorizontal: 14, paddingVertical: 16,
        borderBottomWidth: 1,
    },
    menuIcon: {
        width: 36, height: 36,
        borderWidth: 1,
        justifyContent: "center", alignItems: "center",
    },
    menuIconText: { fontSize: 14 },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
    menuSub: { fontSize: 9, fontWeight: "500", letterSpacing: 0.5, marginTop: 2 },
    menuChevron: { fontSize: 20, fontWeight: "300" },

    footer: { alignItems: "center", paddingVertical: 32 },
    footerText: { fontSize: 9, fontWeight: "900", letterSpacing: 5 },
});
