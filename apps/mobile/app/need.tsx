import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const URGENCIES = ["FLEXIBLE", "SOON", "URGENT"] as const;
const ROOM_TYPES = ["ANY", "PRIVATE_ROOM", "SHARED_ROOM", "ENTIRE_PLACE"] as const;

function ChoiceRow<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.choiceRow}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          style={[styles.choice, value === opt && styles.choiceSelected]}
        >
          <Text style={[styles.choiceText, value === opt && styles.choiceTextSelected]}>{opt.replace("_", " ")}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NeedScreen() {
  const { refresh } = useAuth();
  const [city, setCity] = useState("");
  const [neighborhoods, setNeighborhoods] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>("FLEXIBLE");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>("ANY");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      await api("/api/needs", {
        method: "POST",
        body: JSON.stringify({ city, neighborhoods, budgetMin, budgetMax, moveInDate, urgency, roomType, notes, visibility: 2 }),
      });
      await refresh();
      router.replace("/matches");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>City</Text>
      <TextInput style={styles.input} placeholder="New York, NY" value={city} onChangeText={setCity} />

      <Text style={styles.label}>Neighborhoods (optional)</Text>
      <TextInput style={styles.input} placeholder="Bushwick, Williamsburg" value={neighborhoods} onChangeText={setNeighborhoods} />

      <Text style={styles.label}>Budget range ($/mo)</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min" keyboardType="numeric" value={budgetMin} onChangeText={setBudgetMin} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Max" keyboardType="numeric" value={budgetMax} onChangeText={setBudgetMax} />
      </View>

      <Text style={styles.label}>Move-in date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="2026-09-01" value={moveInDate} onChangeText={setMoveInDate} />

      <Text style={styles.label}>Urgency</Text>
      <ChoiceRow options={URGENCIES} value={urgency} onChange={setUrgency} />

      <Text style={styles.label}>Room type</Text>
      <ChoiceRow options={ROOM_TYPES} value={roomType} onChange={setRoomType} />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={[styles.input, { height: 80 }]} multiline value={notes} onChangeText={setNotes} />

      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save and see matches</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, backgroundColor: "#fafaf9" },
  label: { fontSize: 13, fontWeight: "600", color: "#404040", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: "#fff" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1, borderColor: "#d4d4d4", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#fff" },
  choiceSelected: { backgroundColor: "#2f6f52", borderColor: "#2f6f52" },
  choiceText: { fontSize: 13, color: "#404040" },
  choiceTextSelected: { color: "#fff" },
  button: { backgroundColor: "#2f6f52", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#dc2626" },
});
