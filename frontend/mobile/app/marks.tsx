import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, StyleSheet, Animated, Dimensions,
    StatusBar, RefreshControl,
} from "react-native";
import { getMarks } from "../utils/api";
import { getToken } from "../utils/storage";
import { useRouter } from "expo-router";
import TabBar from "./tabbar";

const { width } = Dimensions.get("window");

type MarkEntry = {
    testName: string;
    marks: string;
    totalMarks: string;
};

type Subject = {
    courseCode: string;
    courseTitle: string;
    marks: MarkEntry[];
    overallTotal?: string;
    overallScored?: string;
};

export default function MarksPage() {
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
            setSubjects(res.data?.marks || []);
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

    const getScoreColor = (scored: string, total: string) => {
        const pct = (parseFloat(scored) / parseFloat(total)) * 100;
        if (pct >= 80) return "#ffffff";
        if (pct >= 60) return "#ff6b2b";
        return "#ff3333";
    };

    if (loading)
        return (
            <View style={styles.center}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <ActivityIndicator size="large" color="#ff6b2b" />
                <Text style={styles.loadingText}>FETCHING MARKS</Text>
            </View>
        );

    if (error)
        return (
            <View style={styles.center}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <Text style={styles.errorCode}>ERR_LOAD</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
                    <Text style={styles.retryText}>RETRY ↺</Text>
                </TouchableOpacity>
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
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.pageTag}>
                            <View style={styles.tagDot} />
                            <Text style={styles.tagText}>PERFORMANCE OVERVIEW</Text>
                        </View>
                        <Text style={styles.pageTitle}>MARKS</Text>
                    </View>
                    {/* <View style={styles.headerRight}>
                        <Text style={styles.subjectCountBig}>{subjects.length}</Text>
                        <Text style={styles.subjectCountLabel}>SUBJECTS</Text>
                    </View> */}
                </Animated.View>

                {/* Subject cards */}
                {subjects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyCode}>∅</Text>
                        <Text style={styles.emptyText}>NO MARKS DATA</Text>
                    </View>
                ) : (
                    subjects.map((sub, idx) => {
                        const isExpanded = expanded === sub.courseCode;

                        const totalScored = (sub.marks ?? []).reduce((acc, m) => {
                            const n = parseFloat(m.marks);
                            return acc + (isNaN(n) ? 0 : n);
                        }, 0);
                        const totalPossible = (sub.marks ?? []).reduce((acc, m) => {
                            const n = parseFloat(m.totalMarks);
                            return acc + (isNaN(n) ? 0 : n);
                        }, 0);
                        const pct = totalPossible > 0 ? (totalScored / totalPossible) * 100 : 0;

                        return (
                            <Animated.View
                                key={sub.courseCode + idx}
                                style={[styles.card, { opacity: fadeAnim }]}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setExpanded(isExpanded ? null : sub.courseCode)}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardLeft}>
                                            <Text style={styles.cardCode}>{sub.courseCode}</Text>
                                            <Text style={styles.cardTitle}>{sub.courseTitle}</Text>
                                        </View>
                                        <View style={styles.cardRight}>
                                            {totalPossible > 0 ? (
                                                <View style={styles.scoreBox}>
                                                    <Text style={[styles.scoreBig, { color: getScoreColor(String(totalScored), String(totalPossible)) }]}>
                                                        {totalScored.toFixed(0)}
                                                    </Text>
                                                    <Text style={styles.scoreTotal}>/{totalPossible.toFixed(0)}</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.naText}>N/A</Text>
                                            )}
                                            <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
                                        </View>
                                    </View>

                                    {/* Progress bar */}
                                    {totalPossible > 0 && (
                                        <View style={styles.progressBg}>
                                            <View style={[
                                                styles.progressFill,
                                                {
                                                    width: `${Math.min(pct, 100)}%` as any,
                                                    backgroundColor: pct >= 80 ? "#ff6b2b" : pct >= 60 ? "#ff6b2b66" : "#ff3333",
                                                }
                                            ]} />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Expanded breakdown */}
                                {isExpanded && (sub.marks ?? []).length > 0 && (
                                    <View style={styles.breakdown}>
                                        <View style={styles.breakdownDivider} />
                                        <View style={styles.testsGrid}>
                                            {(sub.marks ?? []).map((m, mi) => {
                                                const mScored = parseFloat(m.marks);
                                                const mTotal = parseFloat(m.totalMarks);
                                                const hasScore = !isNaN(mScored) && !isNaN(mTotal);
                                                const mColor = hasScore ? getScoreColor(m.marks, m.totalMarks) : "#333";
                                                return (
                                                    <View key={mi} style={styles.testChip}>
                                                        <Text style={styles.testName}>
                                                            {m.testName?.toUpperCase() || `TEST ${mi + 1}`}
                                                        </Text>
                                                        {hasScore ? (
                                                            <View style={styles.testScoreRow}>
                                                                <Text style={[styles.testScore, { color: mColor }]}>
                                                                    {mScored.toFixed(0)}
                                                                </Text>
                                                                <Text style={styles.testTotal}>/{mTotal.toFixed(0)}</Text>
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

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000000" },
    center: { flex: 1, backgroundColor: "#000000", justifyContent: "center", alignItems: "center", gap: 12 },
    topAccentBar: { height: 2, backgroundColor: "#ff6b2b" },
    scroll: { flex: 1, paddingHorizontal: 16 },

    loadingText: { color: "#333", fontSize: 10, letterSpacing: 3, fontWeight: "900", marginTop: 12 },
    errorCode: { color: "#ff3333", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    errorText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
    retryBtn: { marginTop: 16, borderWidth: 1, borderColor: "#ff6b2b", paddingHorizontal: 20, paddingVertical: 10 },
    retryText: { color: "#ff6b2b", fontSize: 10, fontWeight: "900", letterSpacing: 2 },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingTop: 20,
        paddingBottom: 20,
    },
    pageTag: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    tagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#ff6b2b" },
    tagText: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2.5, paddingTop: 15 },
    pageTitle: { color: "#fff", fontSize: 60, fontWeight: "900", letterSpacing: -2, lineHeight: 72, marginTop: 10 },
    headerRight: { alignItems: "flex-end", borderLeftWidth: 3, borderLeftColor: "#ff6b2b", paddingLeft: 10 },
    subjectCountBig: { color: "#ff6b2b", fontSize: 42, fontWeight: "900", letterSpacing: -2 },
    subjectCountLabel: { color: "#333", fontSize: 8, fontWeight: "900", letterSpacing: 2 },

    emptyState: { alignItems: "center", paddingVertical: 60 },
    emptyCode: { color: "#1a1a1a", fontSize: 64, fontWeight: "900" },
    emptyText: { color: "#333", fontSize: 11, letterSpacing: 3, marginTop: 4 },

    card: {
        backgroundColor: "#080808",
        borderWidth: 1,
        borderColor: "#1a1a1a",
        padding: 16,
        marginBottom: 10,
        position: "relative",
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    cardLeft: { flex: 1, marginRight: 12 },
    cardCode: { color: "#ff6b2b", fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 4 },
    cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700", lineHeight: 19, letterSpacing: -0.3 },
    cardRight: { alignItems: "flex-end", gap: 6 },
    scoreBox: { flexDirection: "row", alignItems: "flex-end" },
    scoreBig: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
    scoreTotal: { color: "#333", fontSize: 14, fontWeight: "700", marginBottom: 3, marginLeft: 2 },
    naText: { color: "#333", fontSize: 14, fontWeight: "900" },
    expandIcon: { color: "#333", fontSize: 10, fontWeight: "900" },
    cardIndex: {
        position: "absolute", top: 10, right: 12,
        color: "#111", fontSize: 10, fontWeight: "900", letterSpacing: 1,
    },

    progressBg: { height: 2, backgroundColor: "#111", marginTop: 4 },
    progressFill: { height: 2 },

    breakdown: { marginTop: 4 },
    breakdownDivider: { height: 1, backgroundColor: "#1a1a1a", marginVertical: 12 },
    testsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    testChip: {
        backgroundColor: "#0d0d0d",
        borderWidth: 1,
        borderColor: "#1e1e1e",
        paddingHorizontal: 12,
        paddingVertical: 10,
        minWidth: 80,
    },
    testName: { color: "#ff6b2b", fontSize: 7, fontWeight: "900", letterSpacing: 1.5, marginBottom: 6 },
    testScoreRow: { flexDirection: "row", alignItems: "flex-end" },
    testScore: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
    testTotal: { color: "#333", fontSize: 10, fontWeight: "700", marginBottom: 2, marginLeft: 2 },
    testNa: { color: "#333", fontSize: 18, fontWeight: "900" },
});