// Components/Navbar.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * Props:
 *  - user: { name?, email? } | null
 *  - setUser: (value|null) => void
 */
export default function Navbar({ user, setUser }) {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      // clear local session if you store it:
      // await AsyncStorage.multiRemove(["token", "user"]);
    } catch {}
    setUser?.(null);
    setMenuVisible(false);
    navigation.replace("Home");
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navbar}>
          {/* Left: Logo + App Name */}
          <Pressable
            style={styles.brandContainer}
            onPress={() => navigation.navigate("Home")}
          >
            {/* If your image is SVG, see note below. For now, use a PNG/WebP. */}
            
            <Text style={styles.brandText}>मातृCare</Text>
          </Pressable>

          {/* Right: Auth or Profile */}
          {!user ? (
            <View style={styles.authButtons}>
              <Pressable
                onPress={() => navigation.navigate("SignIn")}
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.signInText}>Sign In</Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate("SignIn")}
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.startButtonText}>Get Started</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setMenuVisible(true)}
                style={styles.profileButton}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user.name || user.username || user.email || "U")
                      .toString()
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userName}>
                  {user.name || user.username || "User"}
                </Text>
              </Pressable>

              {/* Profile Menu */}
              <Modal visible={menuVisible} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPressOut={() => setMenuVisible(false)}
                >
                  <View style={styles.menuBox}>
                    <Text style={styles.menuTitle}>
                      {user.name || user.username || "User"}
                    </Text>
                    <Text style={styles.menuSubtitle}>
                      {user.email || "user@example.com"}
                    </Text>

                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        navigation.navigate("SupervisorDashboard");
                      }}
                    >
                      <Text style={styles.menuItemText}>Dashboard</Text>
                    </Pressable>
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        navigation.navigate("UserDashboard");
                      }}
                    >
                      <Text style={styles.menuItemText}>Staff Dashboard</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.menuItem, styles.signOutItem]}
                      onPress={handleSignOut}
                    >
                      <Text style={styles.signOutText}>Sign Out</Text>
                    </Pressable>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    backgroundColor: "#ffffff",
    borderBottomWidth: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 0,
    borderColor: "#E5E7EB",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    borderBottomWidth: Platform.OS === "ios" ? StyleSheet.hairlineWidth : 0,
    borderColor: "#EEE",
  },

  brandContainer: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  logo: { 
    width: 38, 
    height: 38, 
    marginRight: 10 
  },
  brandText: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#FF9933", // Saffron
    letterSpacing: 0.5,
  },

  authButtons: { 
    flexDirection: "row", 
    alignItems: "center",
    gap: 10,
  },
  signInButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#FF9933", // Saffron
    marginRight: 8,
  },
  signInText: { 
    color: "#FF9933", // Saffron
    fontWeight: "600", 
    fontSize: 16,
    letterSpacing: 0.3,
  },
  startButton: {
    backgroundColor: "#FF9933", // Saffron
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  startButtonText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16,
    letterSpacing: 0.3,
  },

  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#FFDDBB", // Light Saffron
    borderRadius: 30,
    backgroundColor: "#FFF7ED", // Very Light Saffron
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF9933", // Saffron
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  avatarText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  userName: { 
    fontSize: 15, 
    color: "#111827",
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  menuBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    padding: 16,
    width: 260,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  menuTitle: { 
    fontWeight: "700", 
    fontSize: 18, 
    color: "#111827",
    marginBottom: 4,
  },
  menuSubtitle: { 
    color: "#6B7280", 
    fontSize: 14, 
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  menuItem: { 
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  menuItemText: { 
    fontSize: 16, 
    color: "#374151",
    fontWeight: "500",
  },
  signOutItem: { 
    marginTop: 10, 
    borderTopWidth: 1, 
    borderColor: "#E5E7EB", 
    paddingTop: 12,
  },
  signOutText: { 
    color: "#DC2626", 
    fontWeight: "600",
    fontSize: 16,
  },
});