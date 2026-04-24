import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, onValue, ref, set } from "firebase/database";
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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../theme/colors";

export default function Home(){
  const [selectedTailor,setSelectedTailor] = useState<any>(null);
const [tailorError, setTailorError] = useState("");
const [complaintError, setComplaintError] = useState("");
const auth = getAuth();
const db = getDatabase();
const router = useRouter();
const [tailorNameInput, setTailorNameInput] = useState("");

const fadeAnim = useRef(new Animated.Value(0)).current;
const [complaintModal, setComplaintModal] = useState(false);
const [complaintText, setComplaintText] = useState("");
const [userName,setUserName] = useState("Customer");
const [unreadCount,setUnreadCount] = useState(0);
const [currentOrder,setCurrentOrder] = useState<any>(null);
const [myTailors,setMyTailors] = useState<any[]>([]);
const [showDropdown,setShowDropdown] = useState(false);

////////////////////////////////////////////////
// LOAD USER + CHAT + ORDER
////////////////////////////////////////////////

useEffect(()=>{

Animated.timing(fadeAnim,{
  toValue:1,
  duration:800,
  useNativeDriver:true
}).start();

const unsubscribeAuth = onAuthStateChanged(auth,(user:User|null)=>{

if(!user){
setUserName("Customer");
setUnreadCount(0);
setCurrentOrder(null);
return;
}

setUserName(user.displayName || "Customer");

const orderRef = ref(db,"Orders");

onValue(orderRef,(snapshot)=>{

let active:any = null;
let tailorList:any[] = [];

snapshot.forEach(child=>{
const data = child.val();

// current order
if(data.customerId === user.uid && data.status !== "completed"){
  active = data;
}

// ALL TAILORS
if(data.customerId === user.uid){
  tailorList.push({
    tailorId: data.tailorId,
    tailorName: data.tailorName || "Tailor",
    orderId: data.orderId
  });
}
});

setCurrentOrder(active);

// remove duplicates
const uniqueTailors = Array.from(
new Map(tailorList.map(t=>[t.tailorId,t])).values()
);

setMyTailors(uniqueTailors);

});

const chatRef = ref(db,"Chats");

onValue(chatRef,(snapshot)=>{
let totalUnread = 0;

snapshot.forEach((child)=>{
const data = child.val();

if(data.customerId === user.uid){

  // 🔥 ensure number
  const unread = Number(data.unreadCustomer || 0);

  totalUnread += unread;
}

});

setUnreadCount(totalUnread);
});

});

return ()=> unsubscribeAuth();

},[]);

////////////////////////////////////////////////
// UI
////////////////////////////////////////////////

return(

<SafeAreaView style={styles.container}>

<Animated.View style={{flex:1,opacity:fadeAnim}}>

<ScrollView showsVerticalScrollIndicator={false}>

{/* HEADER */}

<View style={styles.header}>

<View>
<Text style={styles.greeting}>Welcome,</Text>
<Text style={styles.name}>{userName}</Text>
</View>

<View style={styles.rightHeader}>

<TouchableOpacity
style={styles.chatIconWrapper}
activeOpacity={0.7}
onPress={()=>router.push("/CustomerChatList")}
>

<MaterialCommunityIcons
name="chat-processing-outline"
size={24}
color={COLORS.primary}
/>

{unreadCount>0 && (
<View style={styles.chatBadge}>
<Text style={styles.chatBadgeText}>{unreadCount}</Text>
</View>
)}

</TouchableOpacity>

<View style={styles.logoWrapper}>
<Image
source={require("../../assets/images/app-logo.png")}
style={styles.logo}
/>
</View>

</View>

</View>

{/* CURRENT ORDER */}

<View style={styles.card}>

<Text style={styles.sectionTitle}>CURRENT ORDER</Text>

{currentOrder ? (
<>
<Text style={styles.orderTitle}>{currentOrder.style}</Text>
<Text style={styles.orderId}>#{currentOrder.orderId}</Text>

<View style={styles.progressRow}>
<Text style={styles.progressActive}>{currentOrder.status}</Text>
<View style={styles.progressLine}/>
<Text style={styles.progressInactive}>Completed</Text>
</View>
</>
):( 
<Text style={{marginTop:10,color:COLORS.textSecondary}}>
No Active Order
</Text>
)}

</View>

{/* TRENDING */}

<View style={styles.sectionHeader}>
<Text style={styles.sectionMain}>Trending Designs</Text>
<TouchableOpacity onPress={() => router.push("/Viewall")}>
  <Text style={styles.viewAll}>VIEW ALL</Text>
</TouchableOpacity>
</View>

<ScrollView horizontal showsHorizontalScrollIndicator={false}>

<Image source={require("../../assets/images/S1.jpeg")} style={styles.designImage}/>
<Image source={require("../../assets/images/S2.jpeg")} style={styles.designImage}/>
<Image source={require("../../assets/images/S3.jpeg")} style={styles.designImage}/>

</ScrollView>

{/* START ORDER */}

<TouchableOpacity
activeOpacity={0.85}
onPress={()=>router.push("/selectcolor")}
>

<LinearGradient
colors={[COLORS.gradientStart, COLORS.gradientEnd]}
start={{x:0,y:0}}
end={{x:1,y:1}}
style={styles.startOrderCard}
>

<View style={styles.startOrderContent}>
<Text style={styles.startOrderTitle}>Start Your Order</Text>
<Text style={styles.startOrderDesc}>
Click here to begin your order and get your tailor-made outfit!
</Text>
</View>

<MaterialCommunityIcons
name="shopping-outline"
size={36}
color="#fff"
/>

</LinearGradient>

</TouchableOpacity>
<TouchableOpacity
  style={styles.complaintCard}
  activeOpacity={0.85}
  onPress={() => setComplaintModal(true)}
>
  <MaterialCommunityIcons name="alert-circle-outline" size={26} color="#fff" />

  <View style={{ marginLeft: 10, flex: 1 }}>
    <Text style={styles.complaintTitle}>Need Help?</Text>
    <Text style={styles.complaintDesc}>
      Send complaint or feedback to admin
    </Text>
  </View>
</TouchableOpacity>
<View style={{height:110}}/>

</ScrollView>

<Modal visible={complaintModal} transparent animationType="fade">
  <TouchableOpacity
    activeOpacity={1}
    style={styles.modalOverlay}
    onPress={() => setComplaintModal(false)}
  >
    <TouchableOpacity activeOpacity={1} style={styles.complaintModalBox}>

      {/* ❌ CLOSE BUTTON */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setComplaintModal(false)}
      >
        <MaterialCommunityIcons name="close" size={22} color="#333" />
      </TouchableOpacity>

      <Text style={styles.modalHeading}>Submit Complaint</Text>

      {/* ✅ TAILOR NAME */}
      {/* SELECT TAILOR */}

<TouchableOpacity
onPress={()=>setShowDropdown(!showDropdown)}
style={[
  styles.tailorInput,
  tailorError && { borderColor: "red" }
]}
>

<View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>

<Text style={{color:selectedTailor ? "#000" : "#999"}}>
{selectedTailor ? selectedTailor.tailorName : "Select Tailor"}
</Text>

<MaterialCommunityIcons 
  name={showDropdown ? "chevron-up" : "chevron-down"} 
  size={20} 
  color="#666"
/>

</View>

</TouchableOpacity>
{showDropdown && (
<ScrollView style={{maxHeight:120, marginBottom:10}}>

{myTailors.map((t,i)=>(

<TouchableOpacity
key={i}
onPress={()=>{
  setSelectedTailor(t);
  setTailorError("");
  setShowDropdown(false); // 🔥 close dropdown
}}
style={{
  padding:10,
  borderBottomWidth:1,
  borderColor:"#eee",
  backgroundColor:
    selectedTailor?.tailorId === t.tailorId ? "#eee" : "#fff"
}}
>

<Text>{t.tailorName}</Text>

</TouchableOpacity>

))}

</ScrollView>
)}
      {tailorError ? (
        <Text style={styles.errorText}>{tailorError}</Text>
      ) : null}

      {/* ✅ COMPLAINT */}
      <TextInput
        placeholder="Write your complaint..."
        value={complaintText}
        onChangeText={(text) => {
          setComplaintText(text);
          setComplaintError("");
        }}
        multiline
        style={[
          styles.complaintInput,
          { height: 100 },
          complaintError && { borderColor: "red" }
        ]}
      />

      {complaintError ? (
        <Text style={styles.errorText}>{complaintError}</Text>
      ) : null}

      {/* ✅ SUBMIT */}
      <TouchableOpacity
        style={styles.sendBtn}
        onPress={async () => {

          let valid = true;

       if (!selectedTailor) {
  setTailorError("Please select a tailor");
  valid = false;
}

          if (!complaintText.trim()) {
            setComplaintError("Complaint is required");
            valid = false;
          }

          if (!valid) return;

          const user = auth.currentUser;

          await set(ref(db, "Complaints/" + Date.now()), {
            text: complaintText,
     tailorId: selectedTailor?.tailorId,
tailorName: selectedTailor?.tailorName,
            userId: user?.uid,
            userName: user?.displayName || "Customer",
            createdAt: Date.now(),
          });

          // ✅ RESET
          setComplaintText("");
         setSelectedTailor(null);
          setTailorError("");
          setComplaintError("");
          setComplaintModal(false);

          // ✅ SUCCESS ALERT
          Alert.alert(
            "Success ✅",
            "Your complaint has been sent successfully"
          );
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          Submit Complaint
        </Text>
      </TouchableOpacity>

    </TouchableOpacity>
  </TouchableOpacity>
</Modal>
{/* BOTTOM TAB */}
<View style={styles.bottomTab}>
<TabItem icon="home-variant" label="Home" onPress={()=>router.push("/Home")}/>
<TabItem icon="ruler-square" label="Measurements" onPress={()=>router.push("/measuremnt")}/>
<TabItem icon="clipboard-text" label="Orders" onPress={()=>router.push("/order")}/>
<TabItem icon="history" label="History" onPress={()=>router.push("/History")}/>
</View>

</Animated.View>

</SafeAreaView>

);

}

////////////////////////////////////////////////
// TAB ITEM
////////////////////////////////////////////////

function TabItem({icon,label,onPress}:any){
return(
<TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
<MaterialCommunityIcons name={icon} size={24} color={COLORS.primary}/>
<Text style={styles.tabText}>{label}</Text>
</TouchableOpacity>
);
}

////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:COLORS.background
},

header:{
flexDirection:"row",
justifyContent:"space-between",
paddingHorizontal:20,
paddingTop:10,
paddingBottom:20,
alignItems:"center",
borderBottomWidth:1,
borderBottomColor:COLORS.border
},

rightHeader:{
flexDirection:"row",
alignItems:"center"
},

chatIconWrapper:{
marginRight:12,
backgroundColor:COLORS.card,
padding:8,
borderRadius:20,
elevation:3
},

chatBadge:{
position:"absolute",
top:-4,
right:-4,
backgroundColor:COLORS.primary,
borderRadius:10,
minWidth:18,
height:18,
justifyContent:"center",
alignItems:"center"
},

chatBadgeText:{
color:"#fff",
fontSize:10,
fontWeight:"700"
},

greeting:{fontSize:18,color:COLORS.textSecondary},
name:{fontSize:26,fontWeight:"bold",color:COLORS.textPrimary},

logoWrapper:{
width:50,
height:50,
borderRadius:25,
backgroundColor:COLORS.card,
justifyContent:"center",
alignItems:"center",
elevation:3
},

logo:{width:70,height:70,resizeMode:"contain"},

card:{
backgroundColor:COLORS.card,
marginHorizontal:20,
borderRadius:20,
padding:18,
marginBottom:20,

shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:10,
shadowOffset:{width:0,height:4},
elevation:5
},

sectionTitle:{color:COLORS.textSecondary,fontSize:12},

orderTitle:{fontSize:20,fontWeight:"bold",color:COLORS.textPrimary},

orderId:{color:COLORS.textSecondary,marginBottom:15},

progressRow:{flexDirection:"row",alignItems:"center"},

progressActive:{color:COLORS.primary,fontWeight:"bold"},

progressLine:{
flex:1,
height:2,
backgroundColor:COLORS.border,
marginHorizontal:10
},

progressInactive:{color:COLORS.border},

sectionHeader:{
flexDirection:"row",
justifyContent:"space-between",
marginHorizontal:20,
marginTop:10,
marginBottom:10
},
errorText: {
  color: "red",
  fontSize: 12,
  marginBottom: 8,
  marginLeft: 4
},

sectionMain:{
fontSize:20,
fontWeight:"bold",
color:COLORS.textPrimary
},

viewAll:{color:COLORS.primary},

designImage:{
width:150,
height:200,
borderRadius:20,
marginLeft:20,

shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:8,
shadowOffset:{width:0,height:4},
elevation:5
},

startOrderCard:{
borderRadius:20,
flexDirection:"row",
alignItems:"center",
padding:18,
marginTop:20,
justifyContent:"space-between",
marginHorizontal:20,
elevation:6
},

startOrderContent:{flex:1},

startOrderTitle:{
color:"#fff",
fontSize:18,
fontWeight:"bold"
},

startOrderDesc:{color:"#fff",fontSize:14},

bottomTab:{
position:"absolute",
bottom:10,
left:15,
right:15,

flexDirection:"row",
justifyContent:"space-around",
paddingVertical:12,

backgroundColor:COLORS.card,
borderRadius:30,

shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
shadowOffset:{width:0,height:5},
elevation:10
},

tabItem:{alignItems:"center"},

tabText:{
fontSize:12,
color:COLORS.primary,
marginTop:4
},
complaintCard: {
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: 20,
  marginTop: 15,
  padding: 16,
  borderRadius: 20,
  backgroundColor: "#ff7043",
  elevation: 5
},

complaintTitle: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold"
},

complaintDesc: {
  color: "#fff",
  fontSize: 12
},

complaintModalBox: {
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 20,
  width: "85%"
},

modalHeading: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 10
},

complaintInput: {
  height: 100,
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 10,
  marginBottom: 15,
  textAlignVertical: "top"
},

sendBtn: {
  backgroundColor: COLORS.primary,
  padding: 12,
  borderRadius: 10,
  alignItems: "center"
},
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center"
},
tailorInput: {
  height: 50,
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  paddingHorizontal: 12,
  marginBottom: 12,
  fontSize: 14
},

closeBtn: {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 20,
  backgroundColor: "#f2f2f2",
  borderRadius: 20,
  padding: 4
},
});