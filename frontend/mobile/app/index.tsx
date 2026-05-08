import { useState, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, StyleSheet,
    Animated, Dimensions, KeyboardAvoidingView, Platform,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { login } from "../utils/api";
import { saveToken, saveCredentials, getCredentials } from "../utils/storage";
import { useTheme } from "../utils/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const lineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        getCredentials().then(creds => {
            if (creds) setUsername(creds.username);
        });

        Animated.parallel([
            Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
            Animated.timing(lineAnim, { toValue: 1, duration: 1200, delay: 400, useNativeDriver: false }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    const lineWidth = lineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.45] });

    const handleLogin = async () => {
        if (!username || !password) return Alert.alert("Hold up", "Fill both fields first");
        setLoading(true);
        try {
            const res = await login(username, password);
            if (!res.data.authenticated) {
                Alert.alert("Nope ❌", res.data.message || "Wrong credentials");
                return;
            }
            await saveCredentials(username, password);
            await saveToken(res.data.cookies);
            router.replace("/dashboard");
        } catch (e) {
            Alert.alert("Error", "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

            {/* Decorative corner marks */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {/* Cross-hair grid dots */}
            <View style={[styles.gridDot, { top: height * 0.2, left: 20 }]} />
            <View style={[styles.gridDot, { top: height * 0.5, right: 20 }]} />
            <View style={[styles.gridDot, { top: height * 0.75, left: 50 }]} />

            {/* Animated glow orb */}
            <Animated.View style={[styles.glowOrb, { opacity: glowOpacity }]} />

            <View style={styles.container}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, justifyContent: "center" }}>

                    {/* Top label */}
                    <View style={styles.topLabel}>
                        <View style={styles.labelDot} />
                        <Text style={styles.labelText}>SRM ACADEMIA // UNOFFICIAL</Text>
                    </View>

                    {/* Logo section */}
                    <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoRingOuter} />
                            <View style={styles.logoRingInner} />
                            <View style={styles.logoCore}>
                                <Text style={styles.logoGlyph}>⚡</Text>
                            </View>
                        </View>

                        <View style={styles.titleBlock}>
                            <Text style={styles.appName}>FRICKED</Text>
                            <Animated.View style={[styles.titleUnderline, { width: lineWidth }]} />
                        </View>

                        <Text style={styles.tagline}>Your portal. Your rules. Unchained.</Text>
                    </Animated.View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Net ID Field */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.fieldHeader}>
                                <Text style={styles.fieldIndex}>01</Text>
                                <Text style={styles.fieldLabel}>NET ID</Text>
                            </View>
                            <View style={[styles.inputContainer, focusedField === "user" && styles.inputContainerFocused]}>
                                <View style={styles.inputAccent} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="yourname@srmist.edu.in"
                                    placeholderTextColor={theme.borderStrong}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setFocusedField("user")}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Password Field */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.fieldHeader}>
                                <Text style={styles.fieldIndex}>02</Text>
                                <Text style={styles.fieldLabel}>PASSWORD</Text>
                            </View>
                            <View style={[styles.inputContainer, focusedField === "pass" && styles.inputContainerFocused]}>
                                <View style={styles.inputAccent} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••••••"
                                    placeholderTextColor={theme.borderStrong}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setFocusedField("pass")}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(v => !v)}
                                    style={styles.eyeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.eyeText}>{showPassword ? "HIDE" : "SHOW"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* CTA Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonLoading]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            <View style={styles.buttonInner}>
                                {loading ? (
                                    <ActivityIndicator color={theme.bg} size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>AUTHENTICATE</Text>
                                        <View style={styles.buttonArrow}>
                                            <Text style={styles.buttonArrowText}>→</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerLine} />
                        <Text style={styles.footerText}>FRICKED v2.0 • NOT AFFILIATED WITH SRM</Text>
                        <View style={styles.footerLine} />
                    </View>

                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}

function getStyles(theme: ReturnType<typeof useTheme>['theme']) {
    return StyleSheet.create({
        root: { flex: 1, backgroundColor: theme.bg },
        container: {
            flex: 1,
            backgroundColor: theme.bg,
            paddingHorizontal: 24,
        },
        cornerTL: {
            position: "absolute", top: 16, left: 16,
            width: 20, height: 20,
            borderTopWidth: 2, borderLeftWidth: 2,
            borderColor: theme.accent,
        },
        cornerTR: {
            position: "absolute", top: 16, right: 16,
            width: 20, height: 20,
            borderTopWidth: 2, borderRightWidth: 2,
            borderColor: theme.accent,
        },
        cornerBL: {
            position: "absolute", bottom: 16, left: 16,
            width: 20, height: 20,
            borderBottomWidth: 2, borderLeftWidth: 2,
            borderColor: theme.textMuted,
        },
        cornerBR: {
            position: "absolute", bottom: 16, right: 16,
            width: 20, height: 20,
            borderBottomWidth: 2, borderRightWidth: 2,
            borderColor: theme.textMuted,
        },
        gridDot: {
            position: "absolute",
            width: 4, height: 4, borderRadius: 2,
            backgroundColor: theme.accent,
            opacity: 0.4,
        },
        glowOrb: {
            position: "absolute",
            top: -100, right: -80,
            width: 300, height: 300,
            borderRadius: 150,
            backgroundColor: theme.accent,
            opacity: 0.06,
        },
        topLabel: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 48,
            paddingTop: Platform.OS === "ios" ? 60 : 40,
        },
        labelDot: {
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: theme.accent,
        },
        labelText: {
            color: theme.textMuted,
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 3,
        },
        logoSection: {
            marginBottom: 56,
        },
        logoContainer: {
            width: 80, height: 80,
            marginBottom: 24,
            justifyContent: "center",
            alignItems: "center",
        },
        logoRingOuter: {
            position: "absolute",
            width: 80, height: 80,
            borderRadius: 40,
            borderWidth: 1,
            borderColor: theme.border,
        },
        logoRingInner: {
            position: "absolute",
            width: 60, height: 60,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: theme.accent,
            borderStyle: "dashed",
        },
        logoCore: {
            width: 44, height: 44,
            borderRadius: 12,
            backgroundColor: theme.accent,
            justifyContent: "center",
            alignItems: "center",
        },
        logoGlyph: { fontSize: 22 },
        titleBlock: {
            marginBottom: 10,
        },
        appName: {
            fontSize: 52,
            fontWeight: "900",
            color: theme.textPrimary,
            letterSpacing: -2,
            lineHeight: 52,
        },
        titleUnderline: {
            height: 3,
            backgroundColor: theme.accent,
            marginTop: 6,
        },
        tagline: {
            color: theme.textMuted,
            fontSize: 12,
            letterSpacing: 0.5,
            marginTop: 8,
        },
        form: { gap: 20, marginBottom: 40 },
        fieldGroup: { gap: 8 },
        fieldHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        fieldIndex: {
            color: theme.accent,
            fontSize: 9,
            fontWeight: "900",
            letterSpacing: 1,
        },
        fieldLabel: {
            color: theme.textMuted,
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 3,
        },
        inputContainer: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.bgCard,
            borderRadius: 0,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: "hidden",
        },
        inputContainerFocused: {
            borderColor: theme.accent,
            backgroundColor: theme.bgStrip,
        },
        inputAccent: {
            width: 3,
            alignSelf: "stretch",
            backgroundColor: theme.accent,
        },
        input: {
            flex: 1,
            color: theme.textPrimary,
            paddingHorizontal: 16,
            paddingVertical: 18,
            fontSize: 15,
            fontWeight: "500",
            letterSpacing: 0.3,
        },
        eyeBtn: {
            paddingHorizontal: 14,
            paddingVertical: 18,
            justifyContent: "center",
            alignItems: "center",
        },
        eyeText: {
            color: theme.accent,
            fontSize: 8,
            fontWeight: "900",
            letterSpacing: 1.5,
        },
        button: {
            backgroundColor: theme.accent,
            borderRadius: 0,
            marginTop: 8,
            overflow: "hidden",
        },
        buttonLoading: { opacity: 0.7 },
        buttonInner: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 20,
        },
        buttonText: {
            color: theme.bg,
            fontWeight: "900",
            fontSize: 14,
            letterSpacing: 3,
        },
        buttonArrow: {
            width: 36, height: 36,
            borderRadius: 0,
            backgroundColor: theme.bg,
            justifyContent: "center",
            alignItems: "center",
        },
        buttonArrowText: {
            color: theme.accent,
            fontSize: 18,
            fontWeight: "900",
        },
        footer: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingBottom: 20,
        },
        footerLine: {
            flex: 1,
            height: 1,
            backgroundColor: theme.border,
        },
        footerText: {
            color: theme.borderStrong,
            fontSize: 8,
            letterSpacing: 2,
            fontWeight: "700",
        },
    });
}