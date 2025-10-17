// src/Components/SignUp.jsx
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

export default function SignUp({ setUser }) {
  const [username, setUsername] = useState("");
  const [govtId, setGovtId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Connectivity ping to confirm API_BASE is reachable
  useEffect(() => {
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

    const u = username.trim();
    const g = govtId.trim();
    const e = email.trim();
    const p = password;
    const c = confirm;

    if (!u || !g || !e || !p || !c) {
      setError("Please fill all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Please enter a valid email.");
      return;
    }
    if (p.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (p !== c) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Abort after 12s to avoid indefinite hang on device
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, email: e, password: p, govt_id: g }),
        signal: controller.signal,
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        // backend might return empty body on errors; ignore parse error
      }

      if (!res.ok) {
        setError(data.error || `Registration failed (${res.status})`);
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
await AsyncStorage.setItem("user", JSON.stringify(data.user));
setUser(data.user);
      }
      await AsyncStorage.setItem("user", JSON.stringify(data.user || { email: e }));

      setUser?.(data.user || { email: e });
      navigation.replace("Home");
    } catch (err) {
      if (err?.name === "AbortError") {
        setError("Request timed out. Check your network or server.");
      } else {
        setError("Network error. Ensure device and server share the same network and API_BASE is correct.");
        console.log("Registration error:", err);
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>

        <View style={styles.form}>
          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          {/* Government ID */}
          <View style={styles.field}>
            <Text style={styles.label}>Government ID</Text>
            <TextInput
              value={govtId}
              onChangeText={setGovtId}
              placeholder="e.g., AB1234…"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="characters"
            />
          </View>

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

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Sign Up button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submit, loading ? styles.submitDisabled : styles.submitEnabled]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Sign up</Text>}
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("SignIn")}>
            Sign in
          </Text>
        </Text>

        {/* Helpful during on-device testing */}
        <Text style={styles.apiHint}>API: {API_BASE}</Text>
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
    gap: 16,
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
  apiHint: {
    marginTop: 12,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});