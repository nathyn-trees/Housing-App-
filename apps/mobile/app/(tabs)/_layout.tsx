import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2f6f52", headerTitleStyle: { fontWeight: "700" } }}>
      <Tabs.Screen
        name="matches"
        options={{ title: "Matches", headerShown: false, tabBarIcon: ({ color }) => <TabIcon label="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: "Messages", tabBarIcon: ({ color }) => <TabIcon label="💬" color={color} /> }}
      />
      <Tabs.Screen
        name="connections"
        options={{ title: "Network", tabBarIcon: ({ color }) => <TabIcon label="🤝" color={color} /> }}
      />
    </Tabs>
  );
}
