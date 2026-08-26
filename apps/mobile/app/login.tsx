import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { ApiError, API_URL } from "@/lib/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.hint}>
        Demo: alice@example.com / bob@example.com / cara@example.com / nathyn@example.com — password: password123
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
      </Pressable>
      <Pressable onPress={() => Linking.openURL(`${API_URL}/forgot-password`)}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>
      <Link href="/signup" style={styles.link}>
        Need an account? Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12, backgroundColor: "#fafaf9" },
  title: { fontSize: 28, fontWeight: "700", color: "#255a42", marginBottom: 8 },
  hint: { fontSize: 12, color: "#255a42", backgroundColor: "#dcece4", padding: 10, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#fff" },
  button: { backgroundColor: "#2f6f52", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#dc2626" },
  link: { color: "#255a42", textAlign: "center", marginTop: 12, textDecorationLine: "underline" },
});
