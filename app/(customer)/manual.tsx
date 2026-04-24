import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, push, ref, set } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { COLORS } from "../theme/colors";

const { height, width } = Dimensions.get("window");

export default function ManualMeasurement() {
  const params = useLocalSearchParams();

  const category = (params.category as string) || "";
  const type = (params.type as string) || "";
  const style = (params.style as string) || "";
  const colorName = (params.colorName as string) || "";
  const fabric = (params.fabric as string) || "";
  const referenceImage = (params.referenceImage as string) || "";

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();

  const [measurements, setMeasurements] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [notes, setNotes] = useState("");

  //////////////////////////////////////////////////
  // ✅ BUBBLES (FIXED POSITIONS - NO STRING %)
  //////////////////////////////////////////////////

  const bubbles = [
    { size: 120, left: width * 0.05, delay: 0 },
    { size: 80, left: width * 0.25, delay: 1200 },
    { size: 60, left: width * 0.45, delay: 2200 },
    { size: 140, left: width * 0.7, delay: 800 },
    { size: 90, left: width * 0.85, delay: 1800 },
    { size: 70, left: width * 0.6, delay: 2600 },
    { size: 100, left: width * 0.15, delay: 1500 },
  ];

  const animations = useRef(
    bubbles.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    animations.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(bubbles[i].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  //////////////////////////////////////////////////

  const measurementMap: any = {
    Top: [
      { key: "chest", label: "Chest Around", icon: "human-male" },
      { key: "waist", label: "Waist Around", icon: "tape-measure" },
      { key: "shoulder", label: "Shoulder Width", icon: "ruler" },
      { key: "sleeve", label: "Sleeve Length", icon: "arm-flex" },
      { key: "neck", label: "Neck Around", icon: "necklace" },
      { key: "length", label: "Garment Length", icon: "ruler" },
    ],
  };

  const fields = measurementMap[type] || measurementMap["Top"];

  const handleChange = (key: string, value: string) => {
    setMeasurements({ ...measurements, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };

  const validate = () => {
    let newErrors: any = {};
    fields.forEach((f: any) => {
      if (!measurements[f.key]) newErrors[f.key] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = async () => {
    if (!validate()) {
      Alert.alert("Incomplete", "Please enter all measurements");
      return;
    }

    if (!user) {
      Alert.alert("Login Required");
      return;
    }

    const measurementRef = push(
      ref(db, `manualMeasurements/${user.uid}`)
    );

    await set(measurementRef, {
      measurementId: measurementRef.key,
      userId: user.uid,
      category,
      type,
      style,
      colorName,
      fabric,
      referenceImage,
      measurements,
      notes,
      createdAt: Date.now(),
    });

    router.push({
  pathname: "/(customer)/CustomerfindTailor",
  params: {
    colorName,
    fabric,
    referenceImage,
    category,
    type,
    style,
    measurements: JSON.stringify(measurements),
  },
});
  };

  //////////////////////////////////////////////////

  return (
    <View style={{ flex: 1 }}>
      {/* 🔥 BUBBLES */}
      <View style={styles.bubbleContainer}>
        {bubbles.map((b, i) => {
          const anim = animations[i];

          return (
            <Animated.View
              key={i}
              style={[
                styles.bubble,
                {
                  width: b.size,
                  height: b.size,
                  borderRadius: b.size / 2,
                  left: b.left,
                  bottom: -150,
                  opacity: 0.12,

                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -height - 200],
                      }),
                    },
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, i % 2 === 0 ? 20 : -20],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      {/* BACK */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      <ScrollView style={styles.container}>
        <Text style={styles.heading}>CUSTOM FIT PROFILE</Text>

        {fields.map((field: any) => (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name={field.icon}
                size={20}
                color={COLORS.textPrimary}
              />

              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Enter"
                placeholderTextColor={COLORS.textSecondary}
                value={measurements[field.key]}
                onChangeText={(v) => handleChange(field.key, v)}
              />

              <Text style={styles.unit}>in</Text>
            </View>

            {errors[field.key] && (
              <Text style={styles.errorText}>
                {errors[field.key]}
              </Text>
            )}
          </View>
        ))}

        <TextInput
          style={styles.notesBox}
          placeholder="Extra notes..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity onPress={goNext}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.gradientBtn}
          >
            <Text style={styles.gradientText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 16,
    paddingTop: 80,
  },

  heading: {
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  field: {
    marginBottom: 12,
  },

  label: {
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    color: COLORS.textPrimary,
  },

  unit: {
    color: COLORS.textPrimary,
  },

  gradientBtn: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },

  gradientText: {
    color: "#fff",
    fontWeight: "700",
  },

  backBtn: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },

  errorText: {
    color: "red",
    fontSize: 12,
  },

  notesBox: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    height: 90,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
  },

  bubbleContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },

  bubble: {
    position: "absolute",
    backgroundColor: COLORS.primaryLight,
  },
});