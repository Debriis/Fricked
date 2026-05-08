import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../utils/ThemeContext";

const TABS = [
    { route: "/dashboard", label: "HOME", icon: "⌂" },
    { route: "/attendance", label: "ATTEND", icon: "◈" },
    { route: "/marks", label: "MARKS", icon: "◉" },
    { route: "/timetable", label: "SCHED", icon: "▦" },
    { route: "/more", label: "MORE", icon: "⊞" },
];

export default function TabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useTheme();

    // treat /profile, /settings as "more" active
    const isMoreActive = ["/more", "/profile", "/settings"].includes(pathname);

    return (
        <View style={[styles.wrapper, { backgroundColor: theme.bg }]}>
            <View style={[styles.topLine, { backgroundColor: theme.border }]} />
            <View style={[styles.container, { backgroundColor: theme.bg, paddingBottom: Platform.OS === "ios" ? 24 : 8 }]}>
                {TABS.map((tab) => {
                    const active = tab.route === "/more"
                        ? isMoreActive
                        : pathname === tab.route;
                    return (
                        <TouchableOpacity
                            key={tab.route}
                            style={styles.tab}
                            onPress={() => router.push(tab.route as any)}
                            activeOpacity={0.7}
                        >
                            {active && <View style={[styles.activeBar, { backgroundColor: theme.accent }]} />}
                            <Text style={[styles.icon, { color: active ? theme.accent : theme.borderStrong }]}>
                                {tab.icon}
                            </Text>
                            <Text style={[styles.label, { color: active ? theme.textPrimary : theme.borderStrong }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderTopWidth: 0,
    },
    topLine: {
        height: 1,
    },
    container: {
        flexDirection: "row",
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        position: "relative",
        paddingTop: 4,
    },
    activeBar: {
        position: "absolute",
        top: -9,
        left: "20%",
        right: "20%",
        height: 2,
    },
    icon: {
        fontSize: 16,
    },
    label: {
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 1.5,
    },
});
