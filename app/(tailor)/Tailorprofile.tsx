import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

/* ================= TYPES ================= */

interface ServiceType {
  selected?: boolean;
  cost?: {
    min?: string;
    max?: string;
  } | string;
}

interface TailorProfileType {
  fullName?: string;
  shopName?: string;
  city?: string;
  phone?: string;
  experience?: string;
  deliveryTime?: string;
  about?: string;
  profileImage?: string;
  services?: {
    suit?: ServiceType;
    bridal?: ServiceType;
    urgent?: ServiceType;
    alterations?: ServiceType;
  };
  workImages?: string[];
}

interface ReviewType {
  rating: number;
  review: string;
}

export default function TailorProfile() {

  const [profile, setProfile] = useState<TailorProfileType | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  const user = auth.currentUser;

////////////////////////////////////////////////
// LOAD PROFILE
////////////////////////////////////////////////

  useEffect(() => {

    if (!user) return;

    const profileRef = ref(database, "Tailorusers/" + user.uid);

    const unsubscribe = onValue(profileRef, (snapshot) => {

      if (snapshot.exists()) {
        setProfile(snapshot.val());
      }

    });

    return () => unsubscribe();

  }, []);

////////////////////////////////////////////////
// LOAD REVIEWS
////////////////////////////////////////////////

  useEffect(() => {

    if (!user) return;

    const rRef = ref(database, "Reviews");

    const unsub = onValue(rRef, (snap) => {

      let list: any[] = [];
      let total = 0;

      snap.forEach((child) => {

        const data = child.val();

        if (data.tailorId === user.uid) {
          list.push(data);
          total += data.rating || 0;
        }

      });

      setReviews(list.reverse());

      if (list.length > 0) {
        setAvgRating(Number((total / list.length).toFixed(1)));
      } else {
        setAvgRating(0);
      }

    });

    return () => unsub();

  }, []);

////////////////////////////////////////////////

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

////////////////////////////////////////////////

  if (!profile)
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );

////////////////////////////////////////////////

  const serviceLabels: Record<string, string> = {
    suit: "Suit Stitching",
    bridal: "Bridal Wear",
    urgent: "Urgent Orders",
    alterations: "Alterations",
  };

////////////////////////////////////////////////
// UI
////////////////////////////////////////////////

  return (

    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* PROFILE IMAGE */}

        <View style={styles.avatarContainer}>
          <Image
            source={
              profile.profileImage
                ? { uri: profile.profileImage }
                : require("../../assets/images/avatar.jpg")
            }
            style={styles.avatar}
          />
        </View>

        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.shop}>{profile.shopName}</Text>

        {/* ⭐ RATING */}

        <Text style={styles.ratingHeader}>
          ⭐ {avgRating} ({reviews.length} Reviews)
        </Text>

        {/* ⭐ VIEW REVIEW PAGE BUTTON */}

       <TouchableOpacity
  onPress={() => router.push("/TailorReviews")}
  style={{ borderRadius: 10, overflow: "hidden", marginBottom: 15 }}
>
  <LinearGradient
    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
    style={styles.reviewPageBtn}
  >
    <MaterialCommunityIcons name="star-circle" size={20} color="#fff" />
    <Text style={styles.reviewPageText}>
      View Customer Reviews
    </Text>
  </LinearGradient>
</TouchableOpacity>

        {/* DETAILS */}

        <Section>
          <InfoRow icon="map-marker" text={profile.city} />
          <InfoRow icon="phone" text={profile.phone} />
          <InfoRow icon="briefcase" text={`${profile.experience || "0"} Years`} />
          <InfoRow icon="clock-outline" text={`Delivery: ${profile.deliveryTime || "Not set"}`} />
        </Section>

        {/* ABOUT */}

        <Section title="About">
          <Text>{profile.about || "No description added."}</Text>
        </Section>

////////////////////////////////////////////////
// SERVICES
////////////////////////////////////////////////

        <Section title="Services">

          {profile.services &&
            Object.entries(profile.services)
              .filter(([_, value]) => value?.selected)
              .map(([key, val]) => {

                let min = "";
                let max = "";

                if (typeof val?.cost === "string") {
                  min = val.cost;
                  max = val.cost;
                }

                if (typeof val?.cost === "object") {
                  min = val.cost?.min || "";
                  max = val.cost?.max || "";
                }

                return (
                  <View key={key} style={styles.serviceTag}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                    <Text style={styles.serviceText}>
                      {serviceLabels[key]} (Rs. {min} - {max})
                    </Text>
                  </View>
                );
              })}

        </Section>

////////////////////////////////////////////////
// WORK GALLERY
////////////////////////////////////////////////

        <Section title="Work Gallery">

          {(!profile.workImages || profile.workImages.length === 0) && (
            <Text>No work images uploaded yet.</Text>
          )}

          {profile.workImages && profile.workImages.length > 0 && (

            <FlatList
              data={profile.workImages}
              horizontal
              keyExtractor={(item, index) => item + index}
              contentContainerStyle={{ paddingTop: 10 }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.workImage} />
              )}
            />

          )}

        </Section>

////////////////////////////////////////////////
// CUSTOMER REVIEWS
////////////////////////////////////////////////

        <Section title="Customer Reviews">

          {reviews.length === 0 && (
            <Text>No reviews yet</Text>
          )}

          {reviews.map((r, i) => (
            <View key={i} style={styles.reviewCard}>

              <Text style={styles.rating}>
                {"⭐".repeat(r.rating)}
              </Text>

              <Text style={styles.reviewText}>
                {r.review}
              </Text>

            </View>
          ))}

        </Section>

////////////////////////////////////////////////

      <TouchableOpacity
  onPress={() => router.push("/EditTailorprofile")}
  style={{ borderRadius: 10, overflow: "hidden", marginBottom: 10 }}
>
  <LinearGradient
    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.editBtn}
  >
    <Text style={styles.btnText}>Edit Profile</Text>
  </LinearGradient>
</TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////

const InfoRow = ({ icon, text }: { icon: any; text?: string }) => (

  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
    <Text style={styles.infoText}>{text}</Text>
  </View>

);

const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (

  <View style={styles.section}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    {children}
  </View>

);

////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: { flex: 1, padding: 20, backgroundColor: COLORS.background,},

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  avatarContainer: { alignItems: "center", marginVertical: 20 },

  avatar: { width: 130, height: 130, borderRadius: 65 },

  name: { fontSize: 22, fontWeight: "bold", textAlign: "center" , color: COLORS.textPrimary},

 shop: {
  textAlign: "center",
  color: COLORS.textSecondary,
  marginBottom: 5
},

  ratingHeader: {
    textAlign: "center",
     color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: 10
  },

  reviewPageBtn:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"center",
    backgroundColor: COLORS.primary,
    padding:12,
    borderRadius:10,
    marginBottom:15
  },

  reviewPageText:{
   color: COLORS.card,
    fontWeight:"bold",
    marginLeft:6
  },

  section: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },

  sectionTitle: { fontWeight: "bold", marginBottom: 8 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },

  infoText: { marginLeft: 8, fontSize: 14 },

  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },

  serviceText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "600"
  },

  workImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10
  },

  reviewCard: {
   backgroundColor: COLORS.card,
  borderColor: COLORS.border,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    
  },

  rating: {
    fontSize: 16,
    marginBottom: 4
  },

  reviewText: {
    color: "#444"
  },

  editBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10
  },

  logoutBtn: {
    backgroundColor: COLORS.border,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  logoutText: { color: COLORS.textPrimary, fontWeight: "bold" }

});