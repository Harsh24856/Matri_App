import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Content() {
  const { width } = useWindowDimensions();

  // iPhone 16 family–tuned breakpoints
  const isCompact = width <= 392;            // very narrow
  const isRegular = width > 392 && width < 430; // 16 / 16 Pro
  const isPlus = width >= 430;               // 16 Plus / Pro Max

  // Scales
  const padX = isCompact ? 16 : isRegular ? 20 : 22;
  const padY = isCompact ? 22 : isRegular ? 28 : 32;

  const heroTitleSize = isCompact ? 30 : isRegular ? 34 : 36;
  const heroLineHeight = heroTitleSize + 8;
  const heroSubSize = isCompact ? 14 : 16;

  const sectionTitleSize = isCompact ? 24 : isRegular ? 26 : 28;
  const sectionSubSize = isCompact ? 14 : 16;

  // Feature cards layout (2-up on regular/plus, full-width on compact)
  const cardBasis = isPlus || isRegular ? "48%" : "100%";

  // Stats grid: 2-up on compact/regular, 4-up on plus (pro max)
  const statBasis = isPlus ? "23.5%" : "47%";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={[styles.page]}>
        {/* Hero */}
        <View style={[styles.heroWrap, { paddingHorizontal: padX, paddingTop: padY, paddingBottom: padY - 4 }]}>
          <View style={styles.heroInner}>
            <Text style={[styles.heroTitle, { fontSize: heroTitleSize, lineHeight: heroLineHeight }]}>
              Empowering{"\n"}
              <Text style={styles.heroGradientWord}>Maternal Health</Text>
            </Text>

            <Text style={[styles.heroSub, { fontSize: heroSubSize }]}>
              Your comprehensive digital companion for pregnancy tracking, risk
              assessment, and post-delivery care with AI-powered insights.
            </Text>

            <View style={styles.ctaRow}>
              <Pressable style={[styles.primaryBtn, { paddingVertical: isCompact ? 10 : 12, paddingHorizontal: isCompact ? 18 : 20 }]}>
                <Text style={[styles.primaryBtnText, { fontSize: isCompact ? 15 : 16 }]}>Get Started</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, { paddingVertical: isCompact ? 10 : 12, paddingHorizontal: isCompact ? 18 : 20 }]}>
                <Text style={[styles.secondaryBtnText, { fontSize: isCompact ? 15 : 16 }]}>Learn More</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={[styles.featuresSection, { paddingHorizontal: padX, paddingVertical: padY }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Why Choose मातृCare?</Text>
            <Text style={[styles.sectionSub, { fontSize: sectionSubSize }]}>
              Comprehensive maternal health solutions powered by advanced technology
            </Text>
          </View>

          <View style={[styles.cardsWrap, { gap: 12, flexDirection: "row", flexWrap: "wrap" }]}>
            {/* Card 1 */}
            <View style={[styles.card, styles.cardGreen, { flexBasis: cardBasis }]}>
              <View style={[styles.iconDot, styles.iconDotGreen]}>
                <Text style={styles.iconTick}>✓</Text>
              </View>
              <Text style={[styles.cardTitle, { fontSize: isCompact ? 17 : 18 }]}>Risk Assessment</Text>
              <Text style={[styles.cardText, { fontSize: isCompact ? 13.5 : 14 }]}>
                AI-powered analysis to identify potential health risks during
                pregnancy and post-delivery
              </Text>
            </View>

            {/* Card 2 */}
            <View style={[styles.card, styles.cardOrange, { flexBasis: cardBasis }]}>
              <View style={[styles.iconDot, styles.iconDotOrange]}>
                <Text style={styles.iconBars}>▮▮▮</Text>
              </View>
              <Text style={[styles.cardTitle, { fontSize: isCompact ? 17 : 18 }]}>Health Tracking</Text>
              <Text style={[styles.cardText, { fontSize: isCompact ? 13.5 : 14 }]}>
                Comprehensive monitoring of maternal health metrics and vital signs
              </Text>
            </View>

            {/* Card 3 */}
            <View style={[styles.card, styles.cardMix, { flexBasis: cardBasis }]}>
              <View style={[styles.iconDot, styles.iconDotMix]}>
                <Text style={styles.iconBook}>📘</Text>
              </View>
              <Text style={[styles.cardTitle, { fontSize: isCompact ? 17 : 18 }]}>Expert Guidance</Text>
              <Text style={[styles.cardText, { fontSize: isCompact ? 13.5 : 14 }]}>
                Access to field guides and expert recommendations for optimal maternal care
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <LinearGradient
          colors={["#FF9933", "#138808"]} // Saffron to Green
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.statsSection, { paddingHorizontal: padX, paddingVertical: padY }]}
        >
          <View style={[styles.statsGrid, { gap: 16 }]}>
            {[
              ["1000+", "Mothers Helped"],
              ["95%", "Accuracy Rate"],
              ["24/7", "Support Available"],
              ["50+", "Health Centers"],
            ].map(([n, l]) => (
              <View key={l} style={[styles.statBox, { flexBasis: statBasis, marginBottom: 8 }]}>
                <Text style={[styles.statNumber, { fontSize: isPlus ? 28 : isRegular ? 26 : 24 }]}>{n}</Text>
                <Text style={[styles.statLabel, { fontSize: isCompact ? 13 : 14 }]}>{l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- BASE STYLES ---------- */
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
  },

  /* Hero */
  heroWrap: {
    backgroundColor: "#f8fafc",
  },
  heroInner: {
    alignItems: "center",
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  heroTitle: {
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  heroGradientWord: {
    color: "#FF9933", // Saffron
  },
  heroSub: {
    lineHeight: 22,
    color: "#4b5563",
    textAlign: "center",
    maxWidth: 740,
    marginBottom: 18,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  primaryBtn: {
    backgroundColor: "#FF9933", // Saffron
    borderRadius: 999,
    elevation: 2,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 999,
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "700",
  },

  /* Features */
  featuresSection: {
    backgroundColor: "#fff",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  sectionSub: {
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 600,
  },
  cardsWrap: {
    marginTop: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardGreen: { backgroundColor: "#E8F5E9" }, // Light Green
  cardOrange: { backgroundColor: "#FFF7ED" }, // Light Saffron
  cardMix: { backgroundColor: "#F1F8E9" },   // Lighter Green

  iconDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  iconDotGreen: { backgroundColor: "#138808" }, // Green
  iconDotOrange: { backgroundColor: "#FF9933" }, // Saffron
  iconDotMix: { backgroundColor: "#2E7D32" },   // Darker Green
  iconTick: { color: "#fff", fontSize: 22, fontWeight: "800" },
  iconBars: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  iconBook: { color: "#fff", fontSize: 20 },

  cardTitle: {
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  cardText: {
    color: "#4b5563",
    textAlign: "center",
  },

  /* Stats */
  statsSection: {},
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  statBox: {
    backgroundColor: "transparent",
    alignItems: "center",
  },
  statNumber: {
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    color: "#E0E0E0", // Light Gray
  },
});