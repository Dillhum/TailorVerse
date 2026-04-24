import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { onValue, ref } from "firebase/database";
import { database } from "../firebaseConfig";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import { COLORS } from "../theme/colors";

interface Fabric {
  id: string;
  name: string;
  season: string;
  image: string;
}

const CustomerFabricScreen = () => {
  const router = useRouter();

const params = useLocalSearchParams();

const colorName = Array.isArray(params.colorName)
  ? params.colorName[params.colorName.length - 1]
  : params.colorName;

const referenceImage = params.referenceImage;

  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("Summer");
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);

  const seasons = ["Summer", "Winter", "Spring", "Autumn"];

  // ✅ animation refs array
  const animations = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    const fabricRef = ref(database, "fabrics");

    onValue(fabricRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setFabrics(list);

        // create animation values
        animations.length = 0;
        list.forEach(() => {
          animations.push(new Animated.Value(0));
        });

        // stagger animation
        const anims = animations.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay: index * 80, // 🔥 stagger
            useNativeDriver: true,
          })
        );

        Animated.parallel(anims).start();
      }
    });
  }, []);

  const filteredFabrics = fabrics.filter(
    (item) => item.season === selectedSeason
  );

  const goNext = () => {
    if (!selectedFabric) return;

    router.push({
      pathname: "/style",
      params: {
        colorName,
        referenceImage,
        fabric: selectedFabric.name,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Select Fabric</Text>
      </View>

      {/* SEASONS */}
      <View style={styles.seasonRow}>
        {seasons.map((season) => (
          <TouchableOpacity
            key={season}
            style={[
              styles.seasonTab,
              selectedSeason === season && styles.selectedTab,
            ]}
            onPress={() => setSelectedSeason(season)}
          >
            <Text
              style={[
                styles.tabText,
                selectedSeason === season && styles.selectedTabText,
              ]}
            >
              {season}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* GRID */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {filteredFabrics.map((item, index) => {
          const anim = animations[index] || new Animated.Value(1);

          return (
            <Animated.View
              key={item.id}
              style={{
                width: "47%",
                    marginBottom: 15,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.fabricCard,
                  selectedFabric?.id === item.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedFabric(item)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.fabricImage}
                />

                {selectedFabric?.id === item.id && (
                  <View style={styles.tickIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={26}
                      color={COLORS.primary}
                    />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.fabricName}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* BUTTON */}
      <TouchableOpacity
        disabled={!selectedFabric}
        onPress={goNext}
        style={{ opacity: selectedFabric ? 1 : 0.5 }}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingTop: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  seasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  seasonTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectedTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  selectedTabText: {
    color: COLORS.card,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  fabricCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  fabricImage: {
    width: "100%",
    height: 130,
  },

  tickIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.card,
    borderRadius: 20,
  },

  cardInfo: {
    padding: 12,
  },

  fabricName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  nextButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    bottom: 20,
  },

  nextText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CustomerFabricScreen;