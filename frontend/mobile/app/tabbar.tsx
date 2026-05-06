import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";

const TABS = [
    { route: "/dashboard", label: "HOME", icon: "⌂" },
    { route: "/attendance", label: "ATTEND", icon: "◈" },
    { route: "/marks", label: "MARKS", icon: "◉" },
    { route: "/timetable", label: "SCHED", icon: "▦" },
    { route: "/profile", label: "YOU", icon: "◎" },
];

export default function TabBar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View style={styles.wrapper}>
            {/* top edge line */}
            <View style={styles.topLine} />
            <View style={styles.container}>
                {TABS.map((tab) => {
                    const active = pathname === tab.route;
                    return (
                        <TouchableOpacity
                            key={tab.route}
                            style={styles.tab}
                            onPress={() => router.push(tab.route as any)}
                            activeOpacity={0.7}
                        >
                            {active && <View style={styles.activeBar} />}
                            <Text style={[styles.icon, active && styles.iconActive]}>
                                {tab.icon}
                            </Text>
                            <Text style={[styles.label, active && styles.labelActive]}>
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
        backgroundColor: "#000000",
        borderTopWidth: 0,
    },
    topLine: {
        height: 1,
        backgroundColor: "#111111",
    },
    container: {
        flexDirection: "row",
        backgroundColor: "#000000",
        paddingBottom: Platform.OS === "ios" ? 24 : 8,
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
        backgroundColor: "#ff6b2b",
    },
    icon: {
        fontSize: 16,
        color: "#2a2a2a",
    },
    iconActive: {
        color: "#ff6b2b",
    },
    label: {
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 1.5,
        color: "#2a2a2a",
    },
    labelActive: {
        color: "#ffffff",
    },
});