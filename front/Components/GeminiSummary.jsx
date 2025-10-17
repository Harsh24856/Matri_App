import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Constants from "expo-constants";

// Map flag keys to illness names
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

export default function Report() {
  const [payload, setPayload] = useState(null);
  const [report, setReport] = useState("Loading report...");
  const [loading, setLoading] = useState(true);

  // --- helpers ---
  const cleanText = useCallback((text) => {
    return String(text || "")
      .replace(/\*\*/g, "")
      .replace(/---/g, "")
      .replace(/#+/g, "")
      .trim();
  }, []);

  // Load last prediction from device (AsyncStorage)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("lastPredictionResponse");
        if (stored) setPayload(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed reading lastPredictionResponse", e);
      }
    })();
  }, []);

  // Fetch AI report from OpenAI (REST)
  useEffect(() => {
    (async () => {
      if (!payload?.prediction?.probabilities?.length) {
        setLoading(false);
        return;
      }

      const probs = payload.prediction.probabilities[0];
      const lines = Object.entries(probs)
        .filter(([k]) => !k.startsWith("_"))
        .map(([k, v]) => `${FLAG_MAP[k] ?? k}: ${(Number(v) * 100).toFixed(1)}%`)
        .join("\n");

      const prompt = `
You are a medical assistant helping doctors interpret pregnancy complication risk predictions.

Here are the predicted probabilities for different conditions (as percentages):

${lines}

Don't include the percentages in the final text and avoid alarming language.
Generate a structured pregnancy care summary with sections:

- Suggested Next Steps
- Visit Frequency
- Dietary Suggestions
- Positive Encouragement

IMPORTANT: Return plain text only — no markdown, no headings syntax, no bullets if possible.
      `.trim();

      try {
        setLoading(true);
        const apiKey = Constants.expoConfig?.extra?.openaiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

        if (!apiKey) {
          setReport("OpenAI key missing. Add EXPO_PUBLIC_OPENAI_API_KEY or expoConfig.extra.openaiKey.");
          setLoading(false);
          return;
        }

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!resp.ok) {
          const errTxt = await resp.text();
          console.error("OpenAI error:", errTxt);
          setReport("⚠️ Failed to fetch report. Please try again later.");
          setLoading(false);
          return;
        }

        const json = await resp.json();
        const text = json?.choices?.[0]?.message?.content || "No content returned.";
        setReport(text);
      } catch (e) {
        console.error("OpenAI API error:", e);
        setReport("⚠️ Failed to fetch report. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, [payload]);

  // Generate & share a PDF using expo-print + expo-sharing
  const downloadPDF = useCallback(async () => {
    try {
      const safeText = cleanText(report).replace(/\n/g, "<br/>");
      const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 12px; color: #1d4ed8; }
            .section { margin-bottom: 8px; line-height: 1.5; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Pregnancy Risk Report</h1>
          <div class="section">${safeText}</div>
        </body>
      </html>`.trim();

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Report" });
      } else {
        Alert.alert("Saved", `PDF created at:\n${uri}`);
      }
    } catch (e) {
      console.error("PDF error:", e);
      Alert.alert("Error", "Could not create PDF.");
    }
  }, [report, cleanText]);

  // --- UI ---
  if (!payload) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>Report</Text>
          <Text style={styles.body}>No report available. Please submit data again.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.header}>Pregnancy Risk Report</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" />
            <Text style={styles.muted}>Generating report…</Text>
          </View>
        ) : (
          <Text style={styles.body}>{cleanText(report)}</Text>
        )}

        <Pressable onPress={downloadPDF} style={styles.button}>
          <Text style={styles.buttonText}>Download Report</Text>
        </Pressable>
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
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  body: {
    marginTop: 12,
    color: "#374151",
    lineHeight: 20,
    fontSize: 14,
    whiteSpace: "pre-wrap", // RN ignores this; we rely on \n in Text
  },
  loadingWrap: {
    marginTop: 12,
    gap: 8,
  },
  muted: {
    marginTop: 8,
    color: "#6B7280",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});