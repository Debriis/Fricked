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

type TableSlot = {
    code: string;
    name: string;
    slot: string;
    roomNo?: string;
    courseType?: string;
    online?: boolean;
    isOptional?: boolean;
};

type DaySchedule = {
    day: number;
    table: (TableSlot | null)[];
};

type DisplayPeriod = TableSlot & { time: string };

const DAY_TABS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];

const dayIndexToBackendDay = (idx: number) => idx + 1;

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

function getSlotTime(position: number): string {
    return PERIOD_TIME_BY_POSITION[position] ?? "--";
}

function isMorningPeriod(timeStr: string): boolean {
    const startHour = parseInt(timeStr.split(/[–-]/)[0], 10);
    if (isNaN(startHour)) return true;
    if (startHour === 12) return false;
    if (startHour < 8) return false;
    return startHour >= 8 && startHour < 12;
}

export default function TimetablePage() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [activeDay, setActiveDay] = useState<number>(() => {
        const d = new Date().getDay();
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
            const raw = res.data?.schedule ?? res.data ?? [];
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

    const activeDayData: DaySchedule | undefined = Array.isArray(schedule)
        ? schedule.find(s => s?.day === dayIndexToBackendDay(activeDay))
        : undefined;

    const activePeriods: DisplayPeriod[] = (activeDayData?.table ?? [])
        .map((slot, idx) => (slot ? { ...slot, time: getSlotTime(idx) } : null))
        .filter((p): p is DisplayPeriod => p !== null);

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
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.pageTag}>
                            <View style={styles.tagDot} />
                            <Text style={styles.tagText}>WEEKLY SCHEDULE</Text>
                        </View>
                        <Text style={styles.pageTitle}>TIMETABLE</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.daySelector, { opacity: fadeAnim }]}>
                    {DAY_TABS.map((day, idx) => {
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

                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.fullDayName}>{DAY_TABS[activeDay].toUpperCase()}</Text>
                </Animated.View>

                {activePeriods.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyCode}>∅</Text>
                        <Text style={styles.emptyText}>NO CLASSES TODAY</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {activePeriods.map((period, idx) => {
                            const isMorning = isMorningPeriod(period.time);
                            const cardBg = isMorning ? theme.cardSecondary : theme.cardPrimary;
                            const cardText = isMorning ? theme.textOnSecondary : (theme.textOnPrimary ?? theme.textPrimary);

                            return (
                                <View key={idx} style={styles.periodRow}>
                                    <View style={styles.timeline}>
                                        <View style={styles.timelineDot} />
                                        {idx < activePeriods.length - 1 && (
                                            <View style={styles.timelineLine} />
                                        )}
                                    </View>

                                    <View style={styles.periodCardWrapper}>
                                        <View style={[styles.periodCard, { backgroundColor: cardBg }]}>
                                            <View style={styles.cardTopRow}>
                                                <Text style={[styles.periodCode, { color: cardText, opacity: 0.7 }]}>
                                                    {period.code}
                                                </Text>
                                                <Text style={[styles.timeLabelInline, { color: cardText, opacity: 0.7 }]}>
                                                    {period.time}
                                                </Text>
                                            </View>

                                            <Text style={[styles.periodTitle, { color: cardText }]} numberOfLines={2}>
                                                {period.name}
                                            </Text>

                                            <Text style={[styles.periodCourseType, { color: cardText, opacity: 0.7 }]}>
                                                {period.courseType || "Theory"}
                                            </Text>

                                            <View style={styles.slotVerticalWrap}>
                                                <Text style={[styles.slotVerticalText, { color: cardText }]}>
                                                    {period.roomNo || "--"}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </Animated.View>
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
            marginTop: 4, minHeight: 30,
        },

        periodCardWrapper: { flex: 1 },

        periodCard: {
            borderRadius: 22,
            padding: 18,
            paddingRight: 44,
            minHeight: 108,
            position: "relative",
            justifyContent: "flex-start",
        },
        cardTopRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
        },
        periodCode: {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.5,
        },
        timeLabelInline: {
            fontSize: 12,
            fontWeight: "600",
        },
        periodTitle: {
            fontSize: 22,
            fontWeight: "900",
            letterSpacing: -0.5,
            lineHeight: 25,
            marginBottom: 8,
        },
        periodCourseType: {
            fontSize: 12,
            fontWeight: "500",
        },
        slotVerticalWrap: {
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 14,
            justifyContent: "center",
            alignItems: "center",
        },
        slotVerticalText: {
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1,
            transform: [{ rotate: "90deg" }],
        },
    });
}