import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
        </>
    );
}