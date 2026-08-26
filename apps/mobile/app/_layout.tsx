import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitleStyle: { fontWeight: "700" } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Log in" }} />
        <Stack.Screen name="signup" options={{ title: "Sign up" }} />
        <Stack.Screen name="matches" options={{ title: "Your matches" }} />
        <Stack.Screen name="need" options={{ title: "What are you looking for?" }} />
        <Stack.Screen name="connections" options={{ title: "Your network" }} />
      </Stack>
    </AuthProvider>
  );
}
