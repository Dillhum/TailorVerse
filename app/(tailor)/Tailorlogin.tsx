// 🔽 SAME IMPORTS
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import {
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Checkbox } from 'react-native-paper';

import { auth } from '../firebaseConfig';
import { COLORS } from '../theme/colors';

export default function TailorLogin() {

  const logoAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const loadRemembered = async () => {
      const savedEmail = await AsyncStorage.getItem('tailorEmail');
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

  /////////////////////////////////////////////////////////////

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

      // ❌ BLOCK CUSTOMER LOGIN
      const customerRef = ref(db, `users/${user.uid}`);
      const customerSnap = await get(customerRef);

      if (customerSnap.exists()) {
        setLoginError("This account is a customer. Use customer login.");
        await signOut(auth);
        return;
      }

      // ✅ ONLY TAILOR USERS
      const tailorRef = ref(db, `Tailorusers/${user.uid}`);
      const tailorSnap = await get(tailorRef);

      if (!tailorSnap.exists()) {
        setLoginError("Only tailors can login here.");
        await signOut(auth);
        return;
      }

      const userData = tailorSnap.val();

      // ✅ EMAIL VERIFY
      if (!user.emailVerified) {
        setLoginError("Please verify your email.");
        await signOut(auth);
        return;
      }

      // ✅ ADMIN APPROVAL
      if (userData.status === "pending") {
        setLoginError("Your account is under review.");
        await signOut(auth);
        return;
      }

      if (userData.status === "rejected") {
        setLoginError("Your account was rejected.");
        await signOut(auth);
        return;
      }
      if (userData.status === "blocked") {   // 🔥 YEH ADD KIYA
  setLoginError("You are blocked by admin 🚫");
  await signOut(auth);
  return;
}
      if (userData.status !== "approved") {
        setLoginError("Account invalid.");
        await signOut(auth);
        return;
      }

      // REMEMBER
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
      } else {
        await AsyncStorage.setItem('tailorEmail', email);
      }

      router.replace('/Tailordashboard');

    } catch (error) {
      setLoginError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  /////////////////////////////////////////////////////////////

  return (

    <ImageBackground
      source={require('../../assets/images/tailorlogi.jpg')}
      style={styles.background}
      blurRadius={8}
    >

      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.card}>

          <Animated.Image
            source={require('../../assets/images/app-logo.png')}
            style={[styles.logo, { transform: [{ scale }] }]}
          />

          <Text style={styles.heading}>Tailor Login</Text>

          <Text style={styles.subText}>
            Manage your orders & customers
          </Text>

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
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {passwordError && <Text style={styles.error}>{passwordError}</Text>}

          {/* REMEMBER */}
          <View style={styles.rememberRow}>
            <Checkbox
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
              color={COLORS.primary}
            />
            <Text style={styles.rememberText}>Remember Me</Text>
          </View>

          {/* 🔥 FORGOT PASSWORD */}
          <TouchableOpacity
            style={styles.forgot}
            onPress={() => router.push('/forgetpassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* ERROR */}
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
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Login</Text>
                }
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* 🔥 SIGNUP */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don’t have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/Tailorreg')}>
              <Text style={styles.signupLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>

    </ImageBackground>
  );
}

/////////////////////////////////////////////////////////////

const styles = StyleSheet.create({

  background: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)"
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 25,
    elevation: 8,
  },

  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 10,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textPrimary,
  },

  subText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    color: COLORS.textPrimary,
  },

  error: {
    color: "red",
    marginBottom: 6,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  rememberText: {
    color: COLORS.textPrimary,
  },

  forgot: {
    alignSelf: "flex-end",
    marginBottom: 15,
  },

  forgotText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  button: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },

  buttonText: {
    textAlign: "center",
    paddingVertical: 15,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  signupText: {
    color: COLORS.textPrimary,
  },

  signupLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  }

});