import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/state/AuthContext";
import { pastel } from "../../src/theme/colors";
import { PrimaryButton } from "../../src/components/PrimaryButton";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtitle = useMemo(() => {
    return Platform.OS === "web"
      ? "A soft place to land, even in a browser tab."
      : "A soft place to land, right in your pocket.";
  }, []);

  async function onLogin() {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      // @ts-ignore - keep runtime-safe without leaning on types
      const msg = e?.message;
      setError(msg || "Something went sideways. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[pastel.bgTop, pastel.bgBottom]} style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <View style={styles.logoDot} />
          <Text style={styles.title}>MoodScript</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to sync your moods</Text>
          <Text style={styles.cardBody}>
            Your words stay yours. We just help them feel a little less heavy to carry.
          </Text>

          <PrimaryButton
            title={loading ? "Opening Google…" : "Continue with Google"}
            onPress={onLogin}
            loading={loading}
            style={styles.cta}
          />

          <View style={styles.row}>
            <Ionicons name="lock-closed" size={16} color={pastel.inkSoft} />
            <Text style={styles.rowText}>Private by default. No public profiles.</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
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
    justifyContent: "space-between",
  },
  header: {
    gap: 10,
  },
  logoDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: pastel.primary,
    opacity: 0.9,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: pastel.ink,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: pastel.inkSoft,
    lineHeight: 22,
  },
  card: {
    backgroundColor: pastel.card,
    borderWidth: 1,
    borderColor: pastel.border,
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: pastel.ink,
  },
  cardBody: {
    fontSize: 14,
    color: pastel.inkSoft,
    lineHeight: 20,
  },
  cta: {
    marginTop: 4,
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  rowText: {
    fontSize: 13,
    color: pastel.inkSoft,
  },
  error: {
    marginTop: 8,
    color: "#A61B3A",
    fontSize: 13,
    lineHeight: 18,
  },
});
