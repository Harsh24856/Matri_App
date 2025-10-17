// src/lib/apiBase.js
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Order of resolution:
 * 1) expo extra.apiBase (set in app.json/app.config)
 * 2) Smart defaults for emulators (iOS/Android)
 * 3) Fallback to LAN IP (edit to your machine IP)
 */
export function getApiBase() {
  // 1) From app config
  const cfg = Constants.expoConfig ?? Constants.manifest2 ?? {};
  const extra = (cfg?.extra ?? {});
  if (extra.apiBase) return extra.apiBase;

  // 2) Emulators
  if (__DEV__) {
    if (Platform.OS === "ios") {
      // iOS Simulator can hit your Mac's localhost directly
      return "http://192.168.31.203:3000";
    }
    if (Platform.OS === "android") {
      // Android Emulator special loopback to host
      return "http://10.0.2.2:3000";
    }
  }

  // 3) Physical devices on same Wi-Fi: put your Mac's LAN IP here
  // e.g. http://192.168.1.50:3000 or http://172.31.73.125:3000
  return "http://192.168.31.203:3000";
}