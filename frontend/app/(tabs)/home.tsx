import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pastel } from "../../src/theme/colors";
import { useAuth } from "../../src/state/AuthContext";
import { PrimaryButton } from "../../src/components/PrimaryButton";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <LinearGradient colors={[pastel.bgTop, pastel.bgBottom]} style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.card}>
          <Text style={styles.kicker}>Today</Text>
          <Text style={styles.title}>How’s your heart feeling?</Text>
          <Text style={styles.body}>
            {user?.name ? `Hey, ${user.name}. ` : ""}Give it one honest sentence. We’ll take it from there.
          </Text>
          <PrimaryButton title="Start check-in" onPress={() => {}} disabled />
          <Text style={styles.note}>Check-ins land in Phase 2. Auth is live now.</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: pastel.card,
    borderWidth: 1,
    borderColor: pastel.border,
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: pastel.inkSoft,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: pastel.ink,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: pastel.inkSoft,
  },
  note: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(29,26,43,0.55)",
  },
});
