// PostDel.js (React Native, JavaScript)
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function PostDel({ user }) {
  const navigation = useNavigation();

  // redirect to SignIn if unauthenticated
  useEffect(() => {
    if (user === undefined) return; // still resolving session
    if (!user) navigation.replace("SignIn");
  }, [user, navigation]);

  // loading state (user not resolved yet)
  if (user === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // while redirecting, render nothing
  if (!user) return null;

  // authenticated view
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Post-Del</Text>
      {/* your screen UI goes here */}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FFF",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#4B5563",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 16,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
});