import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRouter } from "expo-router";

const index = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
   router.replace("../onboardingScreen");;
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/tailorverse-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.appName}>TailorVerse</Text>
        <Text style={styles.tagline}>
          where fashion meets technology
        </Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C4033" />
        <Text style={styles.loadingText}>
          Crafting perfect fits with technology…
        </Text>
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    paddingVertical: 60,
  },

  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },

  logo: {
    width: 260,
    height: 280,
    marginBottom: 20,
  },

  appName: {
    marginTop: -100,
    fontSize: 36,
    fontWeight: "700",
    color: "#3E2723", // dark brown
    letterSpacing: 1,
  },

  tagline: {
    marginTop: 6,
    fontSize: 16,
    color: "#5C4033",
    fontStyle: "italic",
  },

  loadingContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#000000",
    letterSpacing: 0.5,
  },
});