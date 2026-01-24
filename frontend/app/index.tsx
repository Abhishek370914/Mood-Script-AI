import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/state/AuthContext";
import { pastel } from "../src/theme/colors";

export default function Index() {
  const { isBooting, user } = useAuth();

  useEffect(() => {
    if (isBooting) return;

    if (user) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isBooting, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={pastel.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pastel.bgTop,
    alignItems: "center",
    justifyContent: "center",
  },
});
