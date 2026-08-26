import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 4000;

export default function MessageThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const [otherName, setOtherName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ other: { name: string }; messages: Message[] }>(`/api/messages/${userId}`);
      setOtherName(data.other.name);
      setMessages(data.messages);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  async function handleSend() {
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    try {
      await api(`/api/messages/${userId}`, { method: "POST", body: JSON.stringify({ body }) });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fafaf9" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{otherName}</Text>
      </View>
      <FlatList
        ref={listRef}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        data={messages}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={[styles.bubbleRow, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={draft}
          onChangeText={setDraft}
          maxLength={2000}
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={!draft.trim()}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#dc2626", textAlign: "center" },
  header: { padding: 12, borderBottomWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff" },
  headerText: { fontWeight: "700", color: "#255a42", fontSize: 16 },
  bubbleRow: { flexDirection: "row" },
  bubble: { maxWidth: "75%", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  bubbleMine: { backgroundColor: "#2f6f52" },
  bubbleTheirs: { backgroundColor: "#f0f0f0" },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: "#262626" },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  sendButton: { backgroundColor: "#2f6f52", borderRadius: 20, paddingHorizontal: 16, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
