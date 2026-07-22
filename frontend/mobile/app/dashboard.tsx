import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated,
    StatusBar, RefreshControl,
} from "react-native";
import { getAttendance, getMarks, getTimetable } from "../utils/api";
import { getToken } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";
import { useTheme } from "../utils/ThemeContext";

const PERIOD_TIME_BY_POSITION: string[] = [
    "08:00–08:50",
    "08:50–09:40",
    "09:45–10:35",
    "10:40–11:30",
    "11:35–12:25",
    "12:30–01:20",
    "01:25–02:15",
    "02:20–03:10",
    "03:10–04:00",
    "04:00–04:50",
    "04:50–05:30",
    "05:30–06:10",
];

// Real 24h start/end (in minutes) for each position, matching PERIOD_TIME_BY_POSITION order
const PERIOD_RANGES_MIN: [number, number][] = [
    [8 * 60, 8 * 60 + 50],        // 08:00–08:50
    [8 * 60 + 50, 9 * 60 + 40],   // 08:50–09:40
    [9 * 60 + 45, 10 * 60 + 35],  // 09:45–10:35
    [10 * 60 + 40, 11 * 60 + 30], // 10:40–11:30
    [11 * 60 + 35, 12 * 60 + 25], // 11:35–12:25
    [12 * 60 + 30, 13 * 60 + 20], // 12:30–01:20
    [13 * 60 + 25, 14 * 60 + 15], // 01:25–02:15
    [14 * 60 + 20, 15 * 60 + 10], // 02:20–03:10
    [15 * 60 + 10, 16 * 60],      // 03:10–04:00
    [16 * 60, 16 * 60 + 50],      // 04:00–04:50
    [16 * 60 + 50, 17 * 60 + 30], // 04:50–05:30
    [17 * 60 + 30, 18 * 60 + 10], // 05:30–06:10
];

function isMorningPeriod(timeStr: string): boolean {
    const startHour = parseInt(timeStr.split(/[–-]/)[0], 10);
    if (isNaN(startHour)) return true;
    if (startHour === 12) return false;
    if (startHour < 8) return false;
    return startHour >= 8 && startHour < 12;
}

function isPeriodActiveNow(periodIndex: number): boolean {
    const range = PERIOD_RANGES_MIN[periodIndex];
    if (!range) return false;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin >= range[0] && nowMin < range[1];
}

export default function DashboardPage() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [attendanceSummary, setAttendanceSummary] = useState<{ overall: number; low: number }>({ overall: 0, low: 0 });
    const [marksSummary, setMarksSummary] = useState<{ subjects: number; avgPct: number }>({ subjects: 0, avgPct: 0 });
    const [todayPeriods, setTodayPeriods] = useState<any[]>([]);
    const [greeting, setGreeting] = useState("");
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "GOOD MORNING";
        if (h < 17) return "GOOD AFTERNOON";
        return "GOOD EVENING";
    };

    const getTodayBackendDay = () => {
        const d = new Date().getDay();
        return d === 0 ? 1 : d;
    };

    const fetchAll = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        const token = await getToken();
        if (!token) { router.replace("/"); return; }

        setGreeting(getGreeting());

        try {
            const [attRes, marksRes, ttRes] = await Promise.allSettled([
                getAttendance(token),
                getMarks(token),
                getTimetable(token),
            ]);

            if (attRes.status === "fulfilled") {
                const subjects = attRes.value.data?.attendance || [];
                const totals = subjects.map((s: any) => {
                    const pct = parseFloat(s.attendancePercentage || "0");
                    return isNaN(pct) ? 0 : pct;
                });
                const overall = totals.length > 0
                    ? totals.reduce((a: number, b: number) => a + b, 0) / totals.length
                    : 0;
                const low = totals.filter((p: number) => p < 75).length;
                setAttendanceSummary({ overall: Math.round(overall), low });
            }

            if (marksRes.status === "fulfilled") {
                const subjects = marksRes.value.data?.marks || [];
                const pcts = subjects.map((s: any) => {
                    const scored = s.marks?.reduce((acc: number, m: any) => {
                        const n = parseFloat(m.marks); return acc + (isNaN(n) ? 0 : n);
                    }, 0) || 0;
                    const total = s.marks?.reduce((acc: number, m: any) => {
                        const n = parseFloat(m.totalMarks); return acc + (isNaN(n) ? 0 : n);
                    }, 0) || 0;
                    return total > 0 ? (scored / total) * 100 : 0;
                }).filter((p: number) => p > 0);
                const avgPct = pcts.length > 0
                    ? pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length
                    : 0;
                setMarksSummary({ subjects: subjects.length, avgPct: Math.round(avgPct) });
            }

            // Today's timetable — shows ALL periods for the day, no slicing.
            if (ttRes.status === "fulfilled") {
                const raw = ttRes.value.data?.schedule ?? ttRes.value.data ?? [];
                const todayBackendDay = getTodayBackendDay();
                const todaySchedule = Array.isArray(raw)
                    ? raw.find((s: any) => s?.day === todayBackendDay)
                    : undefined;

                const periods = (todaySchedule?.table ?? [])
                    .map((slot: any, idx: number) =>
                        slot ? { ...slot, time: PERIOD_TIME_BY_POSITION[idx] ?? "--", periodIndex: idx } : null
                    )
                    .filter((p: any) => p !== null);

                setTodayPeriods(periods);
            }

            setError("");
        } catch (e: any) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
            setRefreshing(false);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    };

    useEffect(() => { fetchAll(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchAll(true); };

    const attColor = attendanceSummary.overall >= 75
        ? theme.accent
        : attendanceSummary.overall >= 65
            ? theme.accent + "88"
            : theme.danger;

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>LOADING</Text>
            </View>
        );

    const hasLivePeriod = todayPeriods.some((p) => isPeriodActiveNow(p.periodIndex));

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
                {/* Greeting header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.pageTag}>
                        <View style={styles.tagDot} />
                        <Text style={styles.tagText}>{greeting}</Text>
                    </View>
                    <Text style={styles.pageTitle}>OVERVIEW</Text>
                    <Text style={styles.dateText}>{formatDate()}</Text>
                </Animated.View>

                {/* Stat cards row */}
                <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.statCard}
                        activeOpacity={0.8}
                        onPress={() => router.push("/attendance")}
                    >
                        <Text style={styles.statLabel}>ATTENDANCE</Text>
                        <Text style={[styles.statValue, { color: attColor }]}>
                            {attendanceSummary.overall}%
                        </Text>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, {
                                width: `${Math.min(attendanceSummary.overall, 100)}%` as any,
                                backgroundColor: attColor,
                            }]} />
                        </View>
                        {attendanceSummary.low > 0 && (
                            <Text style={styles.warningText}>⚠ {attendanceSummary.low} LOW</Text>
                        )}
                        <Text style={styles.cardArrow}>↗</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statCard}
                        activeOpacity={0.8}
                        onPress={() => router.push("/marks")}
                    >
                        <Text style={styles.statLabel}>AVG MARKS</Text>
                        <Text style={[styles.statValue, {
                            color: marksSummary.avgPct >= 80 ? theme.textPrimary
                                : marksSummary.avgPct >= 60 ? theme.accent
                                    : theme.danger
                        }]}>
                            {marksSummary.avgPct}%
                        </Text>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, {
                                width: `${Math.min(marksSummary.avgPct, 100)}%` as any,
                                backgroundColor: marksSummary.avgPct >= 80 ? theme.accent
                                    : marksSummary.avgPct >= 60 ? theme.accent + "66"
                                        : theme.danger,
                            }]} />
                        </View>
                        <Text style={styles.subStat}>{marksSummary.subjects} SUBJECTS</Text>
                        <Text style={styles.cardArrow}>↗</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Today's classes */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>TODAY'S CLASSES</Text>
                        <TouchableOpacity onPress={() => router.push("/timetable")}>
                            <Text style={styles.sectionLink}>VIEW ALL ↗</Text>
                        </TouchableOpacity>
                    </View>

                    {todayPeriods.length === 0 ? (
                        <View style={styles.noClass}>
                            <Text style={styles.noClassText}>NO CLASSES SCHEDULED</Text>
                        </View>
                    ) : (
                        todayPeriods.map((p, idx) => {
                            const isMorning = isMorningPeriod(p.time);
                            const cardBg = isMorning ? theme.cardSecondary : theme.cardPrimary;
                            const cardText = isMorning
                                ? theme.textOnSecondary
                                : (theme.textOnPrimary ?? theme.textPrimary);
                            const isLive = isPeriodActiveNow(p.periodIndex);
                            const faded = hasLivePeriod && !isLive;

                            return (
                                <View
                                    key={idx}
                                    style={[
                                        styles.classCard,
                                        { backgroundColor: cardBg, opacity: faded ? 0.35 : 1 },
                                        isLive && styles.classCardLive,
                                    ]}
                                >
                                    <View style={styles.classCardTopRow}>
                                        <Text style={[styles.classCardTime, { color: cardText }]}>
                                            {p.time}
                                        </Text>
                                        {p.roomNo && (
                                            <Text style={[styles.classCardRoom, { color: cardText }]}>
                                                {p.roomNo}
                                            </Text>
                                        )}
                                    </View>
                                    <Text
                                        style={[styles.classCardTitle, { color: cardText }]}
                                        numberOfLines={2}
                                    >
                                        {p.name}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </Animated.View>

                {/* Quick nav grid */}
                <Animated.View style={[styles.quickGrid, { opacity: fadeAnim }]}>
                    {[
                        { label: "ATTENDANCE", icon: "◈", route: "/attendance" },
                        { label: "MARKS", icon: "◉", route: "/marks" },
                        { label: "TIMETABLE", icon: "▦", route: "/timetable" },
                        { label: "PROFILE", icon: "◎", route: "/profile" },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.route}
                            style={styles.quickCard}
                            activeOpacity={0.8}
                            onPress={() => router.push(item.route as any)}
                        >
                            <Text style={styles.quickIcon}>{item.icon}</Text>
                            <Text style={styles.quickLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            </ScrollView>

            <TabBar />
        </View>
    );
}

function formatDate() {
    const now = new Date();
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: theme.bg },
        center: { flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center", gap: 12 },
        scroll: { flex: 1, paddingHorizontal: 16 },
        loadingText: { color: theme.textMuted, fontSize: 10, letterSpacing: 3, fontWeight: "900", marginTop: 12 },

        header: { paddingTop: 20, paddingBottom: 20 },
        pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
        tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.accent },
        tagText: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 20 },
        pageTitle: { color: theme.textPrimary, fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 20 },
        dateText: { color: theme.textDead, fontSize: 9, fontWeight: "900", letterSpacing: 2, marginTop: 4 },

        statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
        statCard: {
            flex: 1, backgroundColor: theme.bgCard,
            borderWidth: 1, borderColor: theme.border,
            padding: 14, position: "relative",
        },
        statLabel: { color: theme.textMuted, fontSize: 7, fontWeight: "900", letterSpacing: 2, marginBottom: 8 },
        statValue: { fontSize: 32, fontWeight: "900", letterSpacing: -1.5, marginBottom: 10 },
        progressBg: { height: 2, backgroundColor: theme.textDead, marginBottom: 8 },
        progressFill: { height: 2 },
        warningText: { color: theme.danger, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
        subStat: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
        cardArrow: { position: "absolute", top: 10, right: 12, color: theme.textDead, fontSize: 14, fontWeight: "900" },

        sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
        sectionTitle: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2.5 },
        sectionLink: { color: theme.accent, fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },

        noClass: {
            backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border,
            paddingVertical: 20, alignItems: "center", marginBottom: 20,
        },
        noClassText: { color: theme.textDead, fontSize: 10, fontWeight: "900", letterSpacing: 2 },

        // --- Class card, shrunk down + live-highlight support ---
        classCard: {
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 8,
        },
        classCardLive: {
            borderWidth: 1.5,
            borderColor: theme.accent,
        },
        classCardTopRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
        },
        classCardTime: {
            fontSize: 11,
            fontWeight: "500",
        },
        classCardRoom: {
            fontSize: 11,
            fontWeight: "900",
        },
        classCardTitle: {
            fontSize: 15,
            fontWeight: "900",
            letterSpacing: -0.3,
            lineHeight: 18,
        },

        quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20, marginBottom: 10 },
        quickCard: {
            width: "47%", backgroundColor: theme.bgCard,
            borderWidth: 1, borderColor: theme.border,
            paddingVertical: 20, paddingHorizontal: 16, alignItems: "flex-start",
        },
        quickIcon: { color: theme.accent, fontSize: 20, marginBottom: 10 },
        quickLabel: { color: theme.textPrimary, fontSize: 9, fontWeight: "900", letterSpacing: 2 },
    });
}