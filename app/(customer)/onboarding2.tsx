import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from "../theme/colors";

const { width, height } = Dimensions.get('window');

const Onboarding2 = () => {
  const router = useRouter();

  const dotAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // dots
    Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // button
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // border animation
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const buttonBg = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#4B2E2B', '#8C6A5A'],
  });

  const translateX = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });
const scaleAnim = buttonAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [1, 1.05],
});
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🔥 FLOATING CARD */}
      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.cardWrapper,
            { transform: [{ translateY: floatTranslate }] },
          ]}
        >
          {/* gradient border */}
          <Animated.View
            style={[
              styles.gradientBorder,
              { transform: [{ translateX }] },
            ]}
          >
            <LinearGradient
             colors={[
  COLORS.gradientStart,
  COLORS.primaryLight,
  COLORS.gradientEnd
]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
          </Animated.View>

          {/* image */}
          <View style={styles.ovalCard}>
            <Image
              source={require('../../assets/images/onboarding2.png')}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text style={styles.title}>
          Choose Your Tailor Smartly
        </Text>

        <Text style={styles.desc}>
          Select a tailor based on your budget and delivery time.{"\n"}
          Get your outfit stitched from the comfort of your home.
        </Text>

        {/* DOTS */}
       <View style={styles.dots}>
  {[0, 1, 2].map((i) => {
    const opacity = dotAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [
        i === 0 ? 1 : 0.3,
        i === 1 ? 1 : 0.3,
        i === 2 ? 1 : 0.3,
      ],
    });

    return (
      <Animated.View key={i} style={[styles.dot, { opacity }]} />
    );
  })}
</View>

        {/* BUTTON */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <LinearGradient
    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
    style={styles.button}
  >
    <TouchableOpacity onPress={() => router.replace('/role')}>
      <Text style={styles.buttonText}>Get Started</Text>
    </TouchableOpacity>
  </LinearGradient>
</Animated.View>
      </View>

    </SafeAreaView>
  );
};

export default Onboarding2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  imageContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardWrapper: {
    width: width * 0.9,
    height: height * 0.35,
    borderRadius: 200,
    overflow: 'hidden',
  },

  gradientBorder: {
    ...StyleSheet.absoluteFillObject,
  },

  gradientFill: {
    width: '200%',
    height: '100%',
  },

  ovalCard: {
    width: '96%',
    height: '96%',
    borderRadius: 200,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: '2%',
    backgroundColor: '#EFE6DC',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  desc: {
    fontSize: 14,
  color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },

  dots: {
    flexDirection: 'row',
    marginTop: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 5,
    opacity: 0.3,
  },

  button: {
    marginTop: 30,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 80,
    elevation: 5,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
});