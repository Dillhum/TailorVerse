import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

type Review = {
  reviewId: string;
  customerName: string;
  rating: number;
  review: string;
  likes: number;
  likedBy?: { [key: string]: boolean };
  reply?: string;
  verified?: boolean;
  tailorId?: string;
};

export default function TailorReviews() {
  const user = getAuth().currentUser;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [editing, setEditing] = useState<{ [key: string]: boolean }>({});

  ////////////////////////////////////////////////
  // ✅ SIMPLE SAFE ONE-TIME ANIMATION
  ////////////////////////////////////////////////

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  ////////////////////////////////////////////////
  // LOAD REVIEWS
  ////////////////////////////////////////////////

  useEffect(() => {
    if (!user) return;

    const rRef = ref(database, "Reviews");

    onValue(rRef, (snap) => {
      let list: Review[] = [];

      snap.forEach((child) => {
        const data = child.val();

        if (data.tailorId === user.uid) {
          list.push({
            ...data,
            reviewId: child.key,
          });
        }
      });

      setReviews(list.reverse());
    });
  }, []);

  ////////////////////////////////////////////////
  // LIKE
  ////////////////////////////////////////////////

  const likeComment = (item: Review) => {
    if (!user) return;

    const alreadyLiked = item.likedBy?.[user.uid];
    const rRef = ref(database, "Reviews/" + item.reviewId);

    update(rRef, {
      [`likedBy/${user.uid}`]: alreadyLiked ? null : true,
      likes: alreadyLiked
        ? (item.likes || 1) - 1
        : (item.likes || 0) + 1,
    });
  };

  ////////////////////////////////////////////////
  // SEND REPLY
  ////////////////////////////////////////////////

  const sendReply = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text) return;

    update(ref(database, "Reviews/" + reviewId), { reply: text });

    setReplyText((prev) => ({ ...prev, [reviewId]: "" }));
    setEditing((prev) => ({ ...prev, [reviewId]: false }));
  };

  ////////////////////////////////////////////////
  // EDIT REPLY
  ////////////////////////////////////////////////

  const startEdit = (item: Review) => {
    setReplyText((prev) => ({
      ...prev,
      [item.reviewId]: item.reply || "",
    }));

    setEditing((prev) => ({
      ...prev,
      [item.reviewId]: true,
    }));
  };

  ////////////////////////////////////////////////
  // CARD UI
  ////////////////////////////////////////////////

  const renderItem = ({ item }: any) => {
    const liked = item.likedBy?.[user?.uid || ""];

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.customer}>
              {item.customerName?.trim()
                ? item.customerName
                : "Anonymous"}
            </Text>

            {item.verified && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.rating}>{"⭐".repeat(item.rating)}</Text>

          <Text style={styles.review}>{item.review}</Text>

          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => likeComment(item)}
          >
            <MaterialCommunityIcons
              name={liked ? "thumb-up" : "thumb-up-outline"}
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.likeText}>
              Like ({item.likes || 0})
            </Text>
          </TouchableOpacity>

          {item.reply && !editing[item.reviewId] ? (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>Your Reply</Text>
              <Text style={styles.replyText}>{item.reply}</Text>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => startEdit(item)}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={16}
                  color={COLORS.card}
                />
                <Text style={{ color: COLORS.card, marginLeft: 4 }}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <TextInput
                placeholder="Reply..."
                style={styles.input}
                value={replyText[item.reviewId] || ""}
                onChangeText={(t) =>
                  setReplyText((prev) => ({
                    ...prev,
                    [item.reviewId]: t,
                  }))
                }
              />

              <TouchableOpacity onPress={() => sendReply(item.reviewId)}>
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.replyBtn}
                >
                  <Text style={{ color: COLORS.card, fontWeight: "600" }}>
                    Send Reply
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  ////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Customer Reviews</Text>

      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.reviewId}
        contentContainerStyle={{ padding: 20 }}
      />
    </SafeAreaView>
  );
}

////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  heading: {
    paddingTop:30,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
    color: COLORS.textPrimary,
  },

  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  customer: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  badge: {
    backgroundColor: "#DCFCE7",
    padding: 4,
    borderRadius: 6,
  },

  badgeText: {
    color: "#166534",
    fontSize: 11,
  },

  rating: { marginTop: 5 },

  review: {
    marginTop: 5,
    color: COLORS.textSecondary,
  },

  likeBtn: {
    flexDirection: "row",
    marginTop: 8,
  },

  likeText: {
    marginLeft: 6,
    color: COLORS.primary,
  },

  replyBox: {
    backgroundColor: "#F9F6F2",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  replyLabel: {
    fontWeight: "bold",
    color: COLORS.primary,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
  },

  replyBtn: {
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },

  editBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
});