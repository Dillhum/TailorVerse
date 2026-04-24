import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

type Service = {
  selected?: boolean;
  cost?: any;
};

type Tailor = {
  id: string;
  fullName?: string;
  shopName?: string;
  city?: string;
  phone?: string;
  experience?: string;
  deliveryTime?: string;
  about?: string;
  profileImage?: string;
  profileImg?: string;
  services?: { [key: string]: Service };
  workImages?: string[];
};

type Review = {
  reviewId: string;
  rating: number;
  review: string;
  likes: number;
  reply?: string;
  tailorId?: string;
  customerName?: string;
  verified?: boolean;
  likedBy?: { [key: string]: boolean };
};

export default function CustomerTailorProfile() {

const router = useRouter();
const params = useLocalSearchParams();
const user = getAuth().currentUser;

const tailorId = (params.tailorId as string) || "";

const colorName = (params.colorName as string) || "";
const fabric = (params.fabric as string) || "";
const referenceImage = (params.referenceImage as string) || "";
const style = (params.style as string) || "";
const measurements = (params.measurements as string) || "";
const category = (params.category as string) || "";

const [tailor,setTailor] = useState<Tailor|null>(null);
const [availability,setAvailability] = useState<any>(null);
const [selectedService,setSelectedService] = useState<any>(null);

const [reviews,setReviews] = useState<Review[]>([]);
const [avgRating,setAvgRating] = useState(0);

const [ratingCount,setRatingCount] = useState<Record<number,number>>({
1:0,2:0,3:0,4:0,5:0
});

const [selectedImage,setSelectedImage] = useState<string|null>(null);

////////////////////////////////////////////////
// LOAD TAILOR
////////////////////////////////////////////////

useEffect(()=>{

if(!tailorId) return;

const tRef = ref(database,"Tailorusers/"+tailorId);

const unsub1 = onValue(tRef,(snap)=>{
if(snap.exists()){
setTailor({id:tailorId,...snap.val()});
}
});

const aRef = ref(database,"tailorAvailability/"+tailorId);

const unsub2 = onValue(aRef,(snap)=>{
setAvailability(snap.val());
});

return ()=>{
unsub1();
unsub2();
}

},[tailorId]);

////////////////////////////////////////////////
// LOAD REVIEWS
////////////////////////////////////////////////

useEffect(()=>{

if(!tailorId) return;

const rRef = ref(database,"Reviews");

onValue(rRef,(snap)=>{

let list:Review[]=[];
let total=0;

let counts:Record<number,number>={1:0,2:0,3:0,4:0,5:0};

snap.forEach(child=>{

const data = child.val();

if(data.tailorId===tailorId){

list.push({...data,reviewId:child.key});
total += data.rating || 0;
counts[data.rating]++;

}

});

setReviews(list.reverse());
setRatingCount(counts);

if(list.length>0){
setAvgRating(Number((total/list.length).toFixed(1)));
}else{
setAvgRating(0);
}

});

},[tailorId]);

////////////////////////////////////////////////
// LIKE TOGGLE
////////////////////////////////////////////////

const likeReview=(r:Review)=>{
if(!user) return;

const alreadyLiked = r.likedBy?.[user.uid];
const rRef = ref(database,"Reviews/"+r.reviewId);

if(alreadyLiked){
update(rRef,{[`likedBy/${user.uid}`]:null,likes:(r.likes || 1)-1});
}else{
update(rRef,{[`likedBy/${user.uid}`]:true,likes:(r.likes || 0)+1});
}
};

////////////////////////////////////////////////
// CHAT
////////////////////////////////////////////////

const openChat=()=>{
if(!tailor) return;

router.push({
pathname:"/(customer)/CustomerChatList",
params:{
tailorId:tailor.id,
tailorName:tailor.fullName || "",
tailorImage:tailor.profileImage || tailor.profileImg || "",
tailorPhone:tailor.phone || "",
category,
},
});
};

////////////////////////////////////////////////
// PLACE ORDER
////////////////////////////////////////////////

const placeOrder = () => {

if(!tailor) return;

if(!selectedService){
alert("Please select a service first");
return;
}

let priceRange = "";

if(typeof selectedService.cost === "object"){
priceRange = `${selectedService.cost.min}-${selectedService.cost.max}`;
}else{
priceRange = selectedService.cost;
}

router.push({
pathname:"/(customer)/placeOrder",
params:{
tailorId:tailor.id,
tailorName: tailor.fullName || tailor.shopName || "Tailor",
colorName,
fabric,
referenceImage,
style,
measurements,
category,
price:priceRange,
},
});

};

////////////////////////////////////////////////

if(!tailor){
return(
<SafeAreaView style={styles.center}>
<Text>Loading...</Text>
</SafeAreaView>
)
}

const serviceLabels:Record<string,string>={
suit:"Suit Stitching",
bridal:"Bridal Wear",
urgent:"Urgent Orders",
alterations:"Alterations",
};

const fmt=(iso?:string)=>
iso
? new Date(iso).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit",
})
:"";

////////////////////////////////////////////////
// UI
////////////////////////////////////////////////

return(

<SafeAreaView style={{flex:1,backgroundColor:COLORS.background,paddingTop:40}}>

<ScrollView contentContainerStyle={{paddingBottom:40}}>

<View style={styles.header}>

<Image
source={
tailor.profileImage || tailor.profileImg
? {uri:tailor.profileImage || tailor.profileImg}
: require("../../assets/images/avatar.jpg")
}
style={styles.avatar}
/>

<View style={{marginLeft:12,flex:1}}>

<Text style={styles.name}>{tailor.fullName}</Text>
<Text style={styles.shop}>{tailor.shopName}</Text>

<Text style={styles.rating}>
⭐ {avgRating} ({reviews.length} Reviews)
</Text>

<Text style={styles.info}>{tailor.city}</Text>
<Text style={styles.info}>{tailor.phone}</Text>
<Text style={styles.info}>{tailor.experience} Years Experience</Text>
<Text style={styles.info}>Delivery: {tailor.deliveryTime} days</Text>

</View>

<TouchableOpacity onPress={openChat} style={styles.chatIcon}>
<MaterialCommunityIcons name="chat" size={28} color="#fff"/>
</TouchableOpacity>

</View>

{/* SERVICES */}
<View style={styles.section}>
<Text style={styles.sectionTitle}>Services</Text>

<View style={styles.servicesRow}>
{tailor.services &&
Object.entries(tailor.services)
.filter(([_,v])=>v?.selected)
.map(([key,val])=>(

<TouchableOpacity
key={key}
style={[
styles.tag,
selectedService?.key === key && {backgroundColor:COLORS.primary},
]}
onPress={()=>setSelectedService({ ...val, key })}
>

<View style={{flexDirection:"row",alignItems:"center"}}>

{selectedService?.key === key && (
<MaterialCommunityIcons name="check-circle" size={14} color="#fff" style={{marginRight:4}}/>
)}

<Text style={styles.tagText}>
{serviceLabels[key]} (
{typeof val.cost==="object"
? `${val.cost?.min || ""} - ${val.cost?.max || ""}`
: val.cost}
)
</Text>

</View>

</TouchableOpacity>

))}
</View>
</View>

{/* WORK GALLERY */}
<View style={styles.section}>
<Text style={styles.sectionTitle}>Work Gallery</Text>

<FlatList
horizontal
data={tailor.workImages || []}
keyExtractor={(item,index)=>index.toString()}
renderItem={({item})=>(
<TouchableOpacity onPress={()=>setSelectedImage(item)}>
<Image source={{uri:item}} style={styles.workImg}/>
</TouchableOpacity>
)}
/>
</View>

{/* REVIEWS */}
<View style={styles.section}>
<Text style={styles.sectionTitle}>Customer Reviews</Text>

{reviews.map((r,i)=>{

const liked = r.likedBy?.[user?.uid || ""];

return(
<View key={i} style={styles.reviewCard}>

<View style={{flexDirection:"row",alignItems:"center"}}>
<Text style={{fontWeight:"bold"}}>
{r.customerName || "Customer"}
</Text>

{r.verified && (
<View style={styles.badge}>
<Text style={styles.badgeText}>Verified</Text>
</View>
)}
</View>

<Text>{"⭐".repeat(r.rating)}</Text>
<Text>{r.review}</Text>

{r.reply && (
<Text style={styles.reply}>
Tailor: {r.reply}
</Text>
)}

<TouchableOpacity style={styles.likeBtn} onPress={()=>likeReview(r)}>
<MaterialCommunityIcons
name={liked ? "thumb-up" : "thumb-up-outline"}
size={16}
color={COLORS.primary}
/>
<Text style={{marginLeft:5}}>
Helpful ({r.likes || 0})
</Text>
</TouchableOpacity>

</View>
)
})}
</View>

{/* AVAILABILITY */}
{availability && (
<View style={styles.availabilityCard}>
<MaterialCommunityIcons name="calendar-check" size={20} color="#fff"/>
<View style={{marginLeft:8}}>
<Text style={styles.availText}>
Accepting Orders: {availability.acceptingOrders ? "Yes":"No"}
</Text>
<Text style={styles.availText}>
Working Hours: {fmt(availability.startTime)} - {fmt(availability.endTime)}
</Text>
<Text style={styles.availText}>
Weekly Off: {availability.weeklyOff?.length
? availability.weeklyOff.join(", ")
:"None"}
</Text>
</View>
</View>
)}

{/* BUTTON */}
<TouchableOpacity style={{marginHorizontal:16,marginTop:20}} onPress={placeOrder}>
<LinearGradient
colors={[COLORS.gradientStart, COLORS.gradientEnd]}
style={styles.placeOrderBtn}
>
<Text style={styles.placeOrderText}>Place Order</Text>
</LinearGradient>
</TouchableOpacity>

</ScrollView>

<Modal visible={!!selectedImage} transparent>

<ImageViewer
imageUrls={[{url:selectedImage || ""}]}
enableSwipeDown
onSwipeDown={()=>setSelectedImage(null)}
renderIndicator={() => <></>}
/>

<TouchableOpacity style={styles.closeBtn} onPress={()=>setSelectedImage(null)}>
<MaterialCommunityIcons name="close" size={30} color="#fff"/>
</TouchableOpacity>

</Modal>

</SafeAreaView>

);

}

////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////

const styles = StyleSheet.create({

center:{flex:1,justifyContent:"center",alignItems:"center"},

header:{flexDirection:"row",padding:16,alignItems:"center"},

avatar:{width:120,height:120,borderRadius:60},

name:{fontWeight:"bold",fontSize:22,color:COLORS.textPrimary},

shop:{color:COLORS.primary,fontWeight:"600"},

rating:{color:COLORS.primary,fontWeight:"bold",marginTop:4},

info:{fontSize:13,color:COLORS.textSecondary},

chatIcon:{backgroundColor:COLORS.primary,padding:8,borderRadius:30},

section:{paddingHorizontal:16,marginTop:16},

sectionTitle:{fontWeight:"bold",fontSize:16,color:COLORS.textPrimary},

servicesRow:{flexDirection:"row",flexWrap:"wrap"},

tag:{
backgroundColor:COLORS.primary,
borderRadius:14,
paddingHorizontal:10,
paddingVertical:4,
marginRight:6,
marginBottom:6,
},

tagText:{color:"#fff",fontSize:12},

workImg:{width:100,height:100,borderRadius:8,marginRight:10},

reviewCard:{backgroundColor:COLORS.card,padding:10,borderRadius:10,marginTop:10},

reply:{marginTop:4,color:COLORS.primary},

likeBtn:{flexDirection:"row",alignItems:"center",marginTop:5},

badge:{
backgroundColor:"#16a34a",
paddingHorizontal:6,
paddingVertical:2,
borderRadius:6,
marginLeft:6
},

badgeText:{color:"#fff",fontSize:11},

availabilityCard:{
flexDirection:"row",
alignItems:"center",
backgroundColor:COLORS.primary,
padding:16,
marginHorizontal:16,
borderRadius:12,
marginTop:20,
},

availText:{color:"#fff",fontSize:14},

placeOrderBtn:{paddingVertical:14,borderRadius:12,alignItems:"center"},

placeOrderText:{color:"#fff",fontWeight:"bold",fontSize:16},

closeBtn:{position:"absolute",top:50,right:20}

});