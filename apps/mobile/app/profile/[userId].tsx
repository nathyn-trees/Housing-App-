import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { StyleSheet } from "react-native";
import { api, ApiError } from "@/lib/api";

interface Vouch {
  id: string;
  voucherName: string;
  note: string;
}

interface Profile {
  id: string;
  name: string;
  bio: string | null;
  degree: number;
  via: { id: string; name: string } | null;
  invitedBy: { id: string; name: string } | null;
  vouches: Vouch[];
  canVouch: boolean;
  canMessage: boolean;
}

const REASONS = ["harassment", "scam", "no_show", "fake_profile", "other"] as const;

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vouchNote, setVouchNote] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportDetails, setReportDetails] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<Profile>(`/api/profile/${userId}`);
      setProfile(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submitVouch() {
    if (!vouchNote.trim()) return;
    await api("/api/vouches", { method: "POST", body: JSON.stringify({ targetUserId: userId, note: vouchNote }) });
    setVouchNote("");
    load();
  }

  async function submitReport(reason: string) {
    await api("/api/reports", { method: "POST", body: JSON.stringify({ targetUserId: userId, reason, details: reportDetails }) });
    setShowReport(false);
    Alert.alert("Report submitted", "Thanks — we've received your report.");
  }

  function confirmBlock() {
    Alert.alert("Block this person?", "You won't see each other anywhere in the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          await api("/api/blocks", { method: "POST", body: JSON.stringify({ targetUserId: userId }) });
          router.back();
        },
      },
    ]);
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.meta}>
        {profile.degree === 1 ? "Direct connection" : `${profile.degree} degrees away${profile.via ? ` · connected via ${profile.via.name}` : ""}`}
      </Text>
      {profile.invitedBy && <Text style={styles.meta}>Invited by {profile.invitedBy.name}</Text>}
      {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {profile.canMessage && (
        <Pressable style={styles.messageButton} onPress={() => router.push(`/messages/${profile.id}`)}>
          <Text style={styles.messageButtonText}>Message</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Vouches ({profile.vouches.length})</Text>
      {profile.vouches.length === 0 ? (
        <Text style={styles.subtle}>No one has vouched for {profile.name} yet.</Text>
      ) : (
        profile.vouches.map((v) => (
          <View key={v.id} style={styles.vouchRow}>
            <Text style={styles.vouchText}>
              <Text style={{ fontWeight: "700" }}>{v.voucherName}</Text>: {v.note}
            </Text>
          </View>
        ))
      )}

      {profile.canVouch && (
        <View style={styles.vouchForm}>
          <Text style={styles.sectionTitle}>Vouch for {profile.name}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Known them for years, clean and reliable."
            value={vouchNote}
            onChangeText={setVouchNote}
            multiline
          />
          <Pressable style={styles.submitButton} onPress={submitVouch}>
            <Text style={styles.submitButtonText}>Submit vouch</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.safetyRow}>
        {showReport ? (
          <View style={{ gap: 8 }}>
            <TextInput
              style={styles.input}
              placeholder="Anything else we should know? (optional)"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {REASONS.map((r) => (
                <Pressable key={r} style={styles.reasonChip} onPress={() => submitReport(r)}>
                  <Text style={styles.reasonChipText}>{r.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setShowReport(false)}>
              <Text style={styles.subtle}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Pressable onPress={() => setShowReport(true)}>
              <Text style={styles.safetyLink}>Report</Text>
            </Pressable>
            <Pressable onPress={confirmBlock}>
              <Text style={[styles.safetyLink, { color: "#dc2626" }]}>Block</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#dc2626", textAlign: "center" },
  container: { padding: 20, gap: 6, backgroundColor: "#fafaf9" },
  name: { fontSize: 22, fontWeight: "700", color: "#255a42" },
  meta: { fontSize: 13, color: "#737373" },
  bio: { fontSize: 14, color: "#404040", marginTop: 6 },
  messageButton: { backgroundColor: "#2f6f52", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  messageButtonText: { color: "#fff", fontWeight: "600" },
  sectionTitle: { fontWeight: "700", color: "#262626", marginTop: 16, marginBottom: 6 },
  subtle: { color: "#737373", fontSize: 13 },
  vouchRow: { backgroundColor: "#fff", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#e5e5e5", marginBottom: 6 },
  vouchText: { fontSize: 13, color: "#404040" },
  vouchForm: { marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, padding: 10, backgroundColor: "#fff", fontSize: 13 },
  submitButton: { backgroundColor: "#2f6f52", borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 8 },
  submitButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  safetyRow: { marginTop: 24, borderTopWidth: 1, borderColor: "#e5e5e5", paddingTop: 12 },
  safetyLink: { color: "#737373", textDecorationLine: "underline", fontSize: 13 },
  reasonChip: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 16, paddingVertical: 4, paddingHorizontal: 10 },
  reasonChipText: { fontSize: 12, color: "#404040" },
});
