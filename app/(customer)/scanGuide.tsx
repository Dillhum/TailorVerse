import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter
} from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");

export default function ScanGuide() {

  const router = useRouter();
  const params = useLocalSearchParams();

  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ✅ FIXED TYPE (no error now)
  const videoRef = useRef<Video | null>(null);

  const steps = [
    {
      video: require("../../assets/Videos/clean_camera.mp4"),
      text: "Please clean your camera for best results"
    },
    {
      video: require("../../assets/Videos/good_light.mp4"),
      text: "Go to a well-lit room"
    },
    {
      video: require("../../assets/Videos/enter_height.mp4"),
      text: "Make sure to enter your correct height"
    },
    {
      video: require("../../assets/Videos/stand_6ft.mp4"),
      text: "Stand 6 feet away from the camera"
    }
  ];

  //////////////////////////////////////////////////////

  // 🔥 AUTO STOP when screen leaves
  useFocusEffect(
    useCallback(() => {
      return () => {
        videoRef.current?.stopAsync(); // ✅ safe call
        Speech.stop(); // ✅ stop any voice if exists
      };
    }, [])
  );

  //////////////////////////////////////////////////////

  const goToNextScreen = () => {
    videoRef.current?.stopAsync(); // stop video
    Speech.stop(); // stop speech

    router.push({
      pathname: "/(customer)/scanp",
      params
    });
  };

  //////////////////////////////////////////////////////

  const nextStep = () => {

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {

      if (step < steps.length - 1) {

        setStep(step + 1);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }).start();

      } else {
        goToNextScreen();
      }
    });
  };

  //////////////////////////////////////////////////////

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

      {/* SKIP */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={goToNextScreen}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* VIDEO */}
      <Video
        ref={videoRef}
        source={steps[step].video}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping
      />

      {/* TEXT */}
      <Text style={styles.text}>
        {steps[step].text}
      </Text>

      {/* BUTTON */}
      <TouchableOpacity onPress={nextStep} activeOpacity={0.9}>
        <LinearGradient
          colors={["#6A3F25", "#A06A42"]}
          style={styles.button}
        >
          <Text style={styles.btnText}>
            {step === steps.length - 1 ? "Start Scan" : "Next"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

    </Animated.View>
  );
}

//////////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center"
  },

  skipContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },

  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },

  video: {
    width: width,
    height: "70%"
  },

  text: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20
  },

  button: {
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }

});