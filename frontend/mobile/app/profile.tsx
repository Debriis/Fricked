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
    dob?: string;
    mobile?: string;
    cgpa?: string | number;
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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
            } catch (e: any) {
                setError(e?.response?.data?.error || "Failed to load profile");
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

    if (loading)
        return (
            <View style={[styles.center, { backgroundColor: theme.bg }]}>
                <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loadingText, { color: theme.textMuted }]}>LOADING PROFILE</Text>
            </View>
        );

    if (error)
        return (
            <View style={[styles.center, { backgroundColor: theme.bg }]}>
                <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
                <Text style={[styles.errorCode, { color: theme.danger }]}>ERR_LOAD</Text>
                <Text style={[styles.errorText, { color: theme.textMuted }]}>{error}</Text>
            </View>
        );

    const initials = (profile?.name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const INFO_ROWS: { label: string; value?: string | number }[] = [
        { label: "REG NO", value: profile?.regNo },
        { label: "PROGRAM", value: profile?.program },
        { label: "DEPARTMENT", value: profile?.department },
        { label: "SEMESTER", value: profile?.semester },
        { label: "SECTION", value: profile?.section },
        { label: "BATCH", value: profile?.batch },
        { label: "EMAIL", value: profile?.email },
        { label: "DATE OF BIRTH", value: profile?.dob },
    ].filter((r) => r.value);

    return (
        <View style={[styles.root, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Back to More */}
                <View style={styles.backRow}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.backIcon, { color: theme.accent }]}>‹</Text>
                        <Text style={[styles.backText, { color: theme.textMuted }]}>MORE</Text>
                    </TouchableOpacity>
                </View>

                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.pageTag}>
                            <View style={[styles.tagDot, { backgroundColor: theme.accent }]} />
                            <Text style={[styles.tagText, { color: theme.textMuted }]}>STUDENT IDENTITY</Text>
                        </View>
                        <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>PROFILE</Text>
                    </View>
                </Animated.View>

                {/* Avatar + Name block */}
                <Animated.View style={[styles.avatarBlock, { opacity: fadeAnim }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.bgStrip, borderColor: theme.accent }]}>
                        <Text style={[styles.avatarText, { color: theme.accent }]}>{initials}</Text>
                        <View style={[styles.avatarCornerTL, { borderColor: theme.accent }]} />
                        <View style={[styles.avatarCornerBR, { borderColor: theme.accent }]} />
                    </View>
                    <View style={styles.nameBlock}>
                        <Text style={[styles.studentName, { color: theme.textPrimary }]} numberOfLines={2}>
                            {profile?.name?.toUpperCase() || "STUDENT"}
                        </Text>
                        {profile?.cgpa ? (
                            <View style={styles.cgpaRow}>
                                <Text style={[styles.cgpaLabel, { color: theme.textMuted }]}>CGPA</Text>
                                <Text style={[styles.cgpaValue, { color: theme.accent }]}>{profile.cgpa}</Text>
                            </View>
                        ) : null}
                    </View>
                </Animated.View>

                {/* Reg strip */}
                {profile?.regNo && (
                    <Animated.View style={[styles.regStrip, { opacity: fadeAnim, backgroundColor: theme.bgCard, borderColor: theme.border, borderLeftColor: theme.accent }]}>
                        <Text style={[styles.regStripText, { color: theme.accent }]}>{profile.regNo}</Text>
                    </Animated.View>
                )}

                {/* Info grid */}
                <Animated.View style={[styles.infoGrid, { opacity: fadeAnim, backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    {INFO_ROWS.filter(r => r.label !== "REG NO").map((row, idx) => (
                        <View key={idx} style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{row.label}</Text>
                            <Text style={[styles.infoValue, { color: theme.textPrimary }]} numberOfLines={2}>
                                {String(row.value)}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Logout */}
                <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
                    <TouchableOpacity
                        style={[styles.logoutBtn, { borderColor: theme.danger, backgroundColor: theme.bgCard }]}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.logoutText, { color: theme.danger }]}>LOGOUT ↗</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer watermark */}
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
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    scroll: { flex: 1, paddingHorizontal: 16 },

    loadingText: { fontSize: 10, letterSpacing: 3, fontWeight: "900", marginTop: 12 },
    errorCode: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    errorText: { fontSize: 12, letterSpacing: 0.5 },

    backRow: { paddingTop: 20, paddingBottom: 4 },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
    backIcon: { fontSize: 22, fontWeight: "300", lineHeight: 24 },
    backText: { fontSize: 9, fontWeight: "900", letterSpacing: 2 },

    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
        paddingBottom: 16,
    },
    pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    tagDot: { width: 5, height: 5, borderRadius: 2.5 },
    tagText: { fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 4 },
    pageTitle: { fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72 },

    avatarBlock: {
        flexDirection: "row", alignItems: "center", gap: 16,
        marginBottom: 16,
    },
    avatar: {
        width: 80, height: 80,
        borderWidth: 1,
        justifyContent: "center", alignItems: "center",
        position: "relative",
    },
    avatarCornerTL: {
        position: "absolute", top: -3, left: -3,
        width: 8, height: 8,
        borderTopWidth: 2, borderLeftWidth: 2,
    },
    avatarCornerBR: {
        position: "absolute", bottom: -3, right: -3,
        width: 8, height: 8,
        borderBottomWidth: 2, borderRightWidth: 2,
    },
    avatarText: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
    nameBlock: { flex: 1 },
    studentName: { fontSize: 18, fontWeight: "900", letterSpacing: -0.8, lineHeight: 22 },
    cgpaRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8 },
    cgpaLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 2 },
    cgpaValue: { fontSize: 24, fontWeight: "900", letterSpacing: -1 },

    regStrip: {
        borderWidth: 1,
        paddingHorizontal: 14, paddingVertical: 8,
        marginBottom: 16,
        borderLeftWidth: 3,
    },
    regStripText: { fontSize: 11, fontWeight: "900", letterSpacing: 3 },

    infoGrid: { borderWidth: 1 },
    infoRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1,
    },
    infoLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 2, flex: 1 },
    infoValue: { fontSize: 12, fontWeight: "700", letterSpacing: -0.3, flex: 2, textAlign: "right" },

    logoutBtn: {
        borderWidth: 1,
        paddingVertical: 14, alignItems: "center",
    },
    logoutText: { fontSize: 11, fontWeight: "900", letterSpacing: 3 },

    footer: { alignItems: "center", paddingVertical: 32 },
    footerText: { fontSize: 9, fontWeight: "900", letterSpacing: 5 },
});
