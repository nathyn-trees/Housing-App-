import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { api, ApiError } from "@/lib/api";

const FREQUENCIES = ["NEVER", "RARELY", "SOMETIMES", "OFTEN", "ALWAYS"] as const;
const SOCIAL_STYLES = ["INTROVERT", "AMBIVERT", "EXTROVERT"] as const;
const CLEANLINESS_LEVELS = [1, 2, 3, 4, 5] as const;

function ChoiceRow<T extends string | number>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.choiceRow}>
      {options.map((opt) => (
        <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.choice, value === opt && styles.choiceSelected]}>
          <Text style={[styles.choiceText, value === opt && styles.choiceTextSelected]}>
            {typeof opt === "string" ? opt.charAt(0) + opt.slice(1).toLowerCase() : opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function LifestyleScreen() {
  const [cleanliness, setCleanliness] = useState<(typeof CLEANLINESS_LEVELS)[number]>(3);
  const [timeAtHome, setTimeAtHome] = useState<(typeof FREQUENCIES)[number]>("SOMETIMES");
  const [hostingGuests, setHostingGuests] = useState<(typeof FREQUENCIES)[number]>("SOMETIMES");
  const [socialStyle, setSocialStyle] = useState<(typeof SOCIAL_STYLES)[number]>("AMBIVERT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      await api("/api/lifestyle", { method: "POST", body: JSON.stringify({ cleanliness, timeAtHome, hostingGuests, socialStyle }) });
      router.replace("/matches");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>Optional, but it&apos;s what actually makes or breaks a roommate.</Text>

      <Text style={styles.label}>Cleanliness (1 = relaxed, 5 = very tidy)</Text>
      <ChoiceRow options={CLEANLINESS_LEVELS} value={cleanliness} onChange={setCleanliness} />

      <Text style={styles.label}>How often are you home?</Text>
      <ChoiceRow options={FREQUENCIES} value={timeAtHome} onChange={setTimeAtHome} />

      <Text style={styles.label}>How often do you have people over?</Text>
      <ChoiceRow options={FREQUENCIES} value={hostingGuests} onChange={setHostingGuests} />

      <Text style={styles.label}>Social style</Text>
      <ChoiceRow options={SOCIAL_STYLES} value={socialStyle} onChange={setSocialStyle} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save and see matches</Text>}
      </Pressable>
      <Pressable onPress={() => router.replace("/matches")}>
        <Text style={styles.skip}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, backgroundColor: "#fafaf9" },
  intro: { fontSize: 13, color: "#525252", marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#404040", marginTop: 12 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#fff" },
  choiceSelected: { backgroundColor: "#2f6f52", borderColor: "#2f6f52" },
  choiceText: { fontSize: 13, color: "#404040" },
  choiceTextSelected: { color: "#fff" },
  button: { backgroundColor: "#2f6f52", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  skip: { color: "#737373", textAlign: "center", marginTop: 12, textDecorationLine: "underline" },
  error: { color: "#dc2626" },
});
