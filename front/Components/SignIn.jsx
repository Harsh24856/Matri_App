import React, { useEffect, useState } from "react";
import { getApiBase } from "../lib/apiBase";
const API_BASE = getApiBase();

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignIn({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Simple connectivity ping
  useEffect(() => {
    console.log("Using API_BASE:", API_BASE);
    let cancelled = false;
    fetch(`${API_BASE}/`)
      .then((r) => r.json())
      .then((j) => !cancelled && console.log("Ping OK:", j))
      .catch((e) => !cancelled && console.log("Ping FAIL:", e));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // If server down / not JSON, avoid hard crash
      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // persist token + user
      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
      }
      await AsyncStorage.setItem("user", JSON.stringify(data.user || { email }));

      // lift to app state
      if (typeof setUser === "function") {
        setUser(data.user || { email });
      }

      navigation.replace("Home");
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to your account</Text>

        <View style={styles.form}>
          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Sign In button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submit, loading ? styles.submitDisabled : styles.submitEnabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          New to App?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("SignUp")}
          >
            Create Account
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------- Enhanced Styles for iPhone ---------------- */
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  form: { 
    marginTop: 20, 
    gap: 18,
  },
  field: { 
    gap: 8,
    marginBottom: 4,
  },
  label: { 
    fontSize: 15, 
    color: "#374151", 
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#111827",
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  error: { 
    color: "#DC2626", 
    fontSize: 14, 
    marginTop: 4,
    fontWeight: "500",
  },
  submit: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitEnabled: { 
    backgroundColor: "#EA580C",
  },
  submitDisabled: { 
    backgroundColor: "#FDBA74",
  },
  submitText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },

  footerText: {
    marginTop: 24,
    textAlign: "center",
    color: "#4B5563",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  link: { 
    color: "#EA580C", 
    fontWeight: "700",
    fontSize: 15,
  },
});