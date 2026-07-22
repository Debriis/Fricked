import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar, View, ActivityIndicator, Text } from "react-native";
import { getCredentials, saveToken } from "../utils/storage";
import { login } from "../utils/api";
import { ThemeProvider } from "../utils/ThemeContext";

export default function RootLayout() {
    const [checking, setChecking] = useState(true);
    const [statusText, setStatusText] = useState("INITIALISING");
    const router = useRouter();

    useEffect(() => {
        const autoLogin = async () => {
            try {
                const creds = await getCredentials();
                if (!creds) {
                    setChecking(false);
                    return;
                }

                setStatusText("LOGGING IN");
                const res = await login(creds.username, creds.password);

                if (!res.data.authenticated || res.data.captcha) {
                    setChecking(false);
                    return;
                }

                await saveToken(res.data.cookies);
                router.replace("/dashboard");
                setChecking(false);
            } catch (e) {
                setChecking(false);
            }
        };

        autoLogin();
    }, []);

    return (
        <ThemeProvider>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
            {checking && (
                <View style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "#1A1A1A",
                    justifyContent: "center", alignItems: "center", gap: 16,
                }}>
                    <ActivityIndicator size="large" color="#ff6b2b" />
                    <Text style={{
                        color: "#333", fontSize: 10, fontWeight: "900", letterSpacing: 3,
                    }}>
                        {statusText}
                    </Text>
                </View>
            )}
        </ThemeProvider>
    );
}