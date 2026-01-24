import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { pastel } from "../../src/theme/colors";
import { useAuth } from "../../src/state/AuthContext";
import { PrimaryButton } from "../../src/components/PrimaryButton";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <LinearGradient colors={[pastel.bgTop, pastel.bgBottom]} style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-circle" size={28} color={pastel.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name || "You"}</Text>
              <Text style={styles.email}>{user?.email || ""}</Text>
            </View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>—</Text>
              <Text style={styles.metricLabel}>Streak</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>—</Text>
              <Text style={styles.metricLabel}>XP</Text>
            </View>
          </View>

          <PrimaryButton title="Log out" onPress={logout} />
          <Text style={styles.note}>Streak + XP fill in after Phase 4.</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  card: {
    backgroundColor: pastel.card,
    borderWidth: 1,
    borderColor: pastel.border,
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  name: { fontSize: 18, fontWeight: "900", color: pastel.ink },
  email: { fontSize: 13, color: pastel.inkSoft, marginTop: 2 },
  metrics: { flexDirection: "row", gap: 12 },
  metric: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: pastel.border,
    backgroundColor: "rgba(109,94,247,0.06)",
  },
  metricValue: { fontSize: 20, fontWeight: "900", color: pastel.ink },
  metricLabel: { marginTop: 4, fontSize: 12, color: pastel.inkSoft },
  note: { fontSize: 12, lineHeight: 18, color: "rgba(29,26,43,0.55)" },
});
