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
        <Stack.Screen name="need" options={{ title: "What are you looking for?" }} />
        <Stack.Screen name="lifestyle" options={{ title: "What are you like to live with?" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="messages/[userId]" options={{ title: "Message" }} />
        <Stack.Screen name="profile/[userId]" options={{ title: "Profile" }} />
        <Stack.Screen name="account" options={{ title: "Account" }} />
      </Stack>
    </AuthProvider>
  );
}
