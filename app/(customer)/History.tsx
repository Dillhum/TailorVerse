import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";

import {
    Animated,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

export default function History(){

const router = useRouter();

const [orders,setOrders] = useState<any[]>([]);
const [reviews,setReviews] = useState<any>({});

////////////////////////////////////////////////
// LOAD ORDERS
////////////////////////////////////////////////

useEffect(()=>{

const user = getAuth().currentUser;
if(!user) return;

const oRef = ref(database,"Orders");

onValue(oRef,(snap)=>{

let list:any[]=[];

snap.forEach(child=>{
const data = child.val();

if(data.customerId===user.uid && data.status==="completed"){
list.push({
...data,
orderId: child.key
});
}

});

setOrders(list.reverse());

});

},[]);

////////////////////////////////////////////////
// LOAD REVIEWS
////////////////////////////////////////////////

useEffect(()=>{

const user = getAuth().currentUser;
if(!user) return;

const rRef = ref(database,"Reviews");

onValue(rRef,(snap)=>{

let map:any={};

snap.forEach(child=>{
const data = child.val();
if(data.customerId===user.uid){
map[data.orderId]=true;
}
});

setReviews(map);

});

},[]);

////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////

const reorder = (item:any)=>{
router.push({
pathname:"/selectcolor",
params:{
style:item.style,
category:item.category
}
});
};

const goReview = (item:any)=>{
router.push({
pathname:"/LeaveReview",
params:{
orderId:item.orderId,
tailorId:item.tailorId
}
});
};

////////////////////////////////////////////////
// ANIMATED CARD
////////////////////////////////////////////////

const AnimatedCard = ({item,index}:any)=>{

const anim = new Animated.Value(0);

useEffect(()=>{
Animated.timing(anim,{
toValue:1,
duration:500,
delay:index*120,
useNativeDriver:true
}).start();
},[]);

const translateX = anim.interpolate({
inputRange:[0,1],
outputRange:[80,0]
});

return(

<Animated.View
style={[
styles.card,
{
opacity:anim,
transform:[{translateX}]
}
]}
>

<View style={styles.headerRow}>

<View style={styles.iconBox}>
<MaterialCommunityIcons
name="check-decagram"
size={22}
color="#16a34a" // ✅ GREEN BACK
/>
</View>

<View style={{flex:1}}>
<Text style={styles.suit}>{item.style}</Text>
<Text style={styles.category}>{item.category}</Text>
</View>

<View style={styles.completedBadge}>
<Text style={styles.badgeText}>Completed</Text>
</View>

</View>

<View style={styles.timeline}>

{["Order Placed","Stitching","Ready","Delivered"].map((step,i)=>(
<View key={i} style={styles.stepRow}>
<View style={styles.doneDot}/>
<Text style={styles.stepText}>{step}</Text>
</View>
))}

</View>

<View style={styles.infoRow}>

<View>
<Text style={styles.label}>Delivery</Text>
<Text style={styles.value}>{item.deliveryDate}</Text>
</View>

<View>
<Text style={styles.label}>Price</Text>
<Text style={styles.value}>Rs {item.price}</Text>
</View>

</View>

<View style={styles.buttonRow}>

{/* REORDER */}
<TouchableOpacity style={styles.reorderBtn} onPress={()=>reorder(item)}>
<LinearGradient
colors={[COLORS.gradientStart,COLORS.gradientEnd]}
style={styles.reorderGradient}
>
<Text style={styles.reorderText}>Order Again</Text>
</LinearGradient>
</TouchableOpacity>

{/* REVIEW */}
<TouchableOpacity
disabled={reviews[item.orderId]}
style={[
styles.reviewBtn,
reviews[item.orderId] && {opacity:0.5}
]}
onPress={()=>goReview(item)}
>

<MaterialCommunityIcons name="star" size={16} color="#fff"/>

<Text style={styles.reviewText}>
{reviews[item.orderId] ? "Reviewed" : "Leave Review"}
</Text>

</TouchableOpacity>

</View>

</Animated.View>

)

};

////////////////////////////////////////////////
// UI
////////////////////////////////////////////////

return(

<SafeAreaView style={styles.container}>

<LinearGradient
colors={[COLORS.gradientStart,COLORS.gradientEnd]}
style={styles.header}
>
<Text style={styles.heading}>Order History</Text>
</LinearGradient>

{orders.length===0?(

<View style={styles.emptyBox}>

<MaterialCommunityIcons
name="history"
size={70}
color={COLORS.textSecondary}
/>

<Text style={styles.emptyText}>
No completed orders yet
</Text>

</View>

):( 

<FlatList
data={orders}
keyExtractor={(item)=>item.orderId}
contentContainerStyle={{padding:20}}
showsVerticalScrollIndicator={false}
renderItem={({item,index})=>(
<AnimatedCard item={item} index={index}/>
)}
/>

)}

</SafeAreaView>

)

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
paddingTop:60,
paddingBottom:20,
alignItems:"center",
borderBottomLeftRadius:20,
borderBottomRightRadius:20
},

heading:{
color:"#fff",
fontSize:24,
fontWeight:"bold"
},

card:{
backgroundColor:COLORS.card,
borderRadius:18,
padding:18,
marginBottom:20,
elevation:5
},

headerRow:{
flexDirection:"row",
alignItems:"center"
},

iconBox:{
width:40,
height:40,
borderRadius:20,
backgroundColor:"#ECFDF5", // ✅ LIGHT GREEN BG
justifyContent:"center",
alignItems:"center",
marginRight:10
},

suit:{
fontSize:17,
fontWeight:"bold",
color:COLORS.textPrimary
},

category:{
fontSize:12,
color:COLORS.textSecondary
},

completedBadge:{
backgroundColor:"#16a34a", // ✅ GREEN BADGE
paddingHorizontal:10,
paddingVertical:4,
borderRadius:12
},

badgeText:{
color:"#fff",
fontSize:12,
fontWeight:"bold"
},

timeline:{marginTop:15},

stepRow:{
flexDirection:"row",
alignItems:"center",
marginBottom:6
},

doneDot:{
width:10,
height:10,
borderRadius:5,
backgroundColor:"#16a34a", // ✅ GREEN DOTS
marginRight:8
},

stepText:{
fontSize:13,
color:COLORS.textSecondary
},

infoRow:{
flexDirection:"row",
justifyContent:"space-between",
marginTop:12
},

label:{
fontSize:12,
color:COLORS.textSecondary
},

value:{
fontWeight:"bold",
color:COLORS.primary
},

buttonRow:{
flexDirection:"row",
marginTop:15
},

reorderBtn:{
flex:1,
marginRight:10
},

reorderGradient:{
paddingVertical:10,
borderRadius:12,
alignItems:"center"
},

reorderText:{
color:"#fff",
fontWeight:"bold"
},

reviewBtn:{
flexDirection:"row",
backgroundColor:"#16a34a", // ✅ GREEN BUTTON
flex:1,
borderRadius:12,
justifyContent:"center",
alignItems:"center",
gap:5
},

reviewText:{
color:"#fff",
fontWeight:"bold"
},

emptyBox:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

emptyText:{
marginTop:10,
fontSize:16,
color:COLORS.textSecondary
}

});