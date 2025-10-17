import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function Feed() {
  const [email, setEmail] = useState("");

  const healthTips = [
    {
      id: 1,
      title: "Nutrition During Pregnancy",
      content:
        "Focus on a balanced diet rich in folic acid, iron, calcium, and protein. Include plenty of fruits, vegetables, whole grains, and lean proteins.",
      category: "Nutrition",
      readTime: "3 min read",
      // image: "/images/1.svg" // RN doesn't show raw SVG out of the box
    },
    {
      id: 2,
      title: "Post-Delivery Recovery",
      content:
        "Take time to rest and recover. Follow your doctor's advice for physical activity and don't hesitate to ask for help from family and friends.",
      category: "Recovery",
      readTime: "4 min read",
      // image: "/images/2.svg"
    },
    {
      id: 3,
      title: "Mental Health Awareness",
      content:
        "Pregnancy and post-delivery can bring emotional challenges. It's important to talk about your feelings and seek support when needed.",
      category: "Mental Health",
      readTime: "5 min read",
      // image: "/images/3.svg"
    },
    {
      id: 4,
      title: "Exercise Guidelines",
      content:
        "Light to moderate exercise during pregnancy can help maintain fitness and prepare your body for delivery. Always consult your healthcare provider first.",
      category: "Fitness",
      readTime: "3 min read",
      // image: "/images/4.svg"
    },
  ];

  const renderTip = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{item.category}</Text>
        </View>
        <Text style={styles.muted}>{item.readTime}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.content}</Text>

      <Pressable style={styles.linkBtn} onPress={() => {}}>
        <Text style={styles.linkBtnText}>Read More →</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fefcf5" }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.page}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Health & Wellness Feed</Text>
          <Text style={styles.subtitle}>
            Stay informed with the latest maternal health tips, research, and expert advice
          </Text>
        </View>

        {/* Featured Article */}
        <View style={styles.featured}>
          <View style={styles.featuredLeft}>
            {/* Illustration placeholder instead of SVG */}
            <View style={styles.illustration}>
              <Text style={styles.illustrationEmoji}>👩‍🍼</Text>
            </View>
          </View>
          <View style={styles.featuredRight}>
            <View style={styles.featuredMeta}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>Featured</Text>
              </View>
              <Text style={styles.muted}>5 min read</Text>
            </View>

            <Text style={styles.featuredTitle}>
              Complete Guide to Maternal Health Monitoring
            </Text>
            <Text style={styles.featuredBody}>
              Learn about the essential health metrics to track during pregnancy and post-delivery,
              and how our AI-powered system helps identify potential risks early.
            </Text>

            <Pressable onPress={() => {}} style={styles.cta}>
              <Text style={styles.ctaText}>Read More</Text>
            </Pressable>
          </View>
        </View>

        {/* Health Tips Grid */}
        <FlatList
          data={healthTips}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderTip}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.grid}
          scrollEnabled={false}
        />

        {/* Newsletter Signup */}
        <View style={styles.newsletter}>
          <Text style={styles.newsTitle}>Stay Updated</Text>
          <Text style={styles.newsSubtitle}>
            Get the latest maternal health tips, research updates, and expert advice delivered to your inbox.
          </Text>

          <View style={styles.newsRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter your email"
              placeholderTextColor="#4B5563"
              style={styles.newsInput}
            />
            <Pressable style={styles.newsBtn} onPress={() => {}}>
              <Text style={styles.newsBtnText}>Subscribe</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  page: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#f0fdf4", // subtle green-ish background to mimic gradient vibe
    gap: 24,
  },

  // Header
  headerWrap: {
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    maxWidth: 620,
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  // Featured
  featured: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredLeft: {
    width: "44%",
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationEmoji: { fontSize: 72 },
  featuredRight: {
    width: "56%",
    padding: 20,
    gap: 12,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featuredBadge: {
    backgroundColor: "#dcfce7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  featuredBadgeText: { 
    color: "#16a34a", 
    fontWeight: "700", 
    fontSize: 13,
    letterSpacing: 0.2,
  },
  muted: { 
    color: "#6B7280", 
    fontSize: 13,
    letterSpacing: 0.2,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
    lineHeight: 26,
  },
  featuredBody: {
    color: "#374151",
    lineHeight: 22,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: "#22c55e",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 4,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // Grid
  grid: { gap: 16, paddingTop: 8 },
  columnWrap: { gap: 16 },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  pill: {
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { 
    color: "#16a34a", 
    fontWeight: "600", 
    fontSize: 13,
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  cardBody: {
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  linkBtn: { 
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  linkBtnText: { 
    color: "#16a34a", 
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Newsletter
  newsletter: {
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#22c55e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  newsTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  newsSubtitle: {
    color: "#dcfce7",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  newsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  newsInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 15,
  },
  newsBtn: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newsBtnText: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});