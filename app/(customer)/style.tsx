import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { off, onValue, ref } from "firebase/database";
import { database } from "../firebaseConfig";

import { COLORS } from "../theme/colors";

interface StyleItem {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  styles?: Record<string, StyleItem>;
}

interface Category {
  id: string;
  title: string;
  subcategories?: Record<string, SubCategory>;
}

export default function StyleSelect() {
  const router = useRouter();

  const params = useLocalSearchParams();

const colorName = Array.isArray(params.colorName)
  ? params.colorName[params.colorName.length - 1]
  : params.colorName;

const fabric = Array.isArray(params.fabric)
  ? params.fabric[params.fabric.length - 1]
  : params.fabric;

const referenceImage = params.referenceImage;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [selectedSub, setSelectedSub] =
    useState<SubCategory | null>(null);
  const [selectedStyle, setSelectedStyle] =
    useState<StyleItem | null>(null);

  // 🔥 animation refs
  const catAnim = useRef<Animated.Value[]>([]).current;
  const styleAnim = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    const styleRef = ref(database, "styles");

    const listener = onValue(styleRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setCategories(list);

        // 🔥 create animations
        catAnim.length = 0;
        list.forEach(() => catAnim.push(new Animated.Value(0)));

        Animated.stagger(
          80,
          catAnim.map((anim) =>
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            })
          )
        ).start();
      } else {
        setCategories([]);
      }
    });

    return () => off(styleRef, "value", listener);
  }, []);

  // 🔥 animate styles when subcategory changes
  useEffect(() => {
    if (!selectedSub?.styles) return;

    const list = Object.entries(selectedSub.styles);

    styleAnim.length = 0;
    list.forEach(() => styleAnim.push(new Animated.Value(0)));

    Animated.stagger(
      70,
      styleAnim.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [selectedSub]);

  const goNext = () => {
    if (!selectedCategory || !selectedSub || !selectedStyle) return;

    router.push({
      pathname: "/Measurement",
      params: {
        colorName,
        referenceImage,
        fabric,
        category: String(selectedCategory.title),
        type: String(selectedSub.name),
        style: String(selectedStyle.name),
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.heading}>Choose Your Style</Text>
      </View>

      {/* CATEGORY */}
      <Text style={styles.section}>Category</Text>

      <View style={styles.categoryRow}>
        {categories.map((cat, index) => {
          const anim = catAnim[index] || new Animated.Value(1);

          return (
            <Animated.View
              key={cat.id}
              style={{
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.categoryBtn,
                  selectedCategory?.id === cat.id &&
                    styles.activeCategory,
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setSelectedSub(null);
                  setSelectedStyle(null);
                }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory?.id === cat.id && {
                      color: COLORS.card,
                    },
                  ]}
                >
                  {cat.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* SUB CATEGORY */}
      {selectedCategory && (
        <>
          <Text style={styles.section}>Type</Text>

          <View style={styles.categoryRow}>
            {selectedCategory.subcategories &&
              Object.entries(
                selectedCategory.subcategories
              ).map(([id, sub], index) => {
                const anim = catAnim[index] || new Animated.Value(1);

                return (
                  <Animated.View
                    key={id}
                    style={{
                      opacity: anim,
                      transform: [
                        {
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[
                        styles.categoryBtn,
                        selectedSub?.id === id &&
                          styles.activeCategory,
                      ]}
                      onPress={() => {
                        setSelectedSub({
                          id,
                          name: sub.name,
                          styles: sub.styles,
                        });
                        setSelectedStyle(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedSub?.id === id && {
                            color: COLORS.card,
                          },
                        ]}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
          </View>
        </>
      )}

      {/* STYLES */}
      {selectedSub && (
        <>
          <Text style={styles.section}>Styles</Text>

          <View style={styles.styleGrid}>
            {selectedSub.styles &&
              Object.entries(selectedSub.styles).map(
                ([id, style], index) => {
                  const anim =
                    styleAnim[index] || new Animated.Value(1);

                  return (
                    <Animated.View
                      key={id}
                      style={{
                        opacity: anim,
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [25, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={[
                          styles.styleCard,
                          selectedStyle?.id === id &&
                            styles.activeStyle,
                        ]}
                        onPress={() => {
                          setSelectedStyle({
                            id,
                            name: style.name,
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.styleText,
                            selectedStyle?.id === id && {
                              color: COLORS.card,
                            },
                          ]}
                        >
                          {style.name}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }
              )}
          </View>
        </>
      )}

      {/* BUTTON */}
      <TouchableOpacity
        disabled={!selectedStyle}
        onPress={goNext}
        style={{ opacity: selectedStyle ? 1 : 0.5 }}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.nextBtn}
        >
          <Text style={styles.nextText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

//////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 70,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 30,
  },

  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  section: {
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.textPrimary,
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  categoryBtn: {
    backgroundColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  activeCategory: {
    backgroundColor: COLORS.primary,
  },

  categoryText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  styleCard: {
    backgroundColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  activeStyle: {
    backgroundColor: COLORS.primary,
  },

  styleText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  nextBtn: {
    marginTop: 40,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  nextText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});