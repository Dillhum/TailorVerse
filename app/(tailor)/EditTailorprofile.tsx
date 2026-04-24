import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { auth, database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

const CLOUD_NAME = "dcu5kjqfj";
const UPLOAD_PRESET = "tailor_unsigned";

type ServiceKey = "suit" | "bridal" | "urgent" | "alterations";

interface Service {
  selected: boolean;
  cost: { min: string; max: string };
}

type ServicesType = Record<ServiceKey, Service>;

interface FormType {
  fullName: string;
  shopName: string;
  city: string;
  phone: string;
  experience: string;
  deliveryTime: string;
  about: string;
  profileImage: string;
  services: ServicesType;
  workImages: string[];
}

export default function EditTailorProfile() {
  const user = auth.currentUser;

  const defaultServices: ServicesType = {
    suit: { selected: false, cost: { min: "", max: "" } },
    bridal: { selected: false, cost: { min: "", max: "" } },
    urgent: { selected: false, cost: { min: "", max: "" } },
    alterations: { selected: false, cost: { min: "", max: "" } },
  };

  const [form, setForm] = useState<FormType>({
    fullName: "",
    shopName: "",
    city: "",
    phone: "",
    experience: "",
    deliveryTime: "",
    about: "",
    profileImage: "",
    services: defaultServices,
    workImages: [],
  });

  const [uploading, setUploading] = useState(false);

  ////////////////////////////////////////////////////
  // LOAD PROFILE (SAFE MERGE – no crash)
  ////////////////////////////////////////////////////
  useEffect(() => {
    if (!user) return;

    const profileRef = ref(database, "Tailorusers/" + user.uid);

    const unsub = onValue(profileRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();

      setForm({
        fullName: data.fullName || "",
        shopName: data.shopName || "",
        city: data.city || "",
        phone: data.phone || "",
        experience: data.experience || "",
        deliveryTime: data.deliveryTime || "",
        about: data.about || "",
        profileImage: data.profileImage || "",
        workImages: data.workImages || [],

        services: {
          suit: {
            selected: data.services?.suit?.selected || false,
            cost: {
              min: data.services?.suit?.cost?.min || "",
              max: data.services?.suit?.cost?.max || "",
            },
          },
          bridal: {
            selected: data.services?.bridal?.selected || false,
            cost: {
              min: data.services?.bridal?.cost?.min || "",
              max: data.services?.bridal?.cost?.max || "",
            },
          },
          urgent: {
            selected: data.services?.urgent?.selected || false,
            cost: {
              min: data.services?.urgent?.cost?.min || "",
              max: data.services?.urgent?.cost?.max || "",
            },
          },
          alterations: {
            selected: data.services?.alterations?.selected || false,
            cost: {
              min: data.services?.alterations?.cost?.min || "",
              max: data.services?.alterations?.cost?.max || "",
            },
          },
        },
      });
    });

    return () => unsub();
  }, []);

  ////////////////////////////////////////////////////
  // CLOUDINARY UPLOAD
  ////////////////////////////////////////////////////
  const uploadToCloudinary = async (uri: string) => {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);
    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );

    const json = await res.json();
    if (!json.secure_url) throw new Error("Upload failed");
    return json.secure_url as string;
  };

  ////////////////////////////////////////////////////
  // IMAGE PICKERS
  ////////////////////////////////////////////////////
  const pickProfileImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    try {
      setUploading(true);
      const url = await uploadToCloudinary(result.assets[0].uri);
      setForm((p) => ({ ...p, profileImage: url }));
    } catch {
      Alert.alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const pickWorkImage = async () => {
    if (form.workImages.length >= 5) {
      Alert.alert("Maximum 5 images allowed");
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled) return;

    try {
      setUploading(true);
      const url = await uploadToCloudinary(result.assets[0].uri);
      setForm((p) => ({
        ...p,
        workImages: [...p.workImages, url],
      }));
    } catch {
      Alert.alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteWorkImage = (index: number) => {
    setForm((p) => ({
      ...p,
      workImages: p.workImages.filter((_, i) => i !== index),
    }));
  };

  ////////////////////////////////////////////////////
  // SAVE
  ////////////////////////////////////////////////////
  const handleSave = async () => {
    if (!user) return;

    await update(ref(database, "Tailorusers/" + user.uid), form);
    Alert.alert("Profile Updated!");
    router.replace("/Tailorprofile");
  };

  ////////////////////////////////////////////////////
  // LABELS
  ////////////////////////////////////////////////////
  const serviceLabels: Record<ServiceKey, string> = {
    suit: "Suit Stitching",
    bridal: "Bridal Wear",
    urgent: "Urgent Orders",
    alterations: "Alterations",
  };

  ////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            {/* PROFILE IMAGE */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <TouchableOpacity onPress={pickProfileImage}>
                <Image
                  source={
                    form.profileImage
                      ? { uri: form.profileImage }
                      : require("../../assets/images/avatar.jpg")
                  }
                  style={styles.avatar}
                />
                <View style={styles.camera}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={20}
                    color={COLORS.card}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* INPUTS */}
            <Input
              label="Full Name"
              icon="account"
              value={form.fullName}
              onChangeText={(t: string) =>
                setForm({ ...form, fullName: t })
              }
            />
            <Input
              label="Shop Name"
              icon="store"
              value={form.shopName}
              onChangeText={(t: string) =>
                setForm({ ...form, shopName: t })
              }
            />
            <Input
              label="City"
              icon="map-marker"
              value={form.city}
              onChangeText={(t: string) =>
                setForm({ ...form, city: t })
              }
            />
            <Input
              label="Phone"
              icon="phone"
              value={form.phone}
              onChangeText={(t: string) =>
                setForm({ ...form, phone: t })
              }
            />

            {/* SERVICES */}
            <Text style={styles.sectionTitle}>Services</Text>

            {(Object.keys(form.services) as ServiceKey[]).map((key) => (
              <View key={key} style={styles.serviceBox}>
                <TouchableOpacity
                  style={styles.serviceRow}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      services: {
                        ...prev.services,
                        [key]: {
                          ...prev.services[key],
                          selected: !prev.services[key].selected,
                        },
                      },
                    }))
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      form.services[key].selected
                        ? "checkbox-marked"
                        : "checkbox-blank-outline"
                    }
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text
                    style={{ marginLeft: 8, color: COLORS.textPrimary }}
                  >
                    {serviceLabels[key]}
                  </Text>
                </TouchableOpacity>

                {form.services[key].selected && (
                  <View style={styles.rangeContainer}>
                    <TextInput
                      placeholder="Min"
                      keyboardType="numeric"
                      value={form.services[key]?.cost?.min || ""}
                      onChangeText={(text: string) =>
                        setForm((prev) => ({
                          ...prev,
                          services: {
                            ...prev.services,
                            [key]: {
                              selected: true,
                              cost: {
                                min: text,
                                max:
                                  prev.services[key]?.cost?.max || "",
                              },
                            },
                          },
                        }))
                      }
                      style={styles.rangeInput}
                    />
                    <Text style={{ marginHorizontal: 8 }}>-</Text>
                    <TextInput
                      placeholder="Max"
                      keyboardType="numeric"
                      value={form.services[key]?.cost?.max || ""}
                      onChangeText={(text: string) =>
                        setForm((prev) => ({
                          ...prev,
                          services: {
                            ...prev.services,
                            [key]: {
                              selected: true,
                              cost: {
                                min:
                                  prev.services[key]?.cost?.min || "",
                                max: text,
                              },
                            },
                          },
                        }))
                      }
                      style={styles.rangeInput}
                    />
                  </View>
                )}
              </View>
            ))}

            {/* WORK IMAGES */}
            <Text style={styles.sectionTitle}>Work Images</Text>

            <FlatList
              data={form.workImages}
              horizontal
              keyExtractor={(item, index) => item + index}
              renderItem={({ item, index }) => (
                <View style={{ marginRight: 10 }}>
                  <Image
                    source={{ uri: item }}
                    style={styles.workImage}
                  />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteWorkImage(index)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingTop: 10 }}
              showsHorizontalScrollIndicator={false}
            />

            <TouchableOpacity
              style={styles.addWork}
              onPress={pickWorkImage}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={COLORS.primary}
              />
              <Text
                style={{
                  marginLeft: 6,
                  color: COLORS.primary,
                  fontWeight: "600",
                }}
              >
                Add Work Image
              </Text>
            </TouchableOpacity>

            {/* SAVE BUTTON (GRADIENT) */}
            <TouchableOpacity
              onPress={handleSave}
              style={{
                borderRadius: 10,
                overflow: "hidden",
                marginTop: 20,
              }}
            >
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.save}
              >
                <Text
                  style={{
                    color: COLORS.card,
                    fontWeight: "bold",
                  }}
                >
                  {uploading ? "Uploading..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////
// INPUT COMPONENT
////////////////////////////////////////////////
const Input = ({
  label,
  icon,
  value,
  onChangeText,
  multiline = false,
}: any) => (
  <View style={{ marginBottom: 15 }}>
    <Text
      style={{
        marginBottom: 5,
        fontWeight: "600",
        color: COLORS.textPrimary,
      }}
    >
      {label}
    </Text>
    <View style={styles.inputRow}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={COLORS.primary}
      />
      <TextInput
        style={[styles.input, multiline && { height: 80 }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </View>
  </View>
);

////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////
const styles = StyleSheet.create({
  container: { padding: 20 },

  avatar: { width: 130, height: 130, borderRadius: 65 },

  camera: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 6,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.card,
  },

  input: { flex: 1, padding: 10 },

  sectionTitle: {
    fontWeight: "bold",
    marginVertical: 10,
    color: COLORS.textPrimary,
  },

  serviceBox: {
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  serviceRow: { flexDirection: "row", alignItems: "center" },

  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    backgroundColor: COLORS.card,
  },

  workImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },

  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "red",
    borderRadius: 10,
    padding: 2,
  },

  addWork: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  save: {
    padding: 15,
    alignItems: "center",
  },
});