import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator, Share } from "react-native";
import { useFocusEffect } from "expo-router";
import { api, ApiError, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Connection {
  id: string;
  status: "PENDING" | "ACCEPTED";
  direction: "incoming" | "outgoing";
  other: { id: string; name: string; email: string };
}

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const result = await api<Connection[]>("/api/connections");
    setConnections(result);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleAdd() {
    setError(null);
    setLoading(true);
    try {
      await api("/api/connections", { method: "POST", body: JSON.stringify({ email }) });
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    await api(`/api/connections/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
    await load();
  }

  async function handleShareInvite() {
    if (!user) return;
    const link = `${API_URL}/invite/${user.inviteCode}`;
    await Share.share({
      message: `Join me on Nearby to find a room or roommate — we'll be connected right away: ${link}`,
      url: link,
    });
  }

  if (connections === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const accepted = connections.filter((c) => c.status === "ACCEPTED");
  const incoming = connections.filter((c) => c.status === "PENDING" && c.direction === "incoming");
  const outgoing = connections.filter((c) => c.status === "PENDING" && c.direction === "outgoing");

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Invite someone directly</Text>
            <Text style={styles.inviteBody}>
              Skip the group chat — share your link with a friend looking for a place. They&apos;ll be connected to
              you the moment they sign up.
            </Text>
            <Pressable style={styles.inviteButton} onPress={handleShareInvite}>
              <Text style={styles.inviteButtonText}>Share invite link</Text>
            </Pressable>
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="friend@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Pressable style={styles.addButton} onPress={handleAdd} disabled={loading}>
              <Text style={styles.addButtonText}>{loading ? "..." : "Add"}</Text>
            </Pressable>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}

          {incoming.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Requests waiting on you</Text>
              {incoming.map((c) => (
                <View key={c.id} style={styles.row}>
                  <Text>{c.other.name}</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable onPress={() => respond(c.id, "accept")}>
                      <Text style={styles.accept}>Accept</Text>
                    </Pressable>
                    <Pressable onPress={() => respond(c.id, "decline")}>
                      <Text style={styles.decline}>Decline</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View>
            <Text style={styles.sectionTitle}>Connections ({accepted.length})</Text>
            {accepted.length === 0 ? (
              <Text style={styles.empty}>No connections yet — add someone by email above.</Text>
            ) : (
              accepted.map((c) => (
                <View key={c.id} style={styles.row}>
                  <Text>{c.other.name}</Text>
                  <Text style={styles.subtle}>{c.other.email}</Text>
                </View>
              ))
            )}
          </View>

          {outgoing.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Waiting on them</Text>
              {outgoing.map((c) => (
                <View key={c.id} style={styles.row}>
                  <Text style={styles.subtle}>{c.other.name} — pending</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  inviteCard: { backgroundColor: "#dcece4", borderRadius: 12, padding: 14, gap: 8 },
  inviteTitle: { fontWeight: "700", color: "#255a42" },
  inviteBody: { fontSize: 13, color: "#255a42" },
  inviteButton: { backgroundColor: "#2f6f52", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  inviteButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  addRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  addButton: { backgroundColor: "#2f6f52", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626" },
  sectionTitle: { fontWeight: "700", marginBottom: 6, color: "#262626" },
  row: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", marginBottom: 6 },
  subtle: { color: "#737373", fontSize: 12 },
  empty: { color: "#737373" },
  accept: { color: "#2f6f52", fontWeight: "600" },
  decline: { color: "#737373" },
});
