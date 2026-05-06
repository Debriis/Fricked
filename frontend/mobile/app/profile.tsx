import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated,
    StatusBar, Alert,
} from "react-native";
import { getProfile } from "../utils/api";
import { getToken, removeToken } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";

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
                        router.replace("/");
                    },
                },
            ],
            { userInterfaceStyle: "dark" }
        );
    };

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <ActivityIndicator size="large" color="#ff6b2b" />
                <Text style={styles.loadingText}>LOADING PROFILE</Text>
            </View>
        );

    if (error)
        return (
            <View style={styles.center}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <Text style={styles.errorCode}>ERR_LOAD</Text>
                <Text style={styles.errorText}>{error}</Text>
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
        // { label: "MOBILE", value: profile?.mobile },
        { label: "DATE OF BIRTH", value: profile?.dob },
    ].filter((r) => r.value);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <View style={styles.topAccentBar} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.pageTag}>
                            <View style={styles.tagDot} />
                            <Text style={styles.tagText}>STUDENT IDENTITY</Text>
                        </View>
                        <Text style={styles.pageTitle}>PROFILE</Text>
                    </View>
                </Animated.View>

                {/* Avatar + Name block */}
                <Animated.View style={[styles.avatarBlock, { opacity: fadeAnim }]}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                        <View style={styles.avatarCornerTL} />
                        <View style={styles.avatarCornerBR} />
                    </View>
                    <View style={styles.nameBlock}>
                        <Text style={styles.studentName} numberOfLines={2}>
                            {profile?.name?.toUpperCase() || "STUDENT"}
                        </Text>
                        {profile?.cgpa ? (
                            <View style={styles.cgpaRow}>
                                <Text style={styles.cgpaLabel}>CGPA</Text>
                                <Text style={styles.cgpaValue}>{profile.cgpa}</Text>
                            </View>
                        ) : null}
                    </View>
                </Animated.View>

                {/* Reg strip */}
                {profile?.regNo && (
                    <Animated.View style={[styles.regStrip, { opacity: fadeAnim }]}>
                        <Text style={styles.regStripText}>{profile.regNo}</Text>
                    </Animated.View>
                )}

                {/* Info grid */}
                <Animated.View style={[styles.infoGrid, { opacity: fadeAnim }]}>
                    {INFO_ROWS.filter(r => r.label !== "REG NO").map((row, idx) => (
                        <View key={idx} style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{row.label}</Text>
                            <Text style={styles.infoValue} numberOfLines={2}>
                                {String(row.value)}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Logout */}
                <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                        <Text style={styles.logoutText}>LOGOUT ↗</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer watermark */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <Text style={styles.footerText}>FRICKED</Text>
                </Animated.View>
            </ScrollView>

            <TabBar />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000000" },
    center: { flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", gap: 12 },
    topAccentBar: { height: 2, backgroundColor: "#ff6b2b" },
    scroll: { flex: 1, paddingHorizontal: 16 },

    loadingText: { color: "#333", fontSize: 10, letterSpacing: 3, fontWeight: "900", marginTop: 12 },
    errorCode: { color: "#ff3333", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    errorText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },

    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
        paddingTop: 20, paddingBottom: 16,
    },
    pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#ff6b2b" },
    tagText: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 15 },
    pageTitle: { color: "#fff", fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 10 },

    avatarBlock: {
        flexDirection: "row", alignItems: "center", gap: 16,
        marginBottom: 16,
    },
    avatar: {
        width: 80, height: 80,
        backgroundColor: "#0d0d0d",
        borderWidth: 1, borderColor: "#ff6b2b",
        justifyContent: "center", alignItems: "center",
        position: "relative",
    },
    avatarCornerTL: {
        position: "absolute", top: -3, left: -3,
        width: 8, height: 8,
        borderTopWidth: 2, borderLeftWidth: 2,
        borderColor: "#ff6b2b",
    },
    avatarCornerBR: {
        position: "absolute", bottom: -3, right: -3,
        width: 8, height: 8,
        borderBottomWidth: 2, borderRightWidth: 2,
        borderColor: "#ff6b2b",
    },
    avatarText: { color: "#ff6b2b", fontSize: 28, fontWeight: "900", letterSpacing: -1 },
    nameBlock: { flex: 1 },
    studentName: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: -0.8, lineHeight: 22 },
    cgpaRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8 },
    cgpaLabel: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2 },
    cgpaValue: { color: "#ff6b2b", fontSize: 24, fontWeight: "900", letterSpacing: -1 },

    regStrip: {
        backgroundColor: "#080808",
        borderWidth: 1, borderColor: "#1a1a1a",
        paddingHorizontal: 14, paddingVertical: 8,
        marginBottom: 16,
        borderLeftWidth: 3, borderLeftColor: "#ff6b2b",
    },
    regStripText: { color: "#ff6b2b", fontSize: 11, fontWeight: "900", letterSpacing: 3 },

    infoGrid: {
        backgroundColor: "#080808",
        borderWidth: 1, borderColor: "#1a1a1a",
    },
    infoRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#111",
    },
    infoLabel: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2, flex: 1 },
    infoValue: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: -0.3, flex: 2, textAlign: "right" },

    logoutBtn: {
        borderWidth: 1, borderColor: "#ff3333",
        paddingVertical: 14, alignItems: "center",
        backgroundColor: "#080808",
    },
    logoutText: { color: "#ff3333", fontSize: 11, fontWeight: "900", letterSpacing: 3 },

    footer: { alignItems: "center", paddingVertical: 32 },
    footerText: { color: "#111", fontSize: 9, fontWeight: "900", letterSpacing: 5 },
});