// 🔽 SAME IMPORTS (sirf ek add kiya)
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from "../theme/colors";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, getDatabase, ref } from "firebase/database";
import { auth } from '../firebaseConfig';

// ✅ ADD THIS
import { Checkbox } from 'react-native-paper';

export default function LoginScreen() {

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

  const opacity = logoAnim;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadRemembered = async () => {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    };
    loadRemembered();
  }, []);

  const pressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setLoginError('');

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const db = getDatabase();

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setLoginError("This account is not registered as a customer.");
        return;
      }

      const tailorRef = ref(db, `Tailorusers/${user.uid}`);
      const tailorSnap = await get(tailorRef);

      if (tailorSnap.exists()) {
        setLoginError("Please login from tailor panel.");
        return;
      }

      if (!user.emailVerified) {
        setLoginError('Please verify your email first.');
        return;
      }

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
      }

      router.replace('./Home');

    } catch (error: any) {

  if (
    error.code === "auth/invalid-credential" ||
    error.code === "auth/wrong-password" ||
    error.code === "auth/user-not-found"
  ) {
    setLoginError("Incorrect Email or Password");
  } else {
    setLoginError("Something went wrong. Try again.");
  }

}finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/loginback.jpg')}
      style={styles.background}
      blurRadius={8}
    >

      <View style={styles.centerWrapper}>

        <View style={styles.card}>

          <ScrollView showsVerticalScrollIndicator={false}>

            <Animated.Image
              source={require('../../assets/images/app-logo.png')}
              style={[styles.logo, { transform: [{ scale }], opacity }]}
            />

            <Text style={styles.heading}>Welcome Back</Text>

            {/* EMAIL */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={22} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {emailError && <Text style={styles.error}>{emailError}</Text>}

            {/* PASSWORD */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={22} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} />
              </TouchableOpacity>
            </View>
            {passwordError && <Text style={styles.error}>{passwordError}</Text>}

            {/* ✅ REMEMBER ME (ADDED) */}
            <View style={styles.rememberRow}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
                color={COLORS.primary}
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </View>

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 10 }}
              onPress={() => router.push('./forgetpassworrd')}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {loginError && <Text style={styles.error}>{loginError}</Text>}

            {/* BUTTON */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.button}
              >
                <TouchableOpacity
                  onPress={handleLogin}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* SIGNUP */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/cusreg')}>
                <Text style={styles.signupLink}> Sign Up</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

        </View>

      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  centerWrapper: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: "#ffffff", borderRadius: 25, padding: 20, elevation: 8 },
  logo: { width: 90, height: 90, alignSelf: 'center', marginBottom: 10 },
  heading: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, color: COLORS.textPrimary },

  // ✅ ADD STYLE
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rememberText: {
    color: COLORS.textPrimary,
  },

  button: { borderRadius: 12, overflow: "hidden", marginTop: 10 },
  buttonText: { textAlign: 'center', paddingVertical: 15, color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { color: COLORS.textPrimary },
  signupLink: { color: COLORS.primary, fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 6 },
});