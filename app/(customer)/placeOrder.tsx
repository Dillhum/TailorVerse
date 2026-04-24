import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStripe } from "@stripe/stripe-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, onValue, push, ref, set } from "firebase/database";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { COLORS } from "../theme/colors";

////////////////////////////////////////////////
// FLOATING INPUT (UNCHANGED)
////////////////////////////////////////////////

const FloatingInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  editable = true,
  onPress
}: any) => {

  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress}>
      <View style={{ marginTop: 14 }}>

        <Animated.Text
          style={{
            position: "absolute",
            left: 12,
            top: animated.interpolate({
              inputRange: [0, 1],
              outputRange: [18, -8],
            }),
            fontSize: animated.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 11],
            }),
            color: COLORS.textSecondary,
            backgroundColor: COLORS.card,
            paddingHorizontal: 4,
            zIndex: 1,
          }}
        >
          {label}
        </Animated.Text>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
        />

      </View>
    </TouchableOpacity>
  );
};

////////////////////////////////////////////////
// MAIN COMPONENT
////////////////////////////////////////////////

export default function PlaceOrder(){

const router = useRouter();
const params = useLocalSearchParams();
const user = getAuth().currentUser;
const db = getDatabase();

const { initPaymentSheet, presentPaymentSheet } = useStripe();

const tailorId = String(params.tailorId || "");
const tailorName = String(params.tailorName || "");
const category = String(params.category || "");
const colorName = String(params.colorName || "");
const fabric = String(params.fabric || "");
const style = String(params.style || "");
const referenceImage = String(params.referenceImage || "");
const priceRange = String(params.price || "");
const measurements = params.measurements ? JSON.parse(params.measurements as string) : {};

const [price,setPrice] = useState("");
const [name,setName] = useState(user?.displayName || "");
const [phone,setPhone] = useState("");
const [address,setAddress] = useState("");
const [city,setCity] = useState("");
const [deliveryDate,setDeliveryDate] = useState("");

const [showPicker,setShowPicker] = useState(false);
const [date,setDate] = useState(new Date());

const [paymentMethod,setPaymentMethod] = useState("COD");
const [loading,setLoading] = useState(false);
const [success,setSuccess] = useState(false);
const [tailorEmail,setTailorEmail] = useState("");
// ✅ ADD ONLY THIS
const [showCityPicker,setShowCityPicker] = useState(false);

const cities = [
  "Lahore","Karachi","Islamabad","Rawalpindi",
  "Faisalabad","Multan","Gujranwala","Sialkot",
  "Peshawar","Quetta"
];

////////////////////////////////////////////////
// AUTO LOAD USER
////////////////////////////////////////////////

// ✅ USER DATA
useEffect(()=>{
  if(!user) return;

  const userRef = ref(db,"users/"+user.uid);

  const unsubscribe = onValue(userRef,(snap)=>{
    const data = snap.val();
    if(data){
      setName(data.fullName || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setCity(data.city || "");
    }
  });

  return () => unsubscribe();

},[user]);

// ✅ TAILOR EMAIL
useEffect(()=>{
  if(!tailorId) return;

  const tRef = ref(db,"Tailorusers/"+tailorId);

  const unsubscribe = onValue(tRef,(snap)=>{
    const data = snap.val();
    if(data){
      setTailorEmail(data.email || "");
    }
  });

  return () => unsubscribe();

},[tailorId]);

////////////////////////////////////////////////
// DATE PICKER
////////////////////////////////////////////////

const onChangeDate = (event:any, selectedDate:any) => {
  setShowPicker(Platform.OS === "ios");
  if(selectedDate){
    setDate(selectedDate);
    const formatted = selectedDate.toISOString().split("T")[0];
    setDeliveryDate(formatted);
  }
};

////////////////////////////////////////////////
// STRIPE + ORDER (UNCHANGED)
////////////////////////////////////////////////

const fetchPaymentSheetParams = async () => {
const response = await fetch("http://192.168.100.36:5000/create-payment-intent",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({ amount:Number(price) })
});
const json = await response.json();
console.log("BACKEND RESPONSE:", json); // 👈 ADD THIS
return {  paymentIntent: json.paymentIntent,
  ephemeralKey: json.ephemeralKey,
  customer: json.customer };
};

const openPaymentSheet = async () => {
  try {
    console.log("OPEN SHEET CALLED");

    if(!price){
      Alert.alert("Enter price first");
      return;
    }

    const data = await fetchPaymentSheetParams();
    console.log("API RESPONSE:", data); // 👈 IMPORTANT

    const { paymentIntent, ephemeralKey, customer } = data;
     if(!paymentIntent || !ephemeralKey || !customer){
      Alert.alert("Payment setup failed");
      return;
    }

    const { error } = await initPaymentSheet({
      merchantDisplayName: "TailorVerse",
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
    });

    console.log("INIT ERROR:", error); // 👈 CHECK

    if(error){
      Alert.alert(error.message);
      return;
    }

    const { error: paymentError } = await presentPaymentSheet();

    console.log("PRESENT ERROR:", paymentError); // 👈 CHECK

    if(paymentError){
      Alert.alert(paymentError.message);
    } else {
      Alert.alert("Payment Success");
    }

  } catch(e){
    console.log("CATCH ERROR:", e);
    Alert.alert(String(e));
  }
};
////////////////////////////////////////////////
// EMAIL FUNCTION (ADD THIS)
const sendOrderEmails = async (orderData:any) => {
  try {

    // 📩 CUSTOMER EMAIL
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: "service_3z0ba1f",
        template_id: "template_301egqi",
        user_id: "U0MKRw9aSYLBIvB2m",
        template_params: {
          to_email: orderData.customerEmail,
          name: orderData.name,
          message: `Dear ${orderData.name},

Your order has been placed successfully 

Order Details:
Tailor: ${orderData.tailorName}
Category: ${orderData.category}
Fabric: ${orderData.fabric}
Style: ${orderData.style}
Price: ${orderData.price}
Delivery Date: ${orderData.deliveryDate}

`
        }
      }),
    });

    console.log("CUSTOMER EMAIL:", await res.text());

    // 📩 TAILOR EMAIL
    const res2 = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: "service_f119dql",
        template_id: "template_qln1e1g",
        user_id: "JYq5PoScSVLkM1fhd",
        template_params: {
          to_email: orderData.tailorEmail,
          name: orderData.tailorName,
          message: `New Order Received 

Customer Details:
Name: ${orderData.name}
Phone: ${orderData.phone}
Address: ${orderData.address}
City: ${orderData.city}

Order Details:
Category: ${orderData.category}
Fabric: ${orderData.fabric}
Style: ${orderData.style}
Price: ${orderData.price}
Delivery Date: ${orderData.deliveryDate}

Please login to your dashboard to manage this order.`
        }
      }),
    });

    console.log("TAILOR EMAIL:", await res2.text());

  } catch (error) {
    console.log("Email Error:", error);
  }
};
////////////////////////////////////////////////
// PLACE ORDER
////////////////////////////////////////////////

const handlePlaceOrder = async ()=>{

if(!name || !phone || !address || !city){
Alert.alert("Missing fields");
return;
}

const enteredPrice = Number(price);

if(isNaN(enteredPrice)){
Alert.alert("Enter valid number");
return;
}

let min = 0;
let max = Infinity;

if(priceRange.includes("-")){
[min, max] = priceRange.split("-").map(Number);
}else{
min = max = Number(priceRange);
}

if(enteredPrice < min || enteredPrice > max){
Alert.alert(`Price must be between ${min} and ${max}`);
return;
}

try{
setLoading(true);

const orderRef = push(ref(db,"Orders"));

await set(orderRef,{
orderId:orderRef.key,
customerId:user?.uid,
customerEmail: user?.email,
tailorId,
tailorName: tailorName || "Tailor",
category,
colorName,
fabric,
style,
referenceImage,
measurements,
name,
phone,
address,
city,
deliveryDate,
price:enteredPrice,
paymentMethod,
status:"new",
paymentStatus: paymentMethod==="Card"?"paid":"pending",
createdAt:Date.now()
});
// ✅ EMAIL DEBUG (optional but useful)
console.log("Customer Email:", user?.email);
console.log("Tailor Email:", tailorEmail);

// ✅ CHECK (IMPORTANT)
if(!user?.email){
  Alert.alert("Customer email missing");
  return;
}

if(!tailorEmail){
  Alert.alert("Tailor email missing");
  return;
}

// ✅ SEND EMAILS
await sendOrderEmails({
  customerEmail: user.email,
  tailorEmail: tailorEmail,
  name,
  phone,
  address,
  city,
  deliveryDate,
  category,
  fabric,
  style,
  price: enteredPrice,
  tailorName
});

setSuccess(true);
setTimeout(()=> router.replace("/Home"),2500);

}catch(e){
Alert.alert("Error");
}
finally{
setLoading(false);
}
};

////////////////////////////////////////////////
// UI
////////////////////////////////////////////////

return(

<SafeAreaView style={{flex:1,backgroundColor:COLORS.background}}>

<ScrollView contentContainerStyle={{padding:16,paddingBottom:120}}>

<Text style={styles.heading}>ORDER SUMMARY</Text>

<View style={styles.card}>
<Text style={styles.label}>Category</Text>
<Text style={styles.value}>{category}</Text>

<Text style={styles.label}>Color</Text>
<Text style={styles.value}>{colorName}</Text>

<Text style={styles.label}>Fabric</Text>
<Text style={styles.value}>{fabric}</Text>

<Text style={styles.label}>Style</Text>
<Text style={styles.value}>{style}</Text>

<Text style={styles.label}>Price Range</Text>
<Text style={styles.value}>{priceRange}</Text>

<FloatingInput
label={`Enter Price (${priceRange})`}
value={price}
onChangeText={setPrice}
keyboardType="numeric"
/>
</View>

<View style={styles.card}>
<Text style={styles.sectionTitle}>Delivery Details</Text>

<FloatingInput label="Full Name" value={name} onChangeText={setName}/>
<FloatingInput label="Phone" value={phone} onChangeText={setPhone}/>
<FloatingInput label="Address" value={address} onChangeText={setAddress}/>

{/* ✅ ONLY CHANGE */}
<FloatingInput
label="City"
value={city}
onChangeText={setCity}
editable={false}
onPress={()=>setShowCityPicker(true)}
/>

<FloatingInput
label="Delivery Date"
value={deliveryDate}
editable={false}
onPress={()=>setShowPicker(true)}
/>
</View>

{showPicker && (
<DateTimePicker
value={date}
mode="date"
display="default"
onChange={onChangeDate}
/>
)}

<View style={styles.card}>
<Text style={styles.sectionTitle}>Payment Method</Text>

{["COD","Card"].map(m=>(
<TouchableOpacity
key={m}
style={[styles.paymentOption, paymentMethod===m && styles.paymentSelected]}
onPress={()=>{
console.log("CARD CLICKED");
setPaymentMethod(m);
if(m==="Card"){ openPaymentSheet(); }
}}
>
<Text>{m}</Text>
{paymentMethod===m && (
<MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary}/>
)}
</TouchableOpacity>
))}
</View>

<TouchableOpacity onPress={handlePlaceOrder}>
<LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.orderBtn}>
<Text style={styles.orderText}>{loading ? "Placing..." : "Place Order"}</Text>
</LinearGradient>
</TouchableOpacity>

</ScrollView>

{/* ✅ CITY MODAL */}
<Modal visible={showCityPicker} transparent animationType="slide">
<View style={{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"flex-end"}}>
<View style={{backgroundColor:"#fff",borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,maxHeight:"60%"}}>
<Text style={{fontWeight:"bold",fontSize:18,marginBottom:10}}>Select City</Text>

<ScrollView>
{cities.map((c,index)=>(
<TouchableOpacity key={index} style={{paddingVertical:12,borderBottomWidth:1,borderColor:"#eee"}}
onPress={()=>{ setCity(c); setShowCityPicker(false); }}>
<Text style={{fontSize:16}}>{c}</Text>
</TouchableOpacity>
))}
</ScrollView>

<TouchableOpacity onPress={()=>setShowCityPicker(false)} style={{marginTop:10,alignItems:"center"}}>
<Text style={{color:"red"}}>Cancel</Text>
</TouchableOpacity>

</View>
</View>
</Modal>

{/* SUCCESS */}
<Modal visible={success} transparent>
<View style={styles.successContainer}>
<LottieView source={require("../../assets/animations/tailorCelebration.json")} autoPlay loop={false} style={{width:200,height:200}}/>
<Text style={styles.successText}>Order Placed Successfully</Text>
</View>
</Modal>

</SafeAreaView>
);
}

////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////

const styles = StyleSheet.create({
heading:{paddingTop:30,fontSize:22,fontWeight:"bold",marginBottom:20,color:COLORS.textPrimary},
card:{backgroundColor:COLORS.card,padding:16,borderRadius:12,marginBottom:16},
label:{fontWeight:"bold",marginTop:8,color:COLORS.primary},
value:{fontSize:15,color:COLORS.textPrimary},
sectionTitle:{fontWeight:"bold",fontSize:16,marginBottom:10,color:COLORS.primary},
input:{backgroundColor:COLORS.card,padding:12,borderRadius:8,borderWidth:1,borderColor:COLORS.border},
paymentOption:{flexDirection:"row",justifyContent:"space-between",padding:14,backgroundColor:COLORS.background,borderRadius:10,marginTop:10},
paymentSelected:{borderWidth:2,borderColor:COLORS.primary},
orderBtn:{padding:16,borderRadius:12,alignItems:"center"},
orderText:{color:"#fff",fontWeight:"bold",fontSize:16},
successContainer:{flex:1,backgroundColor:"rgba(0,0,0,0.7)",justifyContent:"center",alignItems:"center"},
successText:{color:"#fff",fontSize:20,fontWeight:"bold",marginTop:10}
});