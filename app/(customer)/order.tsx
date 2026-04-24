import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    Animated,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";

import { database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

export default function Orders(){

const [orders,setOrders] = useState<any[]>([]);

////////////////////////////////////////////////
// LOAD DATA
////////////////////////////////////////////////

useEffect(()=>{

const user = getAuth().currentUser;
if(!user) return;

const oRef = ref(database,"Orders");

onValue(oRef,(snap)=>{

let list:any[]=[];

snap.forEach(child=>{
const data = child.val();
if(data.customerId===user.uid){
list.push(data);
}
});

setOrders(list.reverse());

});

},[]);

////////////////////////////////////////////////
// STATUS COLOR (THEME BASED)
////////////////////////////////////////////////

const getStatusColor = (status:string)=>{

if(status==="new") return COLORS.accent;
if(status==="inProgress") return COLORS.primaryLight;
if(status==="completed") return COLORS.primary;

return COLORS.textSecondary;

};

////////////////////////////////////////////////
// ANIMATED CARD COMPONENT
////////////////////////////////////////////////

const AnimatedCard = ({item,index}:any)=>{

const anim = new Animated.Value(0);

useEffect(()=>{
Animated.timing(anim,{
toValue:1,
duration:500,
delay:index*120, // 🔥 stagger
useNativeDriver:true
}).start();
},[]);

const translateX = anim.interpolate({
inputRange:[0,1],
outputRange:[-60,0] // 👈 left se aaye
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
name="tshirt-crew"
size={22}
color={COLORS.primary}
/>
</View>

<View style={{flex:1}}>

<Text style={styles.suit}>
{item.style}
</Text>

<Text style={styles.category}>
{item.category}
</Text>

</View>

<View
style={[
styles.statusBadge,
{backgroundColor:getStatusColor(item.status)}
]}
>

<Text style={styles.statusText}>
{item.status}
</Text>

</View>

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

</Animated.View>

)

};

////////////////////////////////////////////////
// UI
////////////////////////////////////////////////

return(

<SafeAreaView style={styles.container}>

{/* HEADER */}
<LinearGradient
colors={[COLORS.gradientStart, COLORS.gradientEnd]}
style={styles.header}
>
<Text style={styles.heading}>My Orders</Text>
</LinearGradient>

{orders.length===0 ?(

<View style={styles.emptyBox}>

<MaterialCommunityIcons
name="clipboard-text-outline"
size={60}
color={COLORS.textSecondary}
/>

<Text style={styles.emptyText}>
No Orders Yet
</Text>

</View>

):(

// 🔥 FlatList with animated cards
<FlatList
data={orders}
keyExtractor={(item)=>item.orderId}
showsVerticalScrollIndicator={false}
contentContainerStyle={{padding:20}}

renderItem={({item,index})=>(
<AnimatedCard item={item} index={index}/>
)}

/>

)}

</SafeAreaView>

)

}

////////////////////////////////////////////////
// STYLES (FULL THEME BASED)
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
padding:16,
marginBottom:16,

shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:10,
shadowOffset:{width:0,height:4},
elevation:4
},

headerRow:{
flexDirection:"row",
alignItems:"center"
},

iconBox:{
width:40,
height:40,
borderRadius:20,
backgroundColor:COLORS.background,
justifyContent:"center",
alignItems:"center",
marginRight:10
},

suit:{
fontSize:16,
fontWeight:"bold",
color:COLORS.textPrimary
},

category:{
fontSize:12,
color:COLORS.textSecondary
},

statusBadge:{
paddingHorizontal:10,
paddingVertical:4,
borderRadius:12
},

statusText:{
color:"#fff",
fontSize:12,
fontWeight:"bold"
},

infoRow:{
flexDirection:"row",
justifyContent:"space-between",
marginTop:15
},

label:{
fontSize:12,
color:COLORS.textSecondary
},

value:{
fontWeight:"bold",
color:COLORS.primary
},

emptyBox:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

emptyText:{
marginTop:10,
color:COLORS.textSecondary,
fontSize:16
}

});