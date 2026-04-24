import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    ImageBackground,
    ImageSourcePropType,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from "../theme/colors";

const { width } = Dimensions.get('window');

/* ================= PROPS ================= */

interface RoleCardProps {
  title: string;
  imageSource: ImageSourcePropType;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  delay?: number;
}

/* ================= COMPONENT ================= */

const RoleSelection: React.FC = () => {
  const router = useRouter();

  /* 🔥 ENTRY ANIMATION */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* 🔥 ROLE CARD */
  const RoleCard: React.FC<RoleCardProps> = ({
    title,
    imageSource,
    iconName,
    onPress,
    delay = 0,
  }) => {

    /* 🔥 PRESS ANIMATION */
    const pressAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { scale: pressAnim }
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cardContainer}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.card}>
            {/* Image */}
            <ImageBackground
              source={imageSource}
              style={styles.imageBackground}
              imageStyle={styles.imageRadius}
            >
              <View style={styles.overlay} />
            </ImageBackground>

            {/* Bottom Curve */}
            <View style={styles.bottomInfo}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={32}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.roleText}>{title}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Select Your Role</Text>
        <Text style={styles.subTitle}>
          How would you like to proceed?
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsWrapper}>
        <RoleCard
          title="As a Tailor"
          iconName="content-cut"
          imageSource={require('@/assets/images/tailor.png')}
          onPress={() => router.push('/Tailorlogin')}
        />

        <RoleCard
          title="As a Customer"
          iconName="shopping-outline"
          imageSource={require('@/assets/images/customer.png')}
          onPress={() => router.push('/cuslogin')}
        />
      </View>
    </SafeAreaView>
  );
};

export default RoleSelection;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    marginBottom: 40,
    alignItems: 'center',
  },

  mainTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  subTitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  cardsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 18,
  },

  cardContainer: {
    width: width * 0.44,
    height: width * 0.78,
    borderRadius: 26,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  imageBackground: {
    flex: 2,
    width: '100%',
  },

  imageRadius: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(111, 78, 55, 0.15)',
  },

  bottomInfo: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    marginTop: -35,
    paddingTop: 32,
    position: 'relative',
  },

  iconCircle: {
    position: 'absolute',
    top: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  roleText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 22,
  },
});