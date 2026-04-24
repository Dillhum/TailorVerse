import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { auth, database } from '../firebaseConfig';
import { COLORS } from "../theme/colors";

type ErrorsType = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

export default function RegistrationScreen() {

  /* 🔥 LOGO ANIMATION */
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
    outputRange: [0.8, 1],
  });

  /* STATES */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<ErrorsType>({});

  /* 🔥 ORIGINAL WORKING LOGIC RESTORED */
  const handleRegister = async () => {

    let newErrors: ErrorsType = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!password) newErrors.password = 'Password is required';

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) newErrors.terms = 'Please accept terms';

    setErrors(newErrors);

    if (Object.keys(newErrors).length !== 0) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });
      await sendEmailVerification(user);

      await set(ref(database, 'users/' + user.uid), {
        uid: user.uid,
        fullName,
        email,
        phone,
        address,
        role: "customer",
        createdAt: new Date().toISOString(),
      });

      alert("Account created! Verify your email.");
      router.replace('/(customer)/cuslogin');

    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>

        {/* LOGO */}
        <Animated.Image
          source={require('../../assets/images/app-logo.png')}
          style={[styles.logo, { transform: [{ scale }] }]}
        />

        <Text style={styles.heading}>Create Your Account</Text>

        {/* INPUTS */}
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.input} placeholder="Full Name" onChangeText={setFullName} />
        </View>
        {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} />
        </View>
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.input} placeholder="Phone" onChangeText={setPhone} />
        </View>
        {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.input} placeholder="Address" onChangeText={setAddress} />
        </View>
        {errors.address && <Text style={styles.error}>{errors.address}</Text>}

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.input} secureTextEntry={!showPassword} placeholder="Password" onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.textSecondary} />
          <TextInput style={styles.input} secureTextEntry={!showConfirmPassword} placeholder="Confirm Password" onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

        {/* TERMS */}
        <View style={styles.termsContainer}>
          <Checkbox
            status={agreeTerms ? 'checked' : 'unchecked'}
            onPress={() => setAgreeTerms(!agreeTerms)}
            color={COLORS.primary}
          />
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={styles.link}>Agree to Terms</Text>
          </TouchableOpacity>
        </View>
        {errors.terms && <Text style={styles.error}>{errors.terms}</Text>}

        {/* BUTTON */}
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.registerButton}>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* LOGIN LINK */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(customer)/cuslogin')}>
            <Text style={styles.loginLink}> Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Terms & Conditions</Text>
          <Text style={styles.modalText}>
            Your data is محفوظ and used responsibly. By using this app, you agree to our terms.
          </Text>

          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },

  heading: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.card,
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
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },

  link: {
    color: COLORS.primary,
    marginLeft: 5,
    textDecorationLine: 'underline',
  },

  registerButton: {
    width: '100%',
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },

  registerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
  },

  loginRow: {
    flexDirection: 'row',
    marginTop: 20,
  },

  loginText: {
    color: COLORS.textPrimary,
  },

  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  modalContainer: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },

  modalText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },

  closeBtn: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});