import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function prettyDate(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
}

export default function PostDeliveryResult() {
  const route = useRoute();
  const navigation = useNavigation();

  // Prefer record from route params; fallback to AsyncStorage
  const routeRecord = route.params?.record || null;
  const [record, setRecord] = useState(routeRecord);

  useEffect(() => {
    if (routeRecord) return; // already have it
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("lastPostDeliveryRecord");
        if (raw) setRecord(JSON.parse(raw));
      } catch (err) {
        console.warn("Could not read lastPostDeliveryRecord:", err);
      }
    })();
  }, [routeRecord]);

  const goSubmitNew = () => navigation.navigate("PostDel");
  const goHome = () => navigation.navigate("Home");
  const dismissAndClear = async () => {
    try {
      await AsyncStorage.removeItem("lastPostDeliveryRecord");
    } catch {
      // ignore
    }
    navigation.navigate("Home");
  };

  if (!record) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.cardCenter}>
          <Text style={styles.title}>No record available</Text>
          <Text style={styles.muted}>
            It seems we don't have a recently submitted record to show.
          </Text>
          <View style={styles.row}>
            <Pressable onPress={goSubmitNew} style={[styles.btn, styles.btnOrange]}>
              <Text style={styles.btnText}>Submit new</Text>
            </Pressable>
            <Pressable onPress={goHome} style={[styles.btn, styles.btnOutline]}>
              <Text style={styles.btnOutlineText}>Go home</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.header}>Submission successful</Text>
        <Text style={styles.subheader}>
          The information below was recorded successfully.
        </Text>

        <View style={styles.list}>
          <View style={styles.item}>
            <Text style={styles.term}>Mother's name</Text>
            <Text style={styles.def}>{record.mother_name || "-"}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Delivery date</Text>
            <Text style={styles.def}>
              {record.delivery_date
                ? (record.delivery_date.slice?.(0, 10) || record.delivery_date)
                : "-"}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Complications</Text>
            <Text style={styles.def}>{record.complications || "None"}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Child weight (kg)</Text>
            <Text style={styles.def}>
              {record.child_weight_kg ?? record.child_weight ?? "-"}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Child diseases</Text>
            <Text style={styles.def}>
              {record.child_diseases ? String(record.child_diseases) : "-"}
            </Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Notes</Text>
            <Text style={styles.def}>{record.notes || "-"}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Submitted at</Text>
            <Text style={styles.def}>{prettyDate(record.submitted_at || record.created_at)}</Text>
          </View>

          <View style={styles.item}>
            <Text style={styles.term}>Record ID</Text>
            <Text style={styles.def}>{record.id ?? "-"}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={goSubmitNew} style={[styles.btn, styles.btnOrange]}>
            <Text style={styles.btnText}>Submit another</Text>
          </Pressable>
          <Pressable onPress={goHome} style={[styles.btn, styles.btnOutline]}>
            <Text style={styles.btnOutlineText}>Go home</Text>
          </Pressable>
          <Pressable onPress={dismissAndClear} style={[styles.btn, styles.btnSmallBorder]}>
            <Text style={styles.btnSmallText}>Dismiss & clear</Text>
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
  cardCenter: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  muted: { color: "#6B7280", textAlign: "center" },
  row: { flexDirection: "row", gap: 10, marginTop: 6 },

  header: { fontSize: 22, fontWeight: "700", color: "#C2410C", marginBottom: 6 },
  subheader: { color: "#6B7280", marginBottom: 14 },

  list: { gap: 10 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  term: { fontSize: 13, color: "#4B5563", fontWeight: "600" },
  def: { fontSize: 15, color: "#111827", fontWeight: "500" },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOrange: { backgroundColor: "#EA580C" },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutline: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff" },
  btnOutlineText: { color: "#111827", fontWeight: "700" },
  btnSmallBorder: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  btnSmallText: { color: "#111827", fontWeight: "600", fontSize: 12 },
});