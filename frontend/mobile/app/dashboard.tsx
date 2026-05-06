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

export default function DashboardPage() {
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

    const getTodayKey = () => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[new Date().getDay()];
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

            // Attendance summary
            if (attRes.status === "fulfilled") {
                const subjects = attRes.value.data?.attendance || [];
                const totals = subjects.map((s: any) => {
                    const pct = parseFloat(s.attendancePercentage || s.percentage || "0");
                    return pct;
                });
                const overall = totals.length > 0
                    ? totals.reduce((a: number, b: number) => a + b, 0) / totals.length
                    : 0;
                const low = totals.filter((p: number) => p < 75).length;
                setAttendanceSummary({ overall: Math.round(overall), low });
            }

            // Marks summary
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

            // Today's timetable
            if (ttRes.status === "fulfilled") {
                const raw = ttRes.value.data?.timetable || ttRes.value.data?.schedule || ttRes.value.data || [];
                const todayKey = getTodayKey();
                const todaySchedule = raw.find(
                    (s: any) => s.day?.toLowerCase().startsWith(todayKey.toLowerCase().slice(0, 3))
                );
                setTodayPeriods(todaySchedule?.periods?.slice(0, 4) || []);
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
        ? "#ff6b2b"
        : attendanceSummary.overall >= 65
            ? "#ff6b2b88"
            : "#ff3333";

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <ActivityIndicator size="large" color="#ff6b2b" />
                <Text style={styles.loadingText}>LOADING</Text>
            </View>
        );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <View style={styles.topAccentBar} />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b2b" />
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
                    {/* Attendance card */}
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
                            <View style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(attendanceSummary.overall, 100)}%` as any,
                                    backgroundColor: attColor,
                                }
                            ]} />
                        </View>
                        {attendanceSummary.low > 0 && (
                            <Text style={styles.warningText}>
                                ⚠ {attendanceSummary.low} LOW
                            </Text>
                        )}
                        <Text style={styles.cardArrow}>↗</Text>
                    </TouchableOpacity>

                    {/* Marks card */}
                    <TouchableOpacity
                        style={styles.statCard}
                        activeOpacity={0.8}
                        onPress={() => router.push("/marks")}
                    >
                        <Text style={styles.statLabel}>AVG MARKS</Text>
                        <Text style={[styles.statValue, {
                            color: marksSummary.avgPct >= 80 ? "#fff"
                                : marksSummary.avgPct >= 60 ? "#ff6b2b"
                                    : "#ff3333"
                        }]}>
                            {marksSummary.avgPct}%
                        </Text>
                        <View style={styles.progressBg}>
                            <View style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(marksSummary.avgPct, 100)}%` as any,
                                    backgroundColor: marksSummary.avgPct >= 80 ? "#ff6b2b"
                                        : marksSummary.avgPct >= 60 ? "#ff6b2b66"
                                            : "#ff3333",
                                }
                            ]} />
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
                        todayPeriods.map((p, idx) => (
                            <View key={idx} style={styles.classRow}>
                                <View style={styles.classTimeDot} />
                                <View style={styles.classTimeBlock}>
                                    <Text style={styles.classTime}>{formatTime(p.startTime)}</Text>
                                </View>
                                <View style={styles.classInfo}>
                                    <Text style={styles.classCode}>{p.courseCode}</Text>
                                    <Text style={styles.classTitle} numberOfLines={1}>{p.courseTitle}</Text>
                                </View>
                                {p.roomNo && (
                                    <Text style={styles.classRoom}>{p.roomNo}</Text>
                                )}
                            </View>
                        ))
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

function formatTime(t: string): string {
    if (!t) return "--";
    const parts = t.split(":");
    if (parts.length < 2) return t;
    let h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m}${ampm}`;
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000000" },
    center: { flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", gap: 12 },
    topAccentBar: { height: 2, backgroundColor: "#ff6b2b" },
    scroll: { flex: 1, paddingHorizontal: 16 },
    loadingText: { color: "#333", fontSize: 10, letterSpacing: 3, fontWeight: "900", marginTop: 12 },

    header: { paddingTop: 20, paddingBottom: 20 },
    pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#ff6b2b", },
    tagText: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 20 },
    pageTitle: { color: "#fff", fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 20 },
    dateText: { color: "#222", fontSize: 9, fontWeight: "900", letterSpacing: 2, marginTop: 4 },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    statCard: {
        flex: 1,
        backgroundColor: "#080808",
        borderWidth: 1, borderColor: "#1a1a1a",
        padding: 14,
        position: "relative",
    },
    statLabel: { color: "#333", fontSize: 7, fontWeight: "900", letterSpacing: 2, marginBottom: 8 },
    statValue: { fontSize: 32, fontWeight: "900", letterSpacing: -1.5, marginBottom: 10 },
    progressBg: { height: 2, backgroundColor: "#111", marginBottom: 8 },
    progressFill: { height: 2 },
    warningText: { color: "#ff3333", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
    subStat: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
    cardArrow: { position: "absolute", top: 10, right: 12, color: "#1a1a1a", fontSize: 14, fontWeight: "900" },

    sectionHeader: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2.5 },
    sectionLink: { color: "#ff6b2b", fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },

    noClass: {
        backgroundColor: "#080808", borderWidth: 1, borderColor: "#1a1a1a",
        paddingVertical: 20, alignItems: "center", marginBottom: 20,
    },
    noClassText: { color: "#222", fontSize: 10, fontWeight: "900", letterSpacing: 2 },

    classRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#080808", borderWidth: 1, borderColor: "#1a1a1a",
        paddingHorizontal: 12, paddingVertical: 10,
        marginBottom: 6, gap: 10,
    },
    classTimeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#ff6b2b" },
    classTimeBlock: { width: 52 },
    classTime: { color: "#ff6b2b", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    classInfo: { flex: 1 },
    classCode: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },
    classTitle: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 1 },
    classRoom: { color: "#333", fontSize: 9, fontWeight: "900", letterSpacing: 1 },

    quickGrid: {
        flexDirection: "row", flexWrap: "wrap", gap: 10,
        marginTop: 20, marginBottom: 10,
    },
    quickCard: {
        width: "47%",
        backgroundColor: "#080808",
        borderWidth: 1, borderColor: "#1a1a1a",
        paddingVertical: 20, paddingHorizontal: 16,
        alignItems: "flex-start",
    },
    quickIcon: { color: "#ff6b2b", fontSize: 20, marginBottom: 10 },
    quickLabel: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
});