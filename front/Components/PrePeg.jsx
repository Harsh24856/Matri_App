import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBase } from "../lib/apiBase";
const API_BASE = getApiBase();
const API_URL = `${API_BASE}/maternal-health`;

/* -------------------- MultiSelectDropdown (RN) -------------------- */
function MultiSelectDropdown({ options, value = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false);

  const toggleOption = (opt) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else {
      if (opt === "None") onChange(["None"]);
      else onChange([...value.filter((v) => v !== "None"), opt]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <View>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        {value.length === 0 ? (
          <Text style={styles.placeholder}>{placeholder}</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {value.map((v) => (
              <View key={v} style={styles.chip}>
                <Text style={styles.chipText}>{v}</Text>
              </View>
            ))}
          </View>
        )}
        {value.length > 0 && (
          <Pressable onPress={clearAll} hitSlop={8} style={{ position: "absolute", right: 12 }}>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>Clear</Text>
          </Pressable>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPressOut={() => setOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select options</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {options.map((opt) => {
                const checked = value.includes(opt);
                return (
                  <Pressable
                    key={opt}
                    onPress={() => toggleOption(opt)}
                    style={styles.optionRow}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.btnSecondary} onPress={clearAll}>
                <Text style={styles.btnSecondaryText}>Clear</Text>
              </Pressable>
              <Pressable style={styles.btnPrimary} onPress={() => setOpen(false)}>
                <Text style={styles.btnPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* -------------------- SingleSelect (RN) -------------------- */
function SingleSelect({ options, value, onChange, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        {value ? (
          <Text style={styles.inputText}>{value}</Text>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPressOut={() => setOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{placeholder}</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={styles.optionRow}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      value === opt && { borderColor: "#EA580C" },
                    ]}
                  >
                    {value === opt && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.btnSecondary} onPress={() => setOpen(false)}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* -------------------- Main PrePeg screen (RN) -------------------- */
export default function PrePeg() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    past_pregnancy_count: "",
    blood_group_mother: "",
    blood_group_father: "",
    medical_bg_mother: [],
    medical_bg_father: [],
    years_since_last_pregnancy: "",
    delivery_type: "",
    haemoglobin: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const medicalOptions = [
    "None",
    "Diabetes",
    "Hypertension",
    "Thyroid Disorder",
    "Anaemia",
    "Heart Disease",
    "Kidney Disease",
    "Epilepsy",
    "Asthma / Respiratory Illness",
    "Genetic Disorder",
    "Mental Health Condition",
    "Other Chronic Illness",
  ];

  const handleChange = (name, value) => setFormData((p) => ({ ...p, [name]: value }));

  const handleNumberChange = (name, raw) => {
    if (name === "haemoglobin") {
      const cleaned = String(raw).replace(/[^0-9.]/g, "");
      setFormData((p) => ({ ...p, [name]: cleaned }));
      return;
    }
    const cleaned = String(raw).replace(/\D/g, "");
    setFormData((p) => ({ ...p, [name]: cleaned }));
  };

  const setMulti = (name, arr) => {
    const cleaned = arr.includes("None") && arr.length > 1 ? arr.filter((a) => a !== "None") : arr;
    setFormData((p) => ({ ...p, [name]: cleaned }));
  };

  const validate = () => {
    const required = Object.keys(formData);
    const missing = required.filter((k) => {
      const v = formData[k];
      if (Array.isArray(v)) return v.length === 0;
      return !String(v || "").trim();
    });
    return missing;
  };

  const handleSubmit = async () => {
    const missing = validate();
    if (missing.length) {
      Alert.alert("Missing fields", `Please complete: ${missing.join(", ")}`);
      return;
    }

    const payload = {
      ...formData,
      age: Number(formData.age),
      past_pregnancy_count: Number(formData.past_pregnancy_count),
      years_since_last_pregnancy: Number(formData.years_since_last_pregnancy),
      haemoglobin: parseFloat(formData.haemoglobin),
      medical_bg_mother: formData.medical_bg_mother.join(","),
      medical_bg_father: formData.medical_bg_father.join(","),
    };

    try {
      setSubmitting(true);
      const token = (await AsyncStorage.getItem("token")) || "";

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resp = await res.json(); // ✅ consistent variable

      if (!res.ok) {
        setSubmitting(false);
        Alert.alert("Failed to submit", resp.error || "Unknown error");
        return;
      }

      // Save full prediction response locally
      try {
        await AsyncStorage.setItem("lastPredictionResponse", JSON.stringify(resp));
      } catch (err) {
        console.warn("Could not save prediction response to device", err);
      }

      setSubmitting(false);

      // ✅ Navigate & pass payload forward
      navigation.navigate("PrePegOp", { payload: resp });
    } catch (err) {
      setSubmitting(false);
      console.error("Error submitting form:", err);
      Alert.alert("Server error", "Please try again.");
    }
  };

  const resetForm = () =>
    setFormData({
      name: "",
      age: "",
      past_pregnancy_count: "",
      blood_group_mother: "",
      blood_group_father: "",
      medical_bg_mother: [],
      medical_bg_father: [],
      years_since_last_pregnancy: "",
      delivery_type: "",
      haemoglobin: "",
    });

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pre-Delivery Data Collection</Text>
          <Text style={styles.headerSubtitle}>Please fill in the details below carefully.</Text>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(t) => handleChange("name", t)}
            style={styles.input}
            placeholder="Enter mother's full name"
          />
        </View>

        {/* Age */}
        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            value={formData.age}
            onChangeText={(t) => handleNumberChange("age", t)}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g., 28"
          />
        </View>

        {/* Past Pregnancy Count */}
        <View style={styles.field}>
          <Text style={styles.label}>Past Pregnancy Count</Text>
          <TextInput
            value={formData.past_pregnancy_count}
            onChangeText={(t) => handleNumberChange("past_pregnancy_count", t)}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g., 1"
          />
        </View>

        {/* Blood Group (Mother) */}
        <View style={styles.field}>
          <Text style={styles.label}>Blood Group (Mother)</Text>
          <SingleSelect
            options={bloodGroups}
            value={formData.blood_group_mother}
            onChange={(val) => handleChange("blood_group_mother", val)}
            placeholder="Select"
          />
        </View>

        {/* Blood Group (Father) */}
        <View style={styles.field}>
          <Text style={styles.label}>Blood Group (Father)</Text>
          <SingleSelect
            options={bloodGroups}
            value={formData.blood_group_father}
            onChange={(val) => handleChange("blood_group_father", val)}
            placeholder="Select"
          />
        </View>

        {/* Medical Background (Mother) */}
        <View style={styles.field}>
          <Text style={styles.label}>Medical Background (Mother)</Text>
          <MultiSelectDropdown
            options={medicalOptions}
            value={formData.medical_bg_mother}
            onChange={(arr) => setMulti("medical_bg_mother", arr)}
            placeholder="Select medical conditions"
          />
        </View>

        {/* Medical Background (Father) */}
        <View style={styles.field}>
          <Text style={styles.label}>Medical Background (Father)</Text>
          <MultiSelectDropdown
            options={medicalOptions}
            value={formData.medical_bg_father}
            onChange={(arr) => setMulti("medical_bg_father", arr)}
            placeholder="Select medical conditions"
          />
        </View>

        {/* Years Since Last Pregnancy */}
        <View style={styles.field}>
          <Text style={styles.label}>Years Since Last Pregnancy</Text>
          <TextInput
            value={formData.years_since_last_pregnancy}
            onChangeText={(t) => handleNumberChange("years_since_last_pregnancy", t)}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g., 2"
          />
        </View>

        {/* Delivery Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Delivery Type</Text>
          <SingleSelect
            options={["Normal", "C-Section", "Other"]}
            value={formData.delivery_type}
            onChange={(val) => handleChange("delivery_type", val)}
            placeholder="Select Type"
          />
        </View>

        {/* Haemoglobin */}
        <View style={styles.field}>
          <Text style={styles.label}>Haemoglobin (g/dL)</Text>
          <TextInput
            value={formData.haemoglobin}
            onChangeText={(t) => handleNumberChange("haemoglobin", t)}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="e.g., 12.0"
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, submitting ? styles.submitDisabled : styles.submitEnabled]}
          >
            <Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit Data"}</Text>
          </Pressable>

          <Pressable onPress={resetForm} disabled={submitting} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  page: { padding: 16, backgroundColor: "#FFFFFF" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE4D6",
    overflow: "hidden",
    padding: 16,
  },
  header: {
    backgroundColor: "#FFE4E4",
    borderWidth: 1,
    borderColor: "#FFD8BF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#C2410C" },
  headerSubtitle: { marginTop: 4, fontSize: 12, color: "rgba(194,65,12,0.75)" },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  inputText: { color: "#111827", fontSize: 14 },
  placeholder: { color: "#9CA3AF", fontSize: 14 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },

  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitEnabled: { backgroundColor: "#EA580C" },
  submitDisabled: { backgroundColor: "#D1D5DB" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: { color: "#111827", fontWeight: "600" },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  modalTitle: { fontWeight: "700", fontSize: 16, marginBottom: 8, color: "#111827" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  optionText: { color: "#111827", fontSize: 14 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, paddingTop: 10 },

  btnPrimary: { backgroundColor: "#EA580C", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnSecondary: { backgroundColor: "#F3F4F6", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnSecondaryText: { color: "#111827", fontWeight: "700" },

  // chips
  chip: {
    backgroundColor: "#FFF7ED",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  chipText: { color: "#C2410C", fontSize: 12, fontWeight: "600" },

  // checkbox
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  checkboxTick: { color: "#fff", fontSize: 12, fontWeight: "800" },

  // radio
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EA580C" },
});