import { useLocalSearchParams, useRouter } from "expo-router";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

//////////////////////////////////////////////////
// 🌫️ LIGHT FADE GLASS BUBBLES (NO ANIMATION)
//////////////////////////////////////////////////

const BackgroundBubbles = () => {
  const bubbles = [
    { size: 120, top: "10%", left: "5%" },
    { size: 80, top: "25%", left: "70%" },
    { size: 100, top: "60%", left: "10%" },
    { size: 60, top: "75%", left: "50%" },
    { size: 140, top: "40%", left: "80%" },
    { size: 90, top: "85%", left: "20%" },
    { size: 70, top: "15%", left: "40%" },
    { size: 110, top: "55%", left: "60%" },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {bubbles.map((b, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: b.size,
            height: b.size,
            borderRadius: b.size / 2,
            backgroundColor: "rgba(210, 180, 140, 0.25)",
            top: b.top,
            left: b.left,
          }}
        />
      ))}
    </View>
  );
};

//////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////

type Service = {
  selected?: boolean;
  cost?: any;
};

type Tailor = {
  id: string;
  fullName?: string;
  shopName?: string;
  city?: string;
  deliveryTime?: string;
  profileImage?: string;
  services?: { [key: string]: Service };
};

//////////////////////////////////////////////////
// 🔥 ANIMATED CARD
//////////////////////////////////////////////////

const AnimatedCard = ({
  item,
  index,
  router,
  searchText,
  colorName,
  fabric,
  referenceImage,
  category,
  type,
  style,
  measurements,
}: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/(customer)/CustomerTailorprofile",
            params: {
              tailorId: item.id,
              colorName,
              fabric,
              referenceImage,
              category,
              type,
              style,
              measurements,
            },
          })
        }
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={
              item.profileImage
                ? { uri: item.profileImage }
                : require("../../assets/images/avatar.jpg")
            }
            style={styles.avatar}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.shop}>{item.shopName}</Text>
          <Text style={styles.name}>{item.fullName}</Text>

          <Text style={styles.meta}>
            📍 {item.city} • ⏱ {item.deliveryTime} days
          </Text>

          <View style={styles.tagRow}>
            {item.services &&
              Object.entries(item.services)
                .filter(([_, v]) => v?.selected)
                .map(([key, val]: [string, Service]) => {
                  const isMatch =
                    searchText &&
                    key.toLowerCase().includes(searchText);

                  const cost =
                    typeof val.cost === "object"
                      ? `Rs ${val.cost?.min}-${val.cost?.max}`
                      : val.cost;

                  return (
                    <View
                      key={key}
                      style={[
                        styles.tag,
                        isMatch && styles.tagActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          isMatch && { color: "#fff" },
                        ]}
                      >
                        {isMatch && "✔ "}
                        {key}
                      </Text>

                      <Text style={styles.costText}>{cost}</Text>
                    </View>
                  );
                })}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

//////////////////////////////////////////////////
// MAIN SCREEN
//////////////////////////////////////////////////

export default function CustomerTailorResults() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ✅ ONLY ADDITION (PARAMS)
  const colorName = (params.colorName as string) || "";
  const fabric = (params.fabric as string) || "";
  const referenceImage = (params.referenceImage as string) || "";
  const category = (params.category as string) || "";
  const type = (params.type as string) || "";
  const style = (params.style as string) || "";
  const measurements = (params.measurements as string) || "";

  const city = (params.city as string) || "";
  const deliveryDays = (params.deliveryDays as string) || "0";

  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");

  const parseCost = (cost: any): number => {
    if (!cost) return 0;

    if (typeof cost === "object") {
      return parseInt(cost.min || "0");
    }

    if (typeof cost === "string") {
      const match = cost.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }

    return 0;
  };

  useEffect(() => {
    const dbRef = ref(database, "Tailorusers");

    onValue(dbRef, (snap) => {
      const data = snap.val() || {};

      const list: Tailor[] = Object.entries(data).map(([id, v]: any) => ({
        id,
        ...v,
      }));

      const filtered = list.filter(
        (t) =>
          t.city?.toLowerCase().trim() === city.toLowerCase().trim() &&
          parseInt(t.deliveryTime || "0") <= parseInt(deliveryDays)
      );

      setTailors(filtered);
      setLoading(false);
    });
  }, []);

  const searchText = search.toLowerCase().trim();

  const visibleTailors = tailors.filter((t) => {
    if (!t.services) return false;

    const min = parseInt(minCost) || 0;
    const max = parseInt(maxCost) || Infinity;

    return Object.entries(t.services).some(([key, s]) => {
      if (!s.selected) return false;

      const cost = parseCost(s.cost);

      const searchMatch =
        !searchText || key.toLowerCase().includes(searchText);

      const costMatch = cost >= min && cost <= max;

      return searchMatch && costMatch;
    });
  });

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundBubbles />

      <Text style={styles.header}>Available Tailors</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          placeholder="Search service..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        <TextInput
          placeholder="Min Rs"
          value={minCost}
          onChangeText={setMinCost}
          style={styles.costInput}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Max Rs"
          value={maxCost}
          onChangeText={setMaxCost}
          style={styles.costInput}
          keyboardType="numeric"
        />
      </View>

      <FlatList
        data={visibleTailors}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedCard
            item={item}
            index={index}
            router={router}
            searchText={searchText}
            colorName={colorName}
            fabric={fabric}
            referenceImage={referenceImage}
            category={category}
            type={type}
            style={style}
            measurements={measurements}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        initialNumToRender={6}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
}

//////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  costInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    elevation: 6,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  shop: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  name: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  meta: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.textSecondary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  tagActive: {
    backgroundColor: COLORS.primary,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  costText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
});