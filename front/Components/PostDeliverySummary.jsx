import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || ""; // mirror your env usage

export default function PostDeliverySummary() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setErr("No record id provided");
        setLoading(false);
        return;
      }
      try {
        const token = (await AsyncStorage.getItem("token")) || "";
        const res = await fetch(`${API_BASE}/post-delivery/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(data.error || "Failed to load record");
          setLoading(false);
          return;
        }
        setRecord(data.record);
      } catch (e) {
        setErr("Server error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const openPredictionJson = async () => {
    if (!record?.id) return;
    const url = `${API_BASE}/predictions/prediction_${record.id}.json`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) Linking.openURL(url);
    else Alert.alert("Cannot open link", url);
  };

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.body}>Loading…</Text>
      </ScrollView>
    );
  }

  if (err) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Text style={styles.error}>{err}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.linkBtn}>
            <Text style={styles.linkText}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (!record) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.body}>No record found.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Post-Delivery Summary</Text>

        <View style={styles.row}>
          <Text style={styles.term}>ID</Text>
          <Text style={styles.def}>{record.id}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Delivery Date</Text>
          <Text style={styles.def}>{record.delivery_date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Child Weight (kg)</Text>
          <Text style={styles.def}>{record.child_weight_kg}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Complications</Text>
          <Text style={styles.def}>{record.complications || "None"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Mother diseases</Text>
          <Text style={styles.def}>{record.mother_diseases || "None"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Father diseases</Text>
          <Text style={styles.def}>{record.father_diseases || "None"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Notes</Text>
          <Text style={styles.def}>{record.notes || "—"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.term}>Submitted at</Text>
          <Text style={styles.def}>{record.submitted_at || record.created_at}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => navigation.goBack()} style={styles.linkBtn}>
            <Text style={styles.linkText}>Back</Text>
          </Pressable>

          <Pressable onPress={openPredictionJson} style={styles.linkBtn}>
            <Text style={styles.linkText}>View prediction JSON</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: "#F3F4F6",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  row: {
    marginBottom: 10,
  },
  term: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  def: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  body: {
    color: "#374151",
  },
  error: {
    color: "#DC2626",
    marginBottom: 12,
    fontWeight: "600",
  },
});