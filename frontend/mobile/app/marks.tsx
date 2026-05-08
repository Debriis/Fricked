import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated,
    StatusBar, RefreshControl,
} from "react-native";
import { getMarks } from "../utils/api";
import { getToken } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";
import { useTheme } from "../utils/ThemeContext";

// Backend response shape:
// marks[i] = { courseCode, courseName, courseType,
//              overall: { scored: "18.00", total: "25.00" },
//              testPerformance: [{ test: "CAT1", marks: { scored: "18.00", total: "25.00" } }] }

type TestEntry = { testName: string; scored: string; total: string; };
type Subject = { courseCode: string; courseTitle: string; overallScored: number; overallTotal: number; tests: TestEntry[]; };

function mapSubjects(raw: any[]): Subject[] {
    return (raw || []).map((s: any) => ({
        courseCode: s.courseCode ?? "",
        courseTitle: s.courseName ?? "",
        overallScored: parseFloat(s.overall?.scored ?? "0") || 0,
        overallTotal: parseFloat(s.overall?.total ?? "0") || 0,
        tests: (s.testPerformance ?? []).map((tp: any) => ({
            testName: tp.test ?? "",
            scored: tp.marks?.scored ?? "",
            total: tp.marks?.total ?? "",
        })),
    }));
}

export default function MarksPage() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const fetchData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        const token = await getToken();
        if (!token) { router.replace("/"); return; }
        try {
            const res = await getMarks(token);
            setSubjects(mapSubjects(res.data?.marks ?? []));
            setError("");
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to load marks");
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

    const scoreColor = (scored: number, total: number) => {
        if (total === 0) return theme.textMuted;
        const pct = (scored / total) * 100;
        if (pct >= 80) return theme.textPrimary;
        if (pct >= 60) return theme.accent;
        return theme.danger;
    };

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>FETCHING MARKS</Text>
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
            >
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.pageTag}>
                        <View style={styles.tagDot} />
                        <Text style={styles.tagText}>PERFORMANCE OVERVIEW</Text>
                    </View>
                    <Text style={styles.pageTitle}>MARKS</Text>
                </Animated.View>

                {subjects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyCode}>∅</Text>
                        <Text style={styles.emptyText}>NO MARKS DATA</Text>
                    </View>
                ) : (
                    subjects.map((sub, idx) => {
                        const isExpanded = expanded === sub.courseCode;
                        const pct = sub.overallTotal > 0 ? (sub.overallScored / sub.overallTotal) * 100 : 0;

                        return (
                            <Animated.View key={sub.courseCode + idx} style={[styles.card, { opacity: fadeAnim }]}>
                                <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded(isExpanded ? null : sub.courseCode)}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardLeft}>
                                            <Text style={styles.cardCode}>{sub.courseCode}</Text>
                                            <Text style={styles.cardTitle}>{sub.courseTitle}</Text>
                                        </View>
                                        <View style={styles.cardRight}>
                                            {sub.overallTotal > 0 ? (
                                                <View style={styles.scoreBox}>
                                                    <Text style={[styles.scoreBig, { color: scoreColor(sub.overallScored, sub.overallTotal) }]}>
                                                        {sub.overallScored.toFixed(0)}
                                                    </Text>
                                                    <Text style={styles.scoreTotal}>/{sub.overallTotal.toFixed(0)}</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.naText}>N/A</Text>
                                            )}
                                            <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
                                        </View>
                                    </View>

                                    {sub.overallTotal > 0 && (
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, {
                                                width: `${Math.min(pct, 100)}%` as any,
                                                backgroundColor: pct >= 80 ? theme.accent : pct >= 60 ? theme.accent + "66" : theme.danger,
                                            }]} />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {isExpanded && sub.tests.length > 0 && (
                                    <View style={styles.breakdown}>
                                        <View style={styles.breakdownDivider} />
                                        <View style={styles.testsGrid}>
                                            {sub.tests.map((t, ti) => {
                                                const sc = parseFloat(t.scored);
                                                const tot = parseFloat(t.total);
                                                const isAbs = t.scored === "Abs";
                                                const hasScore = !isAbs && !isNaN(sc) && !isNaN(tot);
                                                return (
                                                    <View key={ti} style={styles.testChip}>
                                                        <Text style={styles.testName}>{t.testName.toUpperCase() || `TEST ${ti + 1}`}</Text>
                                                        {isAbs ? (
                                                            <Text style={[styles.testScore, { color: theme.danger, fontSize: 12 }]}>ABS</Text>
                                                        ) : hasScore ? (
                                                            <View style={styles.testScoreRow}>
                                                                <Text style={[styles.testScore, { color: scoreColor(sc, tot) }]}>{sc.toFixed(0)}</Text>
                                                                <Text style={styles.testTotal}>/{tot.toFixed(0)}</Text>
                                                            </View>
                                                        ) : (
                                                            <Text style={styles.testNa}>–</Text>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                                <Text style={styles.cardIndex}>{String(idx + 1).padStart(2, "0")}</Text>
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
        header: { paddingTop: 20, paddingBottom: 20 },
        pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
        tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.accent },
        tagText: { color: theme.textMuted, fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 15 },
        pageTitle: { color: theme.textPrimary, fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 10 },
        emptyState: { alignItems: "center", paddingVertical: 60 },
        emptyCode: { color: theme.textDead, fontSize: 64, fontWeight: "900" },
        emptyText: { color: theme.textMuted, fontSize: 11, letterSpacing: 3, marginTop: 4 },
        card: { backgroundColor: theme.bgCard, borderWidth: 1, borderColor: theme.border, padding: 16, marginBottom: 10, position: "relative" },
        cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
        cardLeft: { flex: 1, marginRight: 12 },
        cardCode: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
        cardTitle: { color: theme.textPrimary, fontSize: 14, fontWeight: "700", lineHeight: 19, letterSpacing: -0.3 },
        cardRight: { alignItems: "flex-end", gap: 6 },
        scoreBox: { flexDirection: "row", alignItems: "flex-end" },
        scoreBig: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
        scoreTotal: { color: theme.textMuted, fontSize: 14, fontWeight: "700", marginBottom: 3, marginLeft: 2 },
        naText: { color: theme.textMuted, fontSize: 14, fontWeight: "900" },
        expandIcon: { color: theme.textMuted, fontSize: 10, fontWeight: "900" },
        cardIndex: { position: "absolute", top: 10, right: 12, color: theme.textDead, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
        progressBg: { height: 2, backgroundColor: theme.textDead, marginTop: 4 },
        progressFill: { height: 2 },
        breakdown: { marginTop: 4 },
        breakdownDivider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
        testsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        testChip: { backgroundColor: theme.bgStrip, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 10, minWidth: 80 },
        testName: { color: theme.accent, fontSize: 7, fontWeight: "900", letterSpacing: 1.5, marginBottom: 6 },
        testScoreRow: { flexDirection: "row", alignItems: "flex-end" },
        testScore: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
        testTotal: { color: theme.textMuted, fontSize: 10, fontWeight: "700", marginBottom: 2, marginLeft: 2 },
        testNa: { color: theme.textMuted, fontSize: 18, fontWeight: "900" },
    });
}
