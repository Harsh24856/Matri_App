// Components/Dashboard.jsx
import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { AuthContext } from "../App";       // ⬅️ read auth from context
import { getApiBase } from "../lib/apiBase";
const API_BASE = getApiBase();

export default function Dashboard() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(AuthContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Kick back to SignIn if somehow rendered without user (belt & suspenders)
  useEffect(() => {
    if (!user) navigation.replace("SignIn");
  }, [user, navigation]);

  const load = useCallback(async () => {
    setError("");
    try {
      const token = (await AsyncStorage.getItem("token")) || "";
      const res = await fetch(`${API_BASE}/dashboard/last20`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 401) {
        // session expired -> clear and go to SignIn
        await AsyncStorage.multiRemove(["token", "user"]);
        setUser?.(null);
        navigation.replace("SignIn");
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load");
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, navigation, setUser]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const markSurveyed = async (id) => {
    // optimistic UI
    setData((prev) => prev.map((row) => (row.id === id ? { ...row, surveyed: true } : row)));
    try {
      const token = (await AsyncStorage.getItem("token")) || "";
      const res = await fetch(`${API_BASE}/dashboard/survey/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 401) {
        await AsyncStorage.multiRemove(["token", "user"]);
        setUser?.(null);
        navigation.replace("SignIn");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      // revert optimistic
      setData((prev) => prev.map((row) => (row.id === id ? { ...row, surveyed: false } : row)));
      Alert.alert("Update failed", err?.message || "Could not mark as surveyed");
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Please sign in to view the dashboard.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading dashboard…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>⚠️ Error: {error}</Text>
        <Pressable onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const headers = [
    "ID",
    "Name",
    "Age",
    "Past Pregnancies",
    "Mother BG",
    "Father BG",
    "Mother Medical BG",
    "Father Medical BG",
    "Delivery Type",
    "Haemoglobin",
    "Created At",
    "Reminder Date",
    "Surveyed",
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.h1}>📊 Last 20 Insertions</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tr, styles.trHeader]}>
            {headers.map((h) => (
              <Text key={h} style={[styles.th, styles.cell]}>{h}</Text>
            ))}
          </View>

          {/* Rows */}
          {data.length === 0 ? (
            <View style={styles.tr}>
              <Text style={[styles.td, styles.cell, styles.muted]}>No rows found</Text>
            </View>
          ) : (
            data.map((row) => {
              const createdAt = new Date(row.created_at);
              const reminderDate = new Date(createdAt);
              if (!isNaN(reminderDate)) reminderDate.setMonth(reminderDate.getMonth() + 9);
              const overdue = !isNaN(reminderDate) && reminderDate < new Date();

              return (
                <View key={row.id} style={styles.tr}>
                  <Text style={[styles.td, styles.cell]}>{row.id}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.name}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.age}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.past_pregnancy_count}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.blood_group_mother}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.blood_group_father}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.medical_bg_mother}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.medical_bg_father}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.delivery_type}</Text>
                  <Text style={[styles.td, styles.cell]}>{row.haemoglobin}</Text>
                  <Text style={[styles.td, styles.cell, styles.muted]}>
                    {isNaN(createdAt) ? "-" : createdAt.toLocaleDateString()}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      styles.cell,
                      { color: overdue ? "#b91c1c" : "#1d4ed8", fontWeight: "700" },
                    ]}
                  >
                    {isNaN(reminderDate) ? "-" : reminderDate.toLocaleDateString()}
                  </Text>
                  <View style={[styles.td, styles.cell, { alignItems: "center" }]}>
                    <Pressable
                      onPress={() => markSurveyed(row.id)}
                      disabled={row.surveyed}
                      style={[
                        styles.surveyBtn,
                        row.surveyed ? styles.surveyDone : styles.surveyIdle,
                      ]}
                    >
                      {row.surveyed ? <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text> : null}
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const COL_MIN_WIDTH = 160;

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#f9fafb",
    gap: 16,
  },
  h1: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f9fafb",
  },
  muted: { 
    color: "#6b7280",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  error: { 
    color: "#b91c1c", 
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  retryText: { 
    color: "#fff", 
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  table: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  trHeader: {
    backgroundColor: "#f3f4f6",
  },
  cell: {
    minWidth: COL_MIN_WIDTH,
  },
  th: {
    padding: 12,
    fontWeight: "800",
    color: "#111827",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  td: {
    padding: 12,
    color: "#111827",
    fontSize: 14,
  },

  surveyBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  surveyIdle: { 
    backgroundColor: "#fff", 
    borderColor: "#9ca3af" 
  },
  surveyDone: { 
    backgroundColor: "#16a34a", 
    borderColor: "#15803d" 
  },
});