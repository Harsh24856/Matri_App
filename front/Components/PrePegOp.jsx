import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PrePegOp() {
  const navigation = useNavigation();
  const route = useRoute();
  const [payload, setPayload] = useState(route.params?.payload || null);

  useEffect(() => {
    (async () => {
      if (payload) return; // already have it via params
      try {
        const stored = await AsyncStorage.getItem("lastPredictionResponse");
        if (stored) setPayload(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed reading lastPredictionResponse from device", e);
      }
    })();
  }, [payload]);

  if (!payload) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>Prediction result</Text>
          <Text style={styles.body}>No prediction available. Please submit data again.</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => navigation.navigate("PrePeg")}
              style={[styles.btn, styles.btnOrange]}
            >
              <Text style={styles.btnText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  // payload = { ok, id, created_at, record, prediction, prediction_file }
  const { prediction = null, record = null } = payload || {};
  const probabilities = (prediction && prediction.probabilities) || [];
  const risk = (prediction && prediction.risk) || [];

  // Map flag keys to human-friendly illness names
  const FLAG_MAP = {
    flag_0: "Miscarriage",
    flag_1: "Stillbirth",
    flag_2: "Obstructed labour",
    flag_3: "Placenta previa",
    flag_4: "Placental abruption",
    flag_5: "IUGR",
    flag_6: "Eclampsia",
    flag_7: "Postpartum depression",
    flag_8: "Infection",
    flag_9: "Excessive bleeding",
    flag_10: "Multiple pregnancy complication",
    flag_11: "Preterm labour",
    flag_12: "C-section complication",
    flag_13: "Anaemia",
    flag_14: "Short inter-pregnancy interval",
  };

  const overallRisk =
    risk.length ? Math.max(0, Number(Number(risk[0]).toFixed(3)) - 30.0) : "—";

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.header}>Prediction Result</Text>

        {record && (
          <Text style={styles.recordLine}>
            <Text style={styles.bold}>Record: </Text>
            {record.name ?? "—"} (ID: {record.id ?? "—"})
          </Text>
        )}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Overall Risk Score</Text>
          <Text style={styles.riskText}>
            {overallRisk === "—" ? "—" : String(overallRisk)}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Per-label Probabilities</Text>
          <View style={styles.grid}>
            {probabilities.length && probabilities[0] ? (
              Object.entries(probabilities[0])
                .filter(([k]) => !k.startsWith("_"))
                .map(([k, v]) => {
                  const label = FLAG_MAP[k] ?? k;
                  const pct = (Number(v) * 100).toFixed(1) + "%";
                  return (
                    <View key={k} style={styles.probCard}>
                      <Text style={styles.probLabel}>{label}</Text>
                      <Text style={styles.probValue}>{pct}</Text>
                    </View>
                  );
                })
            ) : (
              <Text style={styles.muted}>No probabilities available</Text>
            )}
          </View>
        </View>

        <View style={styles.footerActions}>
          <Pressable
            onPress={() => navigation.navigate("GeminiSummary")}
            style={[styles.btn, styles.btnBlue]}
          >
            <Text style={styles.btnText}>Get Report</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("PrePeg")}
            style={[styles.btn, styles.btnOutline]}
          >
            <Text style={styles.btnOutlineText}>Back</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  page: { padding: 16, backgroundColor: "#F3F4F6" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  body: { marginTop: 8, color: "#374151" },
  actions: { marginTop: 12, flexDirection: "row", gap: 8 },
  header: { fontSize: 22, fontWeight: "700", color: "#C2410C" },
  recordLine: { marginTop: 8, color: "#4B5563", fontSize: 13 },
  bold: { fontWeight: "700" },

  block: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginTop: 16 },
  blockTitle: { fontWeight: "600", color: "#111827" },
  riskText: { marginTop: 8, fontSize: 28, fontWeight: "800", color: "#DC2626" },

  grid: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  probCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    width: "48%",
  },
  probLabel: { color: "#374151", fontSize: 13 },
  probValue: { marginTop: 4, fontWeight: "700" },
  muted: { color: "#6B7280" },

  footerActions: { marginTop: 16, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnBlue: { backgroundColor: "#2563EB" },
  btnOrange: { backgroundColor: "#EA580C" },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutline: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff" },
  btnOutlineText: { color: "#111827", fontWeight: "700" },
});