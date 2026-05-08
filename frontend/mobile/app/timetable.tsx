import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated,
    StatusBar, RefreshControl,
} from "react-native";
import { getTimetable } from "../utils/api";
import { getToken } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";
import { useTheme } from "../utils/ThemeContext";

type Period = {
    courseCode: string;
    courseTitle: string;
    roomNo?: string;
    startTime: string;
    endTime: string;
    staffName?: string;
};

type DaySchedule = {
    day: string;
    periods: Period[];
};

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [activeDay, setActiveDay] = useState<number>(() => {
        const d = new Date().getDay(); // 0=Sun
        return d === 0 ? 0 : d - 1;
    });

    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const fetchData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        const token = await getToken();
        if (!token) { router.replace("/"); return; }
        try {
            const res = await getTimetable(token);
            const raw = res.data?.timetable ?? res.data?.schedule ?? res.data ?? [];
            setSchedule(Array.isArray(raw) ? raw : []);
            setError("");
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to load timetable");
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

    // Safe find — guards against empty array and missing day field
    const activeDayData: DaySchedule | undefined = Array.isArray(schedule)
        ? schedule.find(s => typeof s?.day === "string" && s.day.toUpperCase().startsWith(DAYS[activeDay]))
        ?? schedule[activeDay]
        : undefined;

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>LOADING SCHEDULE</Text>
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
                            <Text style={styles.tagText}>WEEKLY SCHEDULE</Text>
                        </View>
                        <Text style={styles.pageTitle}>TIMETABLE</Text>
                    </View>
                    {/* <View style={styles.headerRight}>
                        <Text style={styles.periodCountBig}>
                            {activeDayData?.periods?.length ?? 0}
                        </Text>
                        <Text style={styles.periodCountLabel}>CLASSES</Text>
                    </View> */}
                </Animated.View>

                {/* Day selector */}
                <Animated.View style={[styles.daySelector, { opacity: fadeAnim }]}>
                    {DAYS.map((day, idx) => {
                        const isActive = idx === activeDay;
                        const isToday = idx === new Date().getDay() - 1;
                        return (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayTab, isActive && styles.dayTabActive]}
                                onPress={() => setActiveDay(idx)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                                    {day}
                                </Text>
                                {isToday && <View style={styles.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </Animated.View>

                {/* Full day name */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.fullDayName}>{FULL_DAYS[activeDay].toUpperCase()}</Text>
                </Animated.View>

                {/* Periods */}
                {!activeDayData || (activeDayData.periods ?? []).length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyCode}>∅</Text>
                        <Text style={styles.emptyText}>NO CLASSES TODAY</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {(activeDayData.periods ?? []).map((period, idx) => (
                            <View key={idx} style={styles.periodRow}>
                                {/* Timeline */}
                                <View style={styles.timeline}>
                                    <View style={styles.timelineDot} />
                                    {idx < (activeDayData.periods ?? []).length - 1 && (
                                        <View style={styles.timelineLine} />
                                    )}
                                </View>

                                {/* Time column */}
                                <View style={styles.timeCol}>
                                    <Text style={styles.timeStart}>{formatTime(period.startTime)}</Text>
                                    <Text style={styles.timeEnd}>{formatTime(period.endTime)}</Text>
                                </View>

                                {/* Card */}
                                <View style={styles.periodCard}>
                                    <Text style={styles.periodCode}>{period.courseCode}</Text>
                                    <Text style={styles.periodTitle}>{period.courseTitle}</Text>
                                    <View style={styles.periodMeta}>
                                        {period.roomNo ? (
                                            <View style={styles.metaChip}>
                                                <Text style={styles.metaText}>◫ {period.roomNo}</Text>
                                            </View>
                                        ) : null}
                                        {period.staffName ? (
                                            <View style={styles.metaChip}>
                                                <Text style={styles.metaText} numberOfLines={1}>
                                                    ◎ {period.staffName}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.periodIndex}>{String(idx + 1).padStart(2, "0")}</Text>
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                )}
            </ScrollView>

            <TabBar />
        </View>
    );
}

function formatTime(t: string): string {
    if (!t) return "--";
    const parts = t.split(":");
    if (parts.length < 2) return t;
    let h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
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
            flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
            paddingTop: 20, paddingBottom: 16,
        },
        pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
        tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.accent },
        tagText: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 15 },
        pageTitle: { color: theme.textPrimary, fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 10 },
        headerRight: { alignItems: "flex-end", borderLeftWidth: 3, borderLeftColor: theme.accent, paddingLeft: 10 },
        periodCountBig: { color: theme.accent, fontSize: 42, fontWeight: "900", letterSpacing: -2 },
        periodCountLabel: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2 },

        daySelector: {
            flexDirection: "row",
            marginBottom: 4,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
        },
        dayTab: {
            flex: 1, paddingVertical: 10, alignItems: "center",
            backgroundColor: theme.bgCard, position: "relative",
        },
        dayTabActive: { backgroundColor: theme.accent },
        dayLabel: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
        dayLabelActive: { color: theme.bg },
        todayDot: {
            position: "absolute", bottom: 4,
            width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.accent,
        },

        fullDayName: {
            color: theme.textDead, fontSize: 11, fontWeight: "900", letterSpacing: 3,
            marginBottom: 16, marginTop: 8,
        },

        emptyState: { alignItems: "center", paddingVertical: 60 },
        emptyCode: { color: theme.textDead, fontSize: 64, fontWeight: "900" },
        emptyText: { color: theme.textMuted, fontSize: 11, letterSpacing: 3, marginTop: 4 },

        periodRow: { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },

        timeline: { width: 20, alignItems: "center", paddingTop: 6 },
        timelineDot: {
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: theme.accent, marginBottom: 0,
        },
        timelineLine: {
            width: 1, flex: 1, backgroundColor: theme.border,
            marginTop: 4, minHeight: 40,
        },

        timeCol: { width: 56, paddingTop: 2, paddingRight: 8 },
        timeStart: { color: theme.textPrimary, fontSize: 10, fontWeight: "900", letterSpacing: -0.3 },
        timeEnd: { color: theme.textMuted, fontSize: 9, fontWeight: "700", marginTop: 2 },

        periodCard: {
            flex: 1,
            backgroundColor: theme.bgCard,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 12,
            position: "relative",
        },
        periodCode: { color: theme.accent, fontSize: 8, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
        periodTitle: { color: theme.textPrimary, fontSize: 13, fontWeight: "700", lineHeight: 18, letterSpacing: -0.3, marginBottom: 8 },
        periodMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
        metaChip: {
            borderWidth: 1, borderColor: theme.border,
            paddingHorizontal: 8, paddingVertical: 3,
            backgroundColor: theme.bgStrip,
        },
        metaText: { color: theme.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
        periodIndex: {
            position: "absolute", top: 8, right: 10,
            color: theme.textDead, fontSize: 10, fontWeight: "900", letterSpacing: 1,
        },
    });
}