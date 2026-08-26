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

interface MatchBreakdown {
  budget: number;
  location: number;
  timeline: number;
  roomType: number;
  trust: number;
  lifestyle: number;
}

interface Match {
  userId: string;
  name: string;
  bio: string | null;
  kind: "need" | "offer";
  degree: number;
  via: { id: string; name: string } | null;
  score: number;
  breakdown: MatchBreakdown;
  vouchCount: number;
  action: "INTERESTED" | "PASSED" | null;
  need: MatchNeed;
  lifestyle: unknown | null;
  canMessage: boolean;
}

const BARS: { key: keyof MatchBreakdown; label: string }[] = [
  { key: "budget", label: "Budget" },
  { key: "location", label: "Area" },
  { key: "timeline", label: "Timing" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "trust", label: "Trust" },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
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
        <Pressable onPress={() => router.push("/account")}>
          <Text style={styles.headerText}>Hi {user?.name}</Text>
        </Pressable>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        numColumns={2}
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
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item.name)}</Text>
              </View>
              <Text style={styles.score}>{item.score}%</Text>
            </View>
            <Pressable onPress={() => router.push(`/profile/${item.userId}`)}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
            <Text style={styles.meta} numberOfLines={1}>
              {item.degree === 1 ? "Direct" : item.via ? `Via ${item.via.name}` : `${item.degree}° away`}
              {item.vouchCount > 0 ? ` · ${item.vouchCount}v` : ""}
            </Text>
            <Text style={styles.badge}>{item.kind === "offer" ? "Has a room" : "Looking"}</Text>
            <Text style={styles.detail}>
              ${item.need.budgetMin}
              {item.need.budgetMax !== item.need.budgetMin ? `–$${item.need.budgetMax}` : ""}/mo
            </Text>
            <Text style={styles.detail}>{new Date(item.need.moveInDate).toLocaleDateString()}</Text>

            <View style={styles.bars}>
              {BARS.map(({ key, label }) => {
                const noProfile = key === "lifestyle" && !item.lifestyle;
                return (
                  <View key={key} style={styles.barRow}>
                    <Text style={styles.barLabel}>{label}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.round(item.breakdown[key] * 100)}%` },
                          noProfile && styles.barFillNeutral,
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.interestedButton} onPress={() => act(item.userId, "INTERESTED")}>
                <Text style={styles.interestedText} numberOfLines={1}>
                  {item.action === "INTERESTED" ? "Interested ✓" : "Interested"}
                </Text>
              </Pressable>
              <Pressable onPress={() => act(item.userId, "PASSED")}>
                <Text style={styles.passText}>Pass</Text>
              </Pressable>
            </View>
            {item.canMessage && (
              <Pressable onPress={() => router.push(`/messages/${item.userId}`)}>
                <Text style={styles.messageLink}>Message</Text>
              </Pressable>
            )}
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
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e5e5" },
  avatarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#dcece4", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#255a42", fontWeight: "700", fontSize: 12 },
  score: { fontSize: 12, fontWeight: "700", color: "#2f6f52" },
  name: { fontSize: 14, fontWeight: "700", color: "#255a42", marginTop: 6 },
  meta: { fontSize: 11, color: "#737373" },
  badge: { fontSize: 10, color: "#525252", backgroundColor: "#f5f5f5", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  detail: { fontSize: 12, color: "#525252", marginTop: 2 },
  bars: { marginTop: 8, gap: 3 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  barLabel: { fontSize: 9, color: "#a3a3a3", width: 40 },
  barTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#f0f0f0", overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#2f6f52", borderRadius: 2 },
  barFillNeutral: { backgroundColor: "#d4d4d4" },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  interestedButton: { flex: 1, borderWidth: 1, borderColor: "#2f6f52", borderRadius: 8, paddingVertical: 6, alignItems: "center", marginRight: 8 },
  interestedText: { color: "#2f6f52", fontWeight: "600", fontSize: 11 },
  passText: { color: "#737373", fontSize: 11 },
  messageLink: { color: "#255a42", fontSize: 11, textDecorationLine: "underline", marginTop: 8, textAlign: "center" },
});
