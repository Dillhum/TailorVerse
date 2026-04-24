import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { auth } from '../firebaseConfig';
import { COLORS } from "../theme/colors";

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPassword = async () => {
    setEmailError('');
    setSuccessMessage('');

    if (!email) {
      setEmailError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent! Check your email.');
    } catch (error: any) {
      setEmailError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/forgetback.jpg')}
      style={styles.background}
      blurRadius={5}
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>

        {/* ✅ FIXED HEADING */}
        <Text style={styles.heading}>Forgot Password?</Text>

        <Text style={styles.subHeading}>
          Enter your email address below to receive a password reset link.
        </Text>

        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Email"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
            setSuccessMessage('');
          }}
          keyboardType="email-address"
        />

        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        {/* ✅ GRADIENT BUTTON LIKE LOGIN */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.resetButton}
        >
          <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
            <Text style={styles.resetText}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity onPress={() => router.back()} style={styles.backContainer}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.primary} />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

      </ScrollView>
    </ImageBackground>
  );
}

////////////////////////////////////////////////

const styles = StyleSheet.create({

  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    paddingTop: 120,
    paddingBottom: 50,
  },

  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary, 
    marginBottom: 10,
    textAlign: 'center',
  },

  subHeading: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },

  input: {
    width: '100%',
    backgroundColor: COLORS.card,
    color: COLORS.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 5,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },

  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 5,
  },

  successText: {
    color: COLORS.primary,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 5,
  },

  resetButton: {
    width: '100%',
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
    marginBottom: 20,
  },

  resetText: {
    textAlign: 'center',
    paddingVertical: 15,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backText: {
    color: COLORS.primary,
    fontSize: 16,
    marginLeft: 5,
  },

});