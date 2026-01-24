import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pastel } from "../../src/theme/colors";

export default function Create() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[pastel.bgTop, pastel.bgBottom]} style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.card}>
          <Text style={styles.title}>Create</Text>
          <Text style={styles.body}>
            Journaling prompts + mood art concepts arrive right after check-ins.
          </Text>
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
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: "900", color: pastel.ink },
  body: { fontSize: 14, lineHeight: 20, color: pastel.inkSoft },
});
