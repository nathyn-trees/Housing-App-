import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, Link, router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface MatchNeed {
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  urgency: string;
  neighborhoods: string | null;
  notes?: string | null;
  description?: string | null;
}

interface Match {
  userId: string;
  name: string;
  bio: string | null;
  kind: "need" | "offer";
  degree: number;
  via: { id: string; name: string } | null;
  score: number;
  vouchCount: number;
  action: "INTERESTED" | "PASSED" | null;
  need: MatchNeed;
}

export default function MatchesScreen() {
  const { user, logout } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [hasNeed, setHasNeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await api<{ viewerNeed: unknown; matches: Match[] }>("/api/matches");
    setHasNeed(!!result.viewerNeed);
    setMatches(result.matches);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function act(targetUserId: string, action: "INTERESTED" | "PASSED") {
    setMatches((prev) => (action === "PASSED" ? (prev ?? []).filter((m) => m.userId !== targetUserId) : prev));
    await api("/api/matches/action", { method: "POST", body: JSON.stringify({ targetUserId, action }) });
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (matches === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasNeed) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Tell us what you&apos;re looking for</Text>
        <Pressable style={styles.button} onPress={() => router.push("/need")}>
          <Text style={styles.buttonText}>Get started</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fafaf9" }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Hi {user?.name}</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={matches}
        keyExtractor={(m) => m.userId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No matches yet within your network.</Text>
            <Link href="/connections" style={styles.link}>
              Grow your network
            </Link>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.score}>{item.score}% match</Text>
            </View>
            <Text style={styles.badge}>{item.kind === "offer" ? "Has a room" : "Looking for a place"}</Text>
            <Text style={styles.meta}>
              {item.degree === 1 ? "Direct connection" : item.via ? `Connected via ${item.via.name}` : `${item.degree} degrees away`}
              {item.vouchCount > 0 ? ` · ${item.vouchCount} vouch${item.vouchCount === 1 ? "" : "es"}` : ""}
            </Text>
            {item.bio && <Text style={styles.bio}>{item.bio}</Text>}
            <Text style={styles.detail}>
              ${item.need.budgetMin}
              {item.need.budgetMax !== item.need.budgetMin ? `–$${item.need.budgetMax}` : ""}/mo · Move-in{" "}
              {new Date(item.need.moveInDate).toLocaleDateString()}
            </Text>
            {(item.need.notes || item.need.description) && <Text style={styles.notes}>{item.need.notes || item.need.description}</Text>}
            <View style={styles.actions}>
              <Pressable style={styles.interestedButton} onPress={() => act(item.userId, "INTERESTED")}>
                <Text style={styles.interestedText}>{item.action === "INTERESTED" ? "Interested ✓" : "I'm interested"}</Text>
              </Pressable>
              <Pressable onPress={() => act(item.userId, "PASSED")}>
                <Text style={styles.passText}>Pass</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#e5e5e5" },
  headerText: { fontWeight: "600", fontSize: 16 },
  logout: { color: "#737373" },
  emptyTitle: { fontSize: 16, color: "#404040", textAlign: "center" },
  link: { color: "#255a42", textDecorationLine: "underline" },
  button: { backgroundColor: "#2f6f52", padding: 14, borderRadius: 8, paddingHorizontal: 24 },
  buttonText: { color: "#fff", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e5e5", gap: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700", color: "#255a42" },
  score: { fontSize: 12, fontWeight: "600", color: "#2f6f52" },
  badge: { fontSize: 11, color: "#525252", backgroundColor: "#f5f5f5", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  meta: { fontSize: 12, color: "#737373" },
  bio: { fontSize: 14, color: "#404040", marginTop: 4 },
  detail: { fontSize: 13, color: "#525252", marginTop: 4 },
  notes: { fontSize: 13, color: "#525252", backgroundColor: "#fafafa", padding: 8, borderRadius: 6, marginTop: 4 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8, alignItems: "center" },
  interestedButton: { borderWidth: 1, borderColor: "#2f6f52", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  interestedText: { color: "#2f6f52", fontWeight: "600", fontSize: 13 },
  passText: { color: "#737373", fontSize: 13 },
});
