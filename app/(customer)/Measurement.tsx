import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme/colors";

export default function MeasurementMethod() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const colorName = (params.colorName as string) || "";
  const referenceImage = (params.referenceImage as string) || "";
  const fabric = (params.fabric as string) || "";
  const category = (params.category as string) || "";
  const type = (params.type as string) || "";
  const style = (params.style as string) || "";

  //////////////////////////////////////////////////
  // ANIMATION (LEFT → RIGHT)
  //////////////////////////////////////////////////

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(anim1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(anim2, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  //////////////////////////////////////////////////
  // NAVIGATION
  //////////////////////////////////////////////////

  const goScan = () => {
    router.push({
      pathname: "/(customer)/scanGuide",
      params: {
        colorName,
        referenceImage,
        fabric,
        category,
        type,
        style,
      },
    });
  };

  const goManual = () => {
    router.push({
      pathname: "/(customer)/manual",
      params: {
        colorName,
        referenceImage,
        fabric,
        category,
        type,
        style,
      },
    });
  };

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>THE PERFECT FIT</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>
        How would you like to provide your measurements?
      </Text>

      <Text style={styles.subtitle}>
        Choose the method that works best for you.
      </Text>

      {/* CARD 1 */}
      <Animated.View
        style={{
          transform: [
            {
              translateX: anim1.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: anim1,
        }}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={goScan}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.card}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="scan-helper"
                size={26}
                color={COLORS.card}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Smart AI Scan</Text>

              <Text style={styles.cardDesc}>
                Get instant, 99% accurate measurements using your mobile camera.
              </Text>
            </View>

            <View style={styles.radio} />

            <View style={styles.badge}>
              <Text style={styles.badgeText}>RECOMMENDED</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* CARD 2 */}
      <Animated.View
        style={{
          transform: [
            {
              translateX: anim2.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: anim2,
        }}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={goManual}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.card}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="ruler-square"
                size={26}
                color={COLORS.card}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Manual Entry</Text>

              <Text style={styles.cardDesc}>
                Enter your details yourself or follow our video guide.
              </Text>
            </View>

            <View style={styles.radio} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Ionicons
          name="lock-closed-outline"
          size={16}
          color={COLORS.textSecondary}
        />

        <Text style={styles.footerText}>
          Your data is encrypted and secure
        </Text>
      </View>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    marginLeft: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: COLORS.textPrimary,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.textPrimary,
  },

  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 30,
  },

  // ✅ GRADIENT CARD
  card: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    elevation: 5,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  cardDesc: {
    color: "#F0EAE4",
    fontSize: 13,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#fff",
  },

  badge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  footerText: {
    marginLeft: 6,
    color: COLORS.textSecondary,
  },
});