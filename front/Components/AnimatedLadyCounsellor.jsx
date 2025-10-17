import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import * as Speech from "expo-speech";
import * as SpeechRecognition from "expo-speech-recognition";

const QUESTIONS = [
  { key: "mother_name", en: "What is the mother's full name?" },
  { key: "delivery_date", en: "Please say the delivery date (year-month-day)." },
  { key: "complications", en: "Were there any complications during delivery?" },
  { key: "child_weight", en: "What was the baby's birth weight in kilograms?" },
  { key: "child_diseases", en: "Does the baby have any known illness?" },
  { key: "notes", en: "Any extra notes about the delivery or baby?" },
];

export default function AnimatedLadyCounsellor() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Ready");

  const speak = (text) => Speech.speak(text, { language: "en-IN", rate: 0.95 });

  async function askQuestion() {
    const q = QUESTIONS[index];
    if (!q) return;
    speak(q.en);
    setStatus("Speaking…");
  }

  async function startListening() {
    const available = await SpeechRecognition.requestPermissionsAsync();
    if (!available.granted) return setStatus("Mic permission denied");
    setListening(true);
    setStatus("Listening…");
    try {
      const result = await SpeechRecognition.startAsync({ language: "en-IN" });
      recordAnswer(result.text);
    } catch (e) {
      setStatus("Recognition failed");
    } finally {
      setListening(false);
    }
  }

  function recordAnswer(text) {
    const q = QUESTIONS[index];
    if (!q) return;
    const next = index + 1;
    setAnswers((p) => ({ ...p, [q.key]: text }));
    speak("Got it, thank you.");
    if (next < QUESTIONS.length) setIndex(next);
    else setStatus("All done!");
  }

  function submitTyped() {
    if (!input.trim()) return;
    recordAnswer(input.trim());
    setInput("");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Asha — Your Counsellor</Text>
      <Text style={styles.subtitle}>{status}</Text>

      <View style={styles.box}>
        <Text style={styles.question}>
          {QUESTIONS[index]?.en || "All questions completed."}
        </Text>

        <View style={styles.row}>
          <Pressable style={styles.button} onPress={askQuestion}>
            <Text style={styles.buttonText}>Speak</Text>
          </Pressable>
          <Pressable
            style={[styles.button, listening && styles.active]}
            onPress={startListening}
          >
            <Text style={styles.buttonText}>
              {listening ? "Stop" : "Mic"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer"
            style={styles.input}
          />
          <Pressable style={styles.button} onPress={submitTyped}>
            <Text style={styles.buttonText}>Send</Text>
          </Pressable>
        </View>
      </View>

      {Object.entries(answers).map(([key, val]) => (
        <View key={key} style={styles.answerBox}>
          <Text style={styles.answerKey}>{key}</Text>
          <Text style={styles.answerText}>{val}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#4F46E5" },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  box: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 16 },
  question: { fontSize: 18, color: "#111827", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  button: {
    backgroundColor: "#6366F1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  active: { backgroundColor: "#DC2626" },
  buttonText: { color: "#fff", fontWeight: "600" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  answerBox: {
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
  },
  answerKey: { fontWeight: "700", color: "#374151" },
  answerText: { color: "#111827" },
});