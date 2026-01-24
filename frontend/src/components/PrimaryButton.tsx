import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { pastel } from "../theme/colors";

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: pastel.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
