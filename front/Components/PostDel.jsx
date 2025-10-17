// Components/PostDel.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBase } from "../lib/apiBase";
import { AuthContext } from "../App";

const API_BASE = getApiBase();

// helper to format Date -> "YYYY-MM-DD"
const toYMD = (d) => {
  if (!d || Number.isNaN(+d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function PostDel() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // Optional: if somehow mounted while logged-out, bounce to SignIn
  useEffect(() => {
    if (!user) navigation.replace("SignIn");
  }, [user, navigation]);

  const [formData, setFormData] = useState({
    mother_name: "",
    delivery_date: "", // "YYYY-MM-DD"
    complications: "",
    child_weight: "",
    child_diseases: [],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryDateObj, setDeliveryDateObj] = useState(null);

  const handleChange = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    const cleaned = String(value).replace(/[^0-9.]/g, "");
    setFormData((p) => ({ ...p, [name]: cleaned }));
  };

  const validate = () => {
    const errors = [];
    if (!formData.mother_name.trim()) errors.push("Mother's name");
    if (!formData.delivery_date) errors.push("Delivery date");
    if (!formData.child_weight || Number(formData.child_weight) <= 0) {
      errors.push("Child weight (positive)");
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (errors.length) {
      Alert.alert("Missing fields", "Please complete: " + errors.join(", "));
      return;
    }

    const payload = {
      mother_name: formData.mother_name.trim(),
      delivery_date: formData.delivery_date, // already "YYYY-MM-DD"
      complications: formData.complications.trim() || null,
      child_weight_kg: parseFloat(formData.child_weight),
      child_diseases:
        Array.isArray(formData.child_diseases) && formData.child_diseases.length
          ? formData.child_diseases.map((s) => String(s).trim()).filter(Boolean)
          : null,
      notes: formData.notes.trim() || null,
      submitted_at: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      const token = (await AsyncStorage.getItem("token")) || "";

      if (!token) {
        setSubmitting(false);
        Alert.alert("Session expired", "Please sign in again.");
        navigation.replace("SignIn");
        return;
      }

      const res = await fetch(`${API_BASE}/post-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {}

      setSubmitting(false);

      if (!res.ok) {
        Alert.alert(
          "Submit failed",
          data.error || data.detail || `HTTP ${res.status}`
        );
        return;
      }

      const record = data.record || null;

      try {
        if (record) {
          await AsyncStorage.setItem(
            "lastPostDeliveryRecord",
            JSON.stringify(record)
          );
        }
      } catch (err) {
        console.warn("Could not save record locally", err);
      }

      navigation.navigate("PostDeliveryResult", { record });
    } catch (err) {
      setSubmitting(false);
      console.error("Submission error:", err);
      Alert.alert("Server error", "Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      mother_name: "",
      delivery_date: "",
      complications: "",
      child_weight: "",
      child_diseases: [],
      notes: "",
    });
    setDeliveryDateObj(null);
  };

  // If user not set yet, show gentle message
  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Text style={styles.body}>
            Please sign in to submit post-delivery data.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Post-Delivery Data Collection</Text>
          <Text style={styles.headerSubtitle}>
            Please fill in the details below carefully.
          </Text>
        </View>

        {/* Mother's Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Mother's Name</Text>
          <TextInput
            value={formData.mother_name}
            onChangeText={(t) => handleChange("mother_name", t)}
            placeholder="Enter mother's full name"
            style={styles.input}
          />
        </View>

        {/* Date of Delivery (Date Picker) */}
        <View style={styles.field}>
          <Text style={styles.label}>Date of Delivery</Text>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, styles.datePressable]}
          >
            <Text style={formData.delivery_date ? styles.dateText : styles.datePlaceholder}>
              {formData.delivery_date || "Select date"}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              display={Platform.select({ ios: "inline", android: "default" })}
              value={deliveryDateObj || new Date()}
              maximumDate={new Date()} // delivery date can’t be in future (tweak if needed)
              onChange={(event, selected) => {
                if (Platform.OS === "android") {
                  setShowDatePicker(false); // Android closes on select/dismiss
                }
                if (selected) {
                  setDeliveryDateObj(selected);
                  const ymd = toYMD(selected);
                  handleChange("delivery_date", ymd);
                } else if (Platform.OS === "ios" && event.type === "dismissed") {
                  // iOS inline has no dismiss event; for modal styles you might handle it
                }
              }}
            />
          )}
        </View>

        {/* Complications */}
        <View style={styles.field}>
          <Text style={styles.label}>Any complications during delivery</Text>
          <TextInput
            value={formData.complications}
            onChangeText={(t) => handleChange("complications", t)}
            placeholder="Describe complications (leave blank if none)"
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Child Weight */}
        <View style={styles.field}>
          <Text style={styles.label}>Child weight at birth (kg)</Text>
          <TextInput
            value={formData.child_weight}
            onChangeText={(t) => handleNumberChange("child_weight", t)}
            placeholder="e.g., 3.2"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        {/* Child Diseases (comma-separated) */}
        <View style={styles.field}>
          <Text style={styles.label}>Any known diseases in child</Text>
          <TextInput
            value={
              Array.isArray(formData.child_diseases)
                ? formData.child_diseases.join(",")
                : String(formData.child_diseases || "")
            }
            onChangeText={(t) =>
              setFormData((p) => ({ ...p, child_diseases: t.split(",") }))
            }
            placeholder="e.g., Jaundice, Heart condition"
            style={styles.input}
          />
          <Text style={styles.hint}>
            Enter multiple diseases separated by commas
          </Text>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Additional notes</Text>
          <TextInput
            value={formData.notes}
            onChangeText={(t) => handleChange("notes", t)}
            placeholder="Optional"
            style={styles.input}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitBtn,
              submitting ? styles.submitDisabled : styles.submitEnabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </Pressable>

          <Pressable onPress={resetForm} disabled={submitting} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
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
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFE4D6",
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#C2410C",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(194,65,12,0.75)",
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  // Pressable "input" for the date
  datePressable: {
    justifyContent: "center",
    minHeight: 44,
  },
  dateText: { color: "#111827", fontSize: 14 },
  datePlaceholder: { color: "#9CA3AF", fontSize: 14 },

  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitEnabled: {
    backgroundColor: "#EA580C",
  },
  submitDisabled: {
    backgroundColor: "#D1D5DB",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    color: "#111827",
    fontWeight: "600",
  },
  body: {
    fontSize: 14,
    color: "#374151",
  },
});