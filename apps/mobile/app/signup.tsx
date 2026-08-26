import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { ApiError, API_URL } from "@/lib/api";

export default function SignupScreen() {
  const { signup } = useAuth();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(invite ?? "");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, password, city, inviteCode || undefined, agreed);
      router.replace("/need");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="City (e.g. New York, NY)" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput
        style={styles.input}
        placeholder="Invite code (optional)"
        autoCapitalize="none"
        value={inviteCode}
        onChangeText={setInviteCode}
      />
      <Pressable style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
        <Text style={styles.agreeText}>
          I agree to the{" "}
          <Text style={styles.link} onPress={() => Linking.openURL(`${API_URL}/terms`)}>
            Terms
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={() => Linking.openURL(`${API_URL}/privacy`)}>
            Privacy Policy
          </Text>
        </Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleSignup} disabled={loading || !agreed}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign up</Text>}
      </Pressable>
      <Link href="/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12, backgroundColor: "#fafaf9" },
  title: { fontSize: 28, fontWeight: "700", color: "#255a42", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#fff" },
  button: { backgroundColor: "#2f6f52", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#dc2626" },
  link: { color: "#255a42", textAlign: "center", marginTop: 12, textDecorationLine: "underline" },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: "#d4d4d4", marginTop: 2 },
  checkboxChecked: { backgroundColor: "#2f6f52", borderColor: "#2f6f52" },
  agreeText: { flex: 1, fontSize: 13, color: "#404040" },
});
