import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Blocked {
  id: string;
  name: string;
}

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api<Blocked[]>("/api/blocks").then(setBlocked).catch(() => {});
    }, []),
  );

  async function unblock(id: string) {
    await api(`/api/blocks/${id}`, { method: "DELETE" });
    setBlocked((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleDelete() {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api("/api/account", { method: "DELETE", body: JSON.stringify({ password }) });
      await logout();
      router.replace("/login");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete account?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.email}</Text>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Blocked users</Text>
      {blocked.length === 0 ? (
        <Text style={styles.subtle}>You haven&apos;t blocked anyone.</Text>
      ) : (
        blocked.map((b) => (
          <View key={b.id} style={styles.blockedRow}>
            <Text>{b.name}</Text>
            <Pressable onPress={() => unblock(b.id)}>
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.dangerText}>
          This permanently deletes your profile, housing need/offer, connections, messages, and vouches.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.deleteButton} onPress={confirmDelete} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>Delete my account</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 8, backgroundColor: "#fafaf9" },
  email: { fontSize: 14, color: "#525252" },
  logoutButton: { alignSelf: "flex-start", marginTop: 8 },
  logoutText: { color: "#737373", textDecorationLine: "underline" },
  sectionTitle: { fontWeight: "700", marginTop: 24, marginBottom: 6, color: "#262626" },
  subtle: { color: "#737373", fontSize: 13 },
  blockedRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", marginBottom: 6 },
  unblockText: { color: "#255a42", textDecorationLine: "underline" },
  dangerZone: { marginTop: 32, backgroundColor: "#fef2f2", borderRadius: 10, padding: 14, gap: 8 },
  dangerTitle: { fontWeight: "700", color: "#991b1b" },
  dangerText: { fontSize: 13, color: "#b91c1c" },
  input: { borderWidth: 1, borderColor: "#fca5a5", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  error: { color: "#991b1b", fontSize: 13 },
  deleteButton: { backgroundColor: "#dc2626", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
});
