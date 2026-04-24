import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    ImageBackground,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../theme/colors";

export default function CustomerFindTailor() {
  const router = useRouter();
  const params = useLocalSearchParams();

  //////////////////////////////////////////////////
  // PARAMS
  //////////////////////////////////////////////////

  const colorName = (params.colorName as string) || "";
  const fabric = (params.fabric as string) || "";
  const referenceImage = (params.referenceImage as string) || "";
  const style = (params.style as string) || "";
  const measurements = (params.measurements as string) || "";
  const category = (params.category as string) || "";
  const type = (params.type as string) || "";

  //////////////////////////////////////////////////
  // STATE
  //////////////////////////////////////////////////

  const [deliveryDays, setDeliveryDays] = useState("");
  const [location, setLocation] = useState("");

  // ✅ NEW
  const [showCityPicker,setShowCityPicker] = useState(false);

  const cities = [
    "Lahore","Karachi","Islamabad","Rawalpindi",
    "Faisalabad","Multan","Gujranwala","Sialkot", "Gujrat",
    "Peshawar","Quetta","Frank faurt"
  ];

  //////////////////////////////////////////////////
  // BUTTON ANIMATION
  //////////////////////////////////////////////////

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  //////////////////////////////////////////////////
  // ACTION
  //////////////////////////////////////////////////

  const handleFind = () => {
    Keyboard.dismiss();

    const days = Number(deliveryDays);

    if (!location.trim()) {
      alert("Please select your city");
      return;
    }

    if (!deliveryDays.trim() || isNaN(days) || days <= 0) {
      alert("Enter valid delivery days");
      return;
    }

    router.push({
      pathname: "/(customer)/CustomerTailorResults",
      params: {
        city: location.trim(),
        deliveryDays: days.toString(),
        colorName,
        fabric,
        referenceImage,
        category,
        type,
        style,
        measurements,
      },
    });
  };

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <ImageBackground
      source={require("../../assets/images/bg.jpg")}
      style={styles.bg}
      blurRadius={6}
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.title}>Find Your Tailor</Text>

        {/* ✅ CITY PICKER */}
        <TouchableOpacity
          style={styles.inputWrap}
          onPress={()=>setShowCityPicker(true)}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={COLORS.textSecondary}
          />

          <Text style={[styles.input,{color: location ? COLORS.textPrimary : COLORS.textSecondary}]}>
            {location || "Select your city"}
          </Text>
        </TouchableOpacity>

        {/* DELIVERY INPUT */}
        <View style={styles.inputWrap}>
          <Ionicons
            name="time-outline"
            size={20}
            color={COLORS.textSecondary}
          />

          <TextInput
            placeholder="Delivery in days (e.g., 3)"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            value={deliveryDays}
            onChangeText={setDeliveryDays}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        {/* BUTTON */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleFind}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Find Tailor</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ✅ CITY MODAL */}
      <Modal visible={showCityPicker} transparent animationType="slide">
        <View style={{
          flex:1,
          backgroundColor:"rgba(0,0,0,0.5)",
          justifyContent:"flex-end"
        }}>
          <View style={{
            backgroundColor:"#fff",
            borderTopLeftRadius:20,
            borderTopRightRadius:20,
            padding:20,
            maxHeight:"60%"
          }}>
            <Text style={{fontWeight:"bold",fontSize:18,marginBottom:10}}>
              Select City
            </Text>

            <ScrollView>
              {cities.map((c,index)=>(
                <TouchableOpacity
                  key={index}
                  style={{
                    paddingVertical:12,
                    borderBottomWidth:1,
                    borderColor:"#eee"
                  }}
                  onPress={()=>{
                    setLocation(c);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={{fontSize:16}}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={()=>setShowCityPicker(false)}
              style={{marginTop:10,alignItems:"center"}}
            >
              <Text style={{color:"red"}}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
}

////////////////////////////////////////////////

const styles = StyleSheet.create({
  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 40,
    textAlign: "center",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    marginLeft: 10,
  },

  btn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});