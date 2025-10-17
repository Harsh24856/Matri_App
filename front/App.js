// App.js (React Native)
import React, { useEffect, useState, createContext } from "react";
import { ActivityIndicator, View, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ Safe areas (new)
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Screens
import Navbar from "./Components/Navbar";
import Content from "./Components/Content";
import Role from "./Components/Role";
import SignIn from "./Components/SignIn";
import SignUp from "./Components/SignUp";
import PrePeg from "./Components/PrePeg";
import Feed from "./Components/Feed";
import UserDashboard from "./Components/UserDashboard.jsx";
import PrePegOp from "./Components/PrePegOp";
import PostDel from "./Components/PostDel";
import GeminiSummary from "./Components/GeminiSummary";
import FieldGuide from "./Components/Fieldguide";
import SupervisorDashboard from "./Components/Supervisor";
import PostDeliveryResult from "./Components/Res";

// ---------- auth context ----------
export const AuthContext = createContext({ user: null, setUser: () => {} });

const Stack = createNativeStackNavigator();

// Home = Content + Role
function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Content />
        <Role />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- App Stacks ---------------- */
function AppStack({ user, setUser }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: ({ navigation }) => (
          <Navbar user={user} setUser={setUser} navigation={navigation} />
        ),
      }}
    >
      {/* Public-but-visible while logged in */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Feed" component={Feed} />
      <Stack.Screen name="PrePegOp" component={PrePegOp} />
      <Stack.Screen name="GeminiSummary" component={GeminiSummary} />
      <Stack.Screen name="PostDeliveryResult" component={PostDeliveryResult} />
      <Stack.Screen name="FieldGuide" component={FieldGuide} />

      {/* App (was “protected”) */}
      <Stack.Screen name="PrePeg" component={PrePeg} />
      <Stack.Screen name="UserDashboard" component={UserDashboard} />
      <Stack.Screen name="PostDel" component={PostDel} />
      <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
    </Stack.Navigator>
  );
}

function AuthStack({ setUser }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn">
        {(props) => <SignIn {...props} setUser={setUser} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {(props) => <SignUp {...props} setUser={setUser} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/* ---------------- Root ---------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [rehydrating, setRehydrating] = useState(true);

  // restore session from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (token && storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.warn("Session restore failed:", e);
      } finally {
        setRehydrating(false);
      }
    })();
  }, []);

  if (rehydrating) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ user, setUser }}>
        <NavigationContainer>
          {user ? (
            <AppStack user={user} setUser={setUser} />
          ) : (
            <AuthStack setUser={setUser} />
          )}
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}