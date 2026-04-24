import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,

    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { Checkbox } from "react-native-paper";

import { auth, database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

//////////////////////////////////////////////////////////////
// CLOUDINARY CONFIG (same as your working file)
//////////////////////////////////////////////////////////////
const CLOUD_NAME = "dcu5kjqfj";
const UPLOAD_PRESET = "tailor_unsigned";

export default function Tailorreg() {

  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const scale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<any>({});

  // ✅ NEW IMAGE STATES
  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);
  const [shopImage, setShopImage] = useState<string | null>(null);

  /////////////////////////////////////////////////////////////
  // CLOUDINARY UPLOAD (same working logic)
  /////////////////////////////////////////////////////////////
  const uploadToCloudinary = async (uri: string) => {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);
    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );

    const json = await res.json();
    if (!json.secure_url) throw new Error("Upload failed");
    return json.secure_url;
  };

  /////////////////////////////////////////////////////////////
  // PICK IMAGE
  /////////////////////////////////////////////////////////////
  const pickImage = async (setter: any, key: string) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (result.canceled) return;

    try {
      const url = await uploadToCloudinary(result.assets[0].uri);
      setter(url);
      setErrors((prev: any) => ({ ...prev, [key]: null }));
    } catch {
      alert("Upload failed");
    }
  };

  /////////////////////////////////////////////////////////////
  const validateForm = () => {
    let newErrors: any = {};

    if (!fullName) newErrors.fullName = "Required";
    if (!email) newErrors.email = "Required";
    if (!phone) newErrors.phone = "Required";
    if (!address) newErrors.address = "Required";
    if (!password) newErrors.password = "Required";
    if (!confirmPassword) newErrors.confirmPassword = "Required";

    if (!cnicFront) newErrors.cnicFront = "Upload CNIC Front";
    if (!cnicBack) newErrors.cnicBack = "Upload CNIC Back";
    if (!shopImage) newErrors.shopImage = "Upload Shop Image";

    if (!agreeTerms) newErrors.terms = "Accept terms";

    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /////////////////////////////////////////////////////////////
  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await updateProfile(user, { displayName: fullName });
      await sendEmailVerification(user);

      await set(ref(database, "Tailorusers/" + user.uid), {
        role: "tailor",
        fullName,
        email,
        phone,
        address,

        // ✅ SAVE IMAGES
        cnicFront,
        cnicBack,
        shopImage,

        status: "pending",
        createdAt: new Date().toISOString(),
      });

     ToastAndroid.show(
  "Your account has been created successfully. Please wait for admin approval",
  ToastAndroid.LONG
);
      router.replace("/Tailorlogin");

    } catch (e: any) {
      alert(e.message);
    }
  };

  /////////////////////////////////////////////////////////////

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>

          <View style={styles.header}>
            <Animated.Image
              source={require("../../assets/images/app-logo.png")}
              style={[styles.logo, { transform: [{ scale }] }]}
            />
            <Text style={styles.heading}>Tailor Registration</Text>
            <Text style={styles.subText}>
              Start your professional journey
            </Text>
          </View>

          <View style={styles.card}>

            <Text style={styles.section}>Personal Info</Text>

            {[ 
              { icon: "account-outline", val: fullName, set: setFullName, ph: "Full Name", key: "fullName" },
              { icon: "email-outline", val: email, set: setEmail, ph: "Email", key: "email" },
              { icon: "phone-outline", val: phone, set: setPhone, ph: "Phone", key: "phone", custom: true },
              { icon: "map-marker-outline", val: address, set: setAddress, ph: "Address", key: "address" },
            ].map((f, i) => (
              <View key={i}>
                <View style={styles.inputBox}>
                  <MaterialCommunityIcons name={f.icon} size={20} color={COLORS.textSecondary} />
                 {f.custom ? (
  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
    <Text style={{ marginLeft: 5, marginRight: 5 }}>🇵🇰 +92</Text>
    <TextInput
      style={{ flex: 1 }}
      placeholder="3XXXXXXXXX"
      placeholderTextColor={COLORS.textSecondary}
      value={f.val}
      onChangeText={(t) => f.set(t.replace(/^(\+92|0)/, ""))}
      keyboardType="phone-pad"
    />
  </View>
) : (
  <TextInput
    style={styles.input}
    placeholder={f.ph}
    placeholderTextColor={COLORS.textSecondary}
    value={f.val}
    onChangeText={f.set}
  />
)}
                </View>
                {errors[f.key] && <Text style={styles.error}>{errors[f.key]}</Text>}
              </View>
            ))}

            {/* ✅ IMAGE SECTION (same UI style) */}
            <Text style={styles.section}>Verification</Text>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(setCnicFront, "cnicFront")}>
              <Text>{cnicFront ? "CNIC Front Uploaded" : "Upload CNIC Front"}</Text>
            </TouchableOpacity>
            {errors.cnicFront && <Text style={styles.error}>{errors.cnicFront}</Text>}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(setCnicBack, "cnicBack")}>
              <Text>{cnicBack ? "CNIC Back Uploaded" : "Upload CNIC Back"}</Text>
            </TouchableOpacity>
            {errors.cnicBack && <Text style={styles.error}>{errors.cnicBack}</Text>}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(setShopImage, "shopImage")}>
              <Text>{shopImage ? "Shop Image Uploaded" : "Upload Shop Image"}</Text>
            </TouchableOpacity>
            {errors.shopImage && <Text style={styles.error}>{errors.shopImage}</Text>}

            <Text style={styles.section}>Security</Text>

            {/* PASSWORD SAME */}
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialCommunityIcons name={showConfirmPassword ? "eye-off" : "eye"} size={20} />
              </TouchableOpacity>
            </View>

            {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

            <View style={styles.row}>
              <Checkbox
                status={agreeTerms ? "checked" : "unchecked"}
                onPress={() => setAgreeTerms(!agreeTerms)}
                color={COLORS.primary}
              />
              <Text style={{ color: COLORS.textPrimary }}>
                Agree Terms & Conditions
              </Text>
            </View>

            <TouchableOpacity onPress={handleRegister}>
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Register Tailor</Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
/////////////////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: { padding: 20 },

  header: { alignItems: "center", marginBottom: 20 },

  logo: { width: 80, height: 80 },

  heading: { fontSize: 26, fontWeight: "bold", color: COLORS.textPrimary },

  subText: { color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 20,
    elevation: 8
  },

  section: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginTop: 15
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background
  },

  input: { flex: 1, padding: 12 },

  secondaryBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    alignItems: "center"
  },

  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20
  },

  buttonText: { color: "#fff", fontWeight: "bold" },

  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15
  },

  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold"
  },

  modalBtn: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20
  },

  error: { color: "red", fontSize: 12 }

});