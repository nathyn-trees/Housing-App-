import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { api } from "@/lib/api";

interface Conversation {
  otherId: string;
  otherName: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  const load = useCallback(async () => {
    const result = await api<Conversation[]>("/api/messages");
    setConversations(result);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (conversations === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 8 }}
      data={conversations}
      keyExtractor={(c) => c.otherId}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Nothing here yet. Messaging unlocks once you&apos;re connected with someone, or you both mark each other
            interested.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/messages/${item.otherId}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.otherName}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { textAlign: "center", color: "#737373" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#e5e5e5" },
  name: { fontWeight: "700", color: "#255a42" },
  preview: { color: "#737373", fontSize: 13, marginTop: 2 },
  badge: { backgroundColor: "#2f6f52", borderRadius: 10, minWidth: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
