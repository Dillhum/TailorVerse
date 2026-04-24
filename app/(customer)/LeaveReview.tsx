import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, push, ref, set } from "firebase/database";
import React, { useState } from "react";
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { COLORS } from "../theme/colors";

export default function LeaveReview() {

  const router = useRouter();
  const params = useLocalSearchParams();

  const orderId = params.orderId?.toString() || "";
  const tailorId = params.tailorId?.toString() || "";

  const customerName = params.customerName?.toString() || "Customer";
  const verified = params.verified?.toString() || "true";

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  //////////////////////////////////////////////////

  const submitReview = async () => {

    if (!user) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    if (!orderId || !tailorId) {
      Alert.alert("Error", "Missing order or tailor id");
      return;
    }

    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating");
      return;
    }

    try {

      const reviewRef = push(ref(db, "Reviews"));

      await set(reviewRef, {
        reviewId: reviewRef.key,
        orderId,
        customerId: user.uid,
        customerName,
        tailorId,
        rating,
        review: review || "",
        likes: 0,
        reply: "",
        verified: verified === "true",
        createdAt: Date.now()
      });

      Alert.alert("", "Thank you for your feedback!");

      setTimeout(() => {
        router.replace("/History");
      }, 2000);

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to submit review");
    }

  };

  //////////////////////////////////////////////////

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.heading}>
        Rate Your Tailor
      </Text>

      <Text style={styles.subHeading}>
        Your feedback helps other customers
      </Text>

      <View style={styles.starCard}>

        <Text style={styles.starTitle}>
          Tap to rate
        </Text>

        <View style={styles.stars}>

          {[1, 2, 3, 4, 5].map((s) => (

            <TouchableOpacity
              key={s}
              onPress={() => setRating(s)}
            >

              <MaterialCommunityIcons
                name={rating >= s ? "star" : "star-outline"}
                size={40}
                color={COLORS.accent} // ✅ FIXED
              />

            </TouchableOpacity>

          ))}

        </View>

      </View>

      <TextInput
        placeholder="Share your experience..."
        placeholderTextColor={COLORS.textSecondary}
        style={styles.input}
        multiline
        value={review}
        onChangeText={setReview}
      />

      <TouchableOpacity onPress={submitReview}>

        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]} // ✅ FIXED
          style={styles.btn}
        >

          <Text style={styles.btnText}>
            Submit Review
          </Text>

        </LinearGradient>

      </TouchableOpacity>

    </SafeAreaView>
  );

}

////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 25,
    backgroundColor: COLORS.background, // ✅ FIXED
    justifyContent: "center"
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.textPrimary // ✅ FIXED
  },

  subHeading: {
    textAlign: "center",
    marginBottom: 30,
    color: COLORS.textSecondary // ✅ FIXED
  },

  starCard: {
    backgroundColor: COLORS.card, // ✅ FIXED
    padding: 25,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 20,
    elevation: 4
  },

  starTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.textPrimary
  },

  stars: {
    flexDirection: "row"
  },

  input: {
    backgroundColor: COLORS.card, // ✅ FIXED
    borderRadius: 15,
    padding: 18,
    height: 120,
    marginBottom: 20,
    textAlignVertical: "top",
    elevation: 2,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  btn: {
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center"
  },

  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }

});