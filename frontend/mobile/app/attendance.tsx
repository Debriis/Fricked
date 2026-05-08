import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated, Dimensions,
    StatusBar, TextInput, RefreshControl,
} from "react-native";
import { getAttendance } from "../utils/api";
import { getToken, clearToken } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";
import { useTheme } from "../utils/ThemeContext";

const { width } = Dimensions.get("window");

type Subject = {
    courseCode: string;
    courseTitle: string;
    hoursConducted: string;
    hoursAbsent: string;
    attendancePercentage: string;
    facultyName: string;
};

export default function AttendancePage() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [attendance, setAttendance] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "low" | "ok">("all");
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const fetchData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        const token = await getToken();
        if (!token) { router.replace("/"); return; }
        try {
            const res = await getAttendance(token);
            setAttendance(res.data?.attendance || []);
            setError("");
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to load attendance");
        } finally {
            setLoading(false);
            setRefreshing(false);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start();
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = () => { setRefreshing(true); fetchData(true); };

    const getColor = (pct: string) => {
        const n = parseFloat(pct);
        if (n >= 75) return theme.textPrimary;
        if (n >= 60) return theme.accent;
        return theme.danger;
    };

    const overallAvg = attendance.length > 0
        ? attendance.reduce((sum, s) => sum + parseFloat(s.attendancePercentage || "0"), 0) / attendance.length
        : 0;

    const criticalCount = attendance.filter(s => parseFloat(s.attendancePercentage) < 75).length;

    const filtered = attendance.filter(s => {
        const pct = parseFloat(s.attendancePercentage);
        const matchesSearch =
            s.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
            s.courseCode.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filter === "all" ||
            (filter === "low" && pct < 75) ||
            (filter === "ok" && pct >= 75);
        return matchesSearch && matchesFilter;
    });

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>FETCHING ATTENDANCE</Text>
            </View>
        );

    if (error)
        return (
            <View style={styles.center}>
                <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
                <Text style={styles.errorCode}>ERR_LOAD</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
                    <Text style={styles.retryText}>RETRY ↺</Text>
                </TouchableOpacity>
            </View>
        );

    return (
        <View style={styles.root}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />


            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
                }
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.pageTag}>
                            <View style={styles.tagDot} />
                            <Text style={styles.tagText}>ATTENDANCE TRACKER</Text>
                        </View>
                        <Text style={styles.pageTitle}>PRESENCE</Text>
                    </View>
                    {/* <View style={styles.overallBadge}>
                        <Text style={styles.overallNum}>{overallAvg.toFixed(0)}</Text>
                        <Text style={styles.overallUnit}>%</Text>
                    </View> */}
                </Animated.View>

                {/* Summary row */}
                <Animated.View style={[styles.summaryRow, { opacity: fadeAnim }]}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNum}>{attendance.length}</Text>
                        <Text style={styles.summaryLabel}>SUBJECTS</Text>
                    </View>
                    <View style={[styles.summaryCard, criticalCount > 0 && styles.summaryCardCritical]}>
                        <Text style={[styles.summaryNum, criticalCount > 0 && { color: theme.danger }]}>
                            {criticalCount}
                        </Text>
                        <Text style={styles.summaryLabel}>CRITICAL</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNum}>{attendance.length - criticalCount}</Text>
                        <Text style={styles.summaryLabel}>SAFE</Text>
                    </View>
                </Animated.View>

                {/* Overall bar */}
                <View style={styles.overallBarSection}>
                    <View style={styles.overallBarBg}>
                        <Animated.View
                            style={[styles.overallBarFill, {
                                width: `${Math.min(overallAvg, 100)}%` as any,
                                backgroundColor: overallAvg >= 75 ? theme.accent : overallAvg >= 60 ? theme.accent + "88" : theme.danger
                            }]}
                        />
                    </View>
                    <Text style={styles.overallBarLabel}>OVERALL — {overallAvg.toFixed(1)}%</Text>
                </View>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>⌕</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="SEARCH SUBJECTS..."
                        placeholderTextColor={theme.borderStrong}
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="characters"
                    />
                </View>

                {/* Filter chips */}
                <View style={styles.filterRow}>
                    {(["all", "low", "ok"] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.filterChipActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                                {f === "all" ? "ALL" : f === "low" ? "⚠ CRITICAL" : "✓ SAFE"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Section heading */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>SUBJECT BREAKDOWN</Text>
                    <Text style={styles.sectionCount}>{filtered.length} / {attendance.length}</Text>
                </View>

                {/* Cards */}
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyCode}>∅</Text>
                        <Text style={styles.emptyText}>NO SUBJECTS FOUND</Text>
                    </View>
                ) : (
                    filtered.map((sub, idx) => {
                        const pct = parseFloat(sub.attendancePercentage);
                        const color = getColor(sub.attendancePercentage);
                        const attended = parseFloat(sub.hoursConducted) - parseFloat(sub.hoursAbsent);
                        const isCritical = pct < 75;

                        // Classes to miss / attend calculation
                        const conducted = parseFloat(sub.hoursConducted);
                        const absent = parseFloat(sub.hoursAbsent);
                        let actionText = "";
                        if (isCritical) {
                            // Need 75%: (attended + x) / (conducted + x) >= 0.75
                            const toAttend = Math.ceil((0.75 * conducted - attended) / 0.25);
                            actionText = `ATTEND ${toAttend} MORE`;
                        } else {
                            // Can miss: (attended) / (conducted + x) >= 0.75
                            const canMiss = Math.floor((attended - 0.75 * conducted) / 0.75);
                            actionText = `CAN MISS ${canMiss}`;
                        }

                        return (
                            <Animated.View
                                key={sub.courseCode + idx}
                                style={[
                                    styles.card,
                                    isCritical && styles.cardCritical,
                                    { opacity: fadeAnim },
                                ]}
                            >
                                <Text style={styles.cardIndex}>{String(idx + 1).padStart(2, "0")}</Text>

                                <View style={styles.cardTop}>
                                    <View style={styles.cardLeft}>
                                        <Text style={styles.cardCode}>{sub.courseCode}</Text>
                                        <Text style={styles.cardTitle}>{sub.courseTitle}</Text>
                                        <Text style={styles.cardFaculty}>{sub.facultyName}</Text>
                                    </View>
                                    <View style={[styles.pctBlock, { borderColor: color + "33" }]}>
                                        <Text style={[styles.pctBig, { color }]}>{pct.toFixed(0)}</Text>
                                        <Text style={[styles.pctUnit, { color }]}>%</Text>
                                    </View>
                                </View>

                                {/* Segmented progress bar */}
                                <View style={styles.segBar}>
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.seg,
                                                {
                                                    backgroundColor: (i + 1) * 5 <= pct
                                                        ? (pct >= 75 ? theme.accent : pct >= 60 ? theme.accent + "66" : "#ff333366")
                                                        : theme.textDead,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardStat}>
                                        {attended.toFixed(0)}/{sub.hoursConducted} HRS
                                    </Text>
                                    <Text style={styles.cardStat}>
                                        {sub.hoursAbsent} ABSENT
                                    </Text>
                                    <View style={[styles.actionChip, isCritical && styles.actionChipCritical]}>
                                        <Text style={[styles.actionText, isCritical && styles.actionTextCritical]}>
                                            {actionText}
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })
                )}
            </ScrollView>

            <TabBar />
        </View>
    );
}

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: theme.bg },
        center: { flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center", gap: 12 },

        scroll: { flex: 1, paddingHorizontal: 16 },

        loadingText: { color: theme.textMuted, fontSize: 10, letterSpacing: 3, fontWeight: "900", marginTop: 12 },
        errorCode: { color: theme.danger, fontSize: 32, fontWeight: "900", letterSpacing: -1 },
        errorText: { color: theme.textMuted, fontSize: 12, letterSpacing: 0.5 },
        retryBtn: { marginTop: 16, borderWidth: 1, borderColor: theme.accent, paddingHorizontal: 20, paddingVertical: 10 },
        retryText: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 },

        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 20,
            paddingBottom: 20,
        },
        pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
        tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.accent },
        tagText: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 15 },
        pageTitle: { color: theme.textPrimary, fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 10 },
        overallBadge: {
            flexDirection: "row",
            alignItems: "flex-end",
            borderLeftWidth: 3,
            borderLeftColor: theme.accent,
            paddingLeft: 10,
        },
        overallNum: { color: theme.accent, fontSize: 42, fontWeight: "900", letterSpacing: -2 },
        overallUnit: { color: theme.accent, fontSize: 16, fontWeight: "700", marginBottom: 6, marginLeft: 2 },

        summaryRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
        summaryCard: {
            flex: 1,
            backgroundColor: theme.bgCard,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 12,
            alignItems: "center",
        },
        summaryCardCritical: { borderColor: "#ff333333", backgroundColor: theme.dangerBg },
        summaryNum: { color: theme.textPrimary, fontSize: 24, fontWeight: "900", letterSpacing: -1 },
        summaryLabel: { color: theme.textMuted, fontSize: 7, fontWeight: "900", letterSpacing: 2, marginTop: 2 },

        overallBarSection: { marginBottom: 16 },
        overallBarBg: { height: 3, backgroundColor: theme.textDead, marginBottom: 6 },
        overallBarFill: { height: 3 },
        overallBarLabel: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2 },

        searchBox: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.bgCard,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 14,
            marginBottom: 12,
            gap: 10,
        },
        searchIcon: { color: theme.textMuted, fontSize: 16 },
        searchInput: {
            flex: 1,
            color: theme.textPrimary,
            fontSize: 12,
            paddingVertical: 14,
            fontWeight: "700",
            letterSpacing: 1,
        },

        filterRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
        filterChip: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.bgCard,
        },
        filterChipActive: { borderColor: theme.accent, backgroundColor: theme.accentBg },
        filterLabel: { color: theme.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
        filterLabelActive: { color: theme.accent },

        sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
        sectionLabel: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 3 },
        sectionCount: { color: theme.textDead, fontSize: 8, fontWeight: "700", letterSpacing: 1 },

        emptyState: { alignItems: "center", paddingVertical: 60 },
        emptyCode: { color: theme.textDead, fontSize: 64, fontWeight: "900" },
        emptyText: { color: theme.textMuted, fontSize: 11, letterSpacing: 3, marginTop: 4 },

        card: {
            backgroundColor: theme.bgCard,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginBottom: 10,
            position: "relative",
        },
        cardCritical: {
            borderColor: theme.danger + "22",
            backgroundColor: theme.dangerBg,
            borderLeftWidth: 3,
            borderLeftColor: theme.danger,
        },
        cardIndex: {
            position: "absolute", top: 10, right: 12,
            color: theme.textDead, fontSize: 10, fontWeight: "900", letterSpacing: 1,
        },
        cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
        cardLeft: { flex: 1, marginRight: 12 },
        cardCode: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
        cardTitle: { color: theme.textPrimary, fontSize: 14, fontWeight: "700", lineHeight: 19, marginBottom: 4, letterSpacing: -0.3 },
        cardFaculty: { color: theme.textMuted, fontSize: 10, letterSpacing: 0.3 },
        pctBlock: {
            width: 56, height: 56,
            borderWidth: 1,
            justifyContent: "center",
            backgroundColor: theme.bgStrip,
            flexDirection: "row",
            alignItems: "flex-end",
            paddingBottom: 6,
        },
        pctBig: { fontSize: 22, fontWeight: "900", letterSpacing: -1, lineHeight: 26 },
        pctUnit: { fontSize: 10, fontWeight: "700", marginBottom: 1, marginLeft: 1 },

        segBar: { flexDirection: "row", gap: 2, marginBottom: 12 },
        seg: { flex: 1, height: 3, borderRadius: 1 },

        cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        cardStat: { color: theme.textMuted, fontSize: 9, letterSpacing: 1, fontWeight: "700" },
        actionChip: {
            backgroundColor: theme.accentBg,
            borderWidth: 1,
            borderColor: theme.borderStrong,
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        actionChipCritical: { backgroundColor: theme.dangerBg, borderColor: theme.dangerBg },
        actionText: { color: theme.goodColor, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
        actionTextCritical: { color: theme.danger },
    });
}