// Components/Role.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  findNodeHandle,
  UIManager,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Role() {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollRef = useRef(null);
  const assessmentRef = useRef(null);

  const { width, height } = useWindowDimensions();

  // Breakpoints (iPhone-friendly)
  const isCompact = width <= 375;
  const isRegular = width > 375 && width < 428;
  const isPlus = width >= 428;

  // Scales
  const pad = isCompact ? 14 : isRegular ? 16 : 18;
  const gap = isCompact ? 10 : 12;
  const titleSize = isCompact ? 24 : isRegular ? 26 : 28;
  const subtitleSize = isCompact ? 14 : 15;
  const cardTallH = Math.min(300, Math.max(220, height * 0.28));
  const optionBasis = isPlus ? "31.5%" : isRegular ? "48%" : "100%";

  // Smooth scroll to section
  useEffect(() => {
    const scrollTo = route.params?.scrollTo;
    if (scrollTo === "assessment-section" && assessmentRef.current && scrollRef.current) {
      setTimeout(() => {
        const handle = findNodeHandle(assessmentRef.current);
        if (!handle) return;
        UIManager.measureLayout(
          handle,
          findNodeHandle(scrollRef.current),
          () => {},
          (x, y) => {
            scrollRef.current.scrollTo({ y, animated: true });
          }
        );
      }, 0);
    }
  }, [route.params]);

  return (
    // NOTE: exclude "top" so the Navbar controls top safe area and we avoid double spacing
    <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.page,
          { paddingHorizontal: pad, paddingBottom: pad, gap },
        ]}
      >
        {/* Header */}
        <View style={[styles.headerWrap, { gap: 6, marginTop: 0, marginBottom: 2 }]}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Choose Your Journey</Text>
          <Text
            style={[
              styles.subtitle,
              { fontSize: subtitleSize, maxWidth: isPlus ? 720 : 680, paddingHorizontal: isCompact ? 2 : 0 },
            ]}
          >
            Select the appropriate form based on your current stage in the maternal health journey
          </Text>
        </View>

        {/* Assessment cards */}
        <View ref={assessmentRef} collapsable={false} style={[styles.assessmentGrid, { gap }]}>
          {/* Pre-Delivery Card */}
          <Pressable
            onPress={() => navigation.navigate("PrePeg")}
            style={({ pressed }) => [
              styles.cardTall,
              {
                height: cardTallH,
                borderRadius: 20,
                ...(pressed && { transform: [{ translateY: -1 }], opacity: 0.99 }),
              },
            ]}
          >
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBg}
            />
            <View style={[styles.cardInner, { padding: pad }]} accessible accessibilityRole="button">
              <View>
                <View style={styles.iconWrap}>
                  <Text style={styles.iconText}>✅</Text>
                </View>
                <Text style={[styles.cardTitle, { fontSize: isCompact ? 20 : 22 }]}>Pre-Delivery</Text>
                <Text style={[styles.cardBody, { fontSize: isCompact ? 13.5 : 14 }]}>
                  Record pre-pregnancy health data to assess potential risks and provide preventive
                  guidance for a healthy pregnancy journey.
                </Text>
              </View>
              <View style={[styles.primaryBtn, { paddingVertical: isCompact ? 10 : 12 }]}>
                <Text style={[styles.primaryBtnText, { fontSize: isCompact ? 13.5 : 14 }]}>
                  Start Pre-Delivery Assessment
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Post-Delivery Card */}
          <Pressable
            onPress={() => navigation.navigate("PostDel")}
            style={({ pressed }) => [
              styles.cardTall,
              {
                height: cardTallH,
                borderRadius: 20,
                ...(pressed && { transform: [{ translateY: -1 }], opacity: 0.99 }),
              },
            ]}
          >
            <LinearGradient
              colors={["#fb923c", "#f97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBg}
            />
            <View style={[styles.cardInner, { padding: pad }]} accessible accessibilityRole="button">
              <View>
                <View style={[styles.iconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Text style={styles.iconText}>❤️</Text>
                </View>
                <Text style={[styles.cardTitle, { fontSize: isCompact ? 20 : 22 }]}>Post-Delivery</Text>
                <Text style={[styles.cardBody, { fontSize: isCompact ? 13.5 : 14 }]}>
                  Record post-pregnancy outcomes to identify risks and provide targeted support for
                  optimal recovery and care.
                </Text>
              </View>
              <View style={[styles.primaryBtn, { backgroundColor: "#fff", paddingVertical: isCompact ? 10 : 12 }]}>
                <Text style={[styles.primaryBtnText, { color: "#ea580c", fontSize: isCompact ? 13.5 : 14 }]}>
                  Start Post-Delivery Assessment
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Options */}
        <View style={[styles.optionsGrid, { gap }]}>
          <Pressable
            onPress={() => navigation.navigate("FieldGuide")}
            style={({ pressed }) => [
              styles.optionCard,
              { flexBasis: optionBasis, padding: pad, borderRadius: 14 },
              pressed && styles.optionPressed,
            ]}
          >
            <View style={[styles.smallIcon, { backgroundColor: "#dcfce7" }]}>
              <Text style={styles.smallIconText}>📘</Text>
            </View>
            <Text style={[styles.optionTitle, { fontSize: isCompact ? 14.5 : 15 }]}>Field Guide</Text>
            <Text style={[styles.optionBody, { fontSize: isCompact ? 12 : 12.5 }]}>
              Access comprehensive maternal health resources and guidelines
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Feed")}
            style={({ pressed }) => [
              styles.optionCard,
              { flexBasis: optionBasis, padding: pad, borderRadius: 14 },
              pressed && styles.optionPressed,
            ]}
          >
            <View style={[styles.smallIcon, { backgroundColor: "#ffedd5" }]}>
              <Text style={styles.smallIconText}>📰</Text>
            </View>
            <Text style={[styles.optionTitle, { fontSize: isCompact ? 14.5 : 15 }]}>Health Feed</Text>
            <Text style={[styles.optionBody, { fontSize: isCompact ? 12 : 12.5 }]}>
              Stay updated with latest maternal health news and tips
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("SupervisorDashboard")}
            style={({ pressed }) => [
              styles.optionCard,
              { flexBasis: optionBasis, padding: pad, borderRadius: 14 },
              pressed && styles.optionPressed,
            ]}
          >
            <LinearGradient
              colors={["#dcfce7", "#ffedd5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.smallIcon, { justifyContent: "center", alignItems: "center" }]}
            >
              <Text style={styles.smallIconText}>🧭</Text>
            </LinearGradient>
            <Text style={[styles.optionTitle, { fontSize: isCompact ? 14.5 : 15 }]}>Supervisor Dashboard</Text>
            <Text style={[styles.optionBody, { fontSize: isCompact ? 12 : 12.5 }]}>
              Monitor and manage maternal health data and reports
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <LinearGradient
          colors={["#111827", "#0f172a", "#111827"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.footer, { borderRadius: 18, padding: pad, gap: 10, marginTop: gap }]}
        >
          <View style={styles.brandRow}>
            <Text style={styles.brandLogo}>👩‍⚕️</Text>
            <Text style={[styles.brandText, { fontSize: isCompact ? 18 : 20 }]}>मातृCare</Text>
          </View>

          <Text style={[styles.footerPara, { fontSize: isCompact ? 12 : 12.5 }]}>
            Empowering mothers and families with accessible digital tools to record, track, and
            analyze pregnancy and post-delivery health outcomes. Your health, our priority.
          </Text>

          <View style={[styles.quickLinks, { gap: isCompact ? 10 : 14 }]}>
            <Pressable onPress={() => navigation.navigate("PrePeg")}><Text style={styles.linkText}>Pre-Delivery Form</Text></Pressable>
            <Pressable onPress={() => navigation.navigate("PostDel")}><Text style={styles.linkText}>Post-Delivery Form</Text></Pressable>
            <Pressable onPress={() => navigation.navigate("FieldGuide")}><Text style={styles.linkText}>Field Guide</Text></Pressable>
            <Pressable onPress={() => navigation.navigate("Feed")}><Text style={styles.linkText}>Health Feed</Text></Pressable>
          </View>

          <Text style={[styles.copy, { fontSize: 12 }]}>
            © {new Date().getFullYear()} मातृCare. All rights reserved.
          </Text>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc" },

  // Header
  headerWrap: { alignItems: "center" },
  title: { fontWeight: "800", color: "#111827", textAlign: "center", letterSpacing: 0.3 },
  subtitle: { color: "#4B5563", textAlign: "center", lineHeight: 20 },

  // Assessment Grid
  assessmentGrid: { flexDirection: "column" },
  cardTall: {
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
    marginBottom: 6, // tighter spacing between tall cards
  },
  cardBg: { ...StyleSheet.absoluteFillObject, opacity: 0.92 },
  cardInner: { flex: 1, justifyContent: "space-between" },
  iconWrap: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  iconText: { fontSize: 28, color: "#fff" },
  cardTitle: { fontWeight: "800", color: "#fff", marginBottom: 8, letterSpacing: 0.3 },
  cardBody: { color: "rgba(255,255,255,0.95)", lineHeight: 20 },

  primaryBtn: {
    backgroundColor: "#fff", borderRadius: 14, alignItems: "center", paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1.5,
      },
      android: { elevation: 1 },
    }),
  },
  primaryBtnText: { color: "#16a34a", fontWeight: "700", letterSpacing: 0.2 },

  // Options
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  optionCard: {
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  optionPressed: { transform: [{ translateY: -1 }], opacity: 0.97 },
  smallIcon: { width: 46, height: 46, borderRadius: 12, marginBottom: 10, alignItems: "center", justifyContent: "center" },
  smallIconText: { fontSize: 22 },
  optionTitle: { fontWeight: "700", color: "#111827", marginBottom: 6 },
  optionBody: { color: "#4B5563", lineHeight: 18 },

  // Footer
  footer: { paddingVertical: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  brandLogo: { fontSize: 24 },
  brandText: { fontWeight: "800", color: "#86efac", letterSpacing: 0.3 },
  footerPara: { color: "#cbd5e1", lineHeight: 20 },
  quickLinks: { flexDirection: "row", flexWrap: "wrap" },
  linkText: { color: "#86efac", fontWeight: "700", padding: 4, letterSpacing: 0.2 },
  copy: { color: "#94a3b8", textAlign: "center", marginTop: 6, letterSpacing: 0.2 },
});