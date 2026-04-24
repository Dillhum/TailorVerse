import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { COLORS } from "../theme/colors";

export default function Selectcolor() {
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  // ✅ animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const popularColors = [
    { name: "Royal Blue", color: "#4169E1" },
    { name: "Charcoal Grey", color: "#36454F" },
    { name: "Maroon", color: "#800000" },
    { name: "Olive Green", color: "#556B2F" },
    { name: "Classic Black", color: "#000000" },
    { name: "Navy Blue", color: "#000080" },
    { name: "Burgundy", color: "#800020" },
    { name: "Cream", color: "#FFFDD0" },
  ];

  const filteredColors = popularColors.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.color.toLowerCase().includes(q)
    );
  });

  const uploadToCloudinary = async (imageUri: string) => {
    const data = new FormData();

    data.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "fabric.jpg",
    } as any);

    data.append("upload_preset", "tailor_unsigned");
    data.append("cloud_name", "dcu5kjqfj");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcu5kjqfj/image/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const file = await res.json();
      return file.secure_url;
    } catch (error) {
      console.log("Upload error", error);
      return null;
    }
  };

  const pickFromGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setReferenceImage(uri);

      const uploadedUrl = await uploadToCloudinary(uri);

      if (uploadedUrl) {
        setReferenceImage(uploadedUrl);
      }
    }
  };

  return (
    <View style={styles.main}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerText}>Choose Your Color</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />

          <TextInput
            placeholder="Search color name or hex code"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.sectionTitle}>Popular Colors</Text>

        {/* COLORS GRID */}
        <View style={styles.colorGrid}>
          {filteredColors.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.colorItem}
              onPress={() => {
                setSelectedColor(item.color);
                setCustomColor(item.name);
              }}
            >
              <View
                style={[
                  styles.colorCircle,
                  {
                    backgroundColor: item.color,
                    borderWidth: selectedColor === item.color ? 2 : 0,
                    borderColor: COLORS.card,
                  },
                ]}
              />

              <Text style={styles.colorName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ GRADIENT CARD WITH ANIMATION */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY }],
          }}
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Can't find your color?</Text>

            <TextInput
              placeholder="e.g. Sky Blue"
              placeholderTextColor={COLORS.border}
              style={styles.cardInput}
              value={customColor}
              onChangeText={setCustomColor}
            />

            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={pickFromGallery}
            >
              <Ionicons name="image-outline" size={18} color={COLORS.card} />
              <Text style={styles.galleryText}>Pick from Gallery</Text>
            </TouchableOpacity>

            {referenceImage && (
              <Image
                source={{ uri: referenceImage }}
                style={styles.previewImage}
              />
            )}
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* NEXT BUTTON */}
      <TouchableOpacity
        disabled={!(selectedColor || customColor)}
        style={{
          opacity: selectedColor || customColor ? 1 : 0.5,
        }}
        onPress={() => {
          router.push({
            pathname: "/fabric",
            params: {
              colorName: customColor || selectedColor,
              referenceImage,
            },
          });
        }}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.pickerModal} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 40,
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  headerText: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },

  searchBox: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.textPrimary,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 10,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  colorItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: 16,
  },

  colorCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  colorName: {
    fontSize: 10,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 6,
  },

  // ✅ gradient card only
  card: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },

  cardTitle: {
    color: COLORS.card,
    fontWeight: "600",
    marginBottom: 8,
  },

  cardInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    color: COLORS.card,
    marginBottom: 14,
  },

  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    justifyContent: "center",
  },

  galleryText: {
    color: COLORS.card,
    marginLeft: 6,
  },

  previewImage: {
    height: 80,
    borderRadius: 8,
    marginTop: 10,
  },

  nextButton: {
    margin: 16,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    bottom: 30,
  },

  nextText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  pickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
});