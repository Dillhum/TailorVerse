import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { auth, database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";
////////////////////////////////////////////////////


////////////////////////////////////////////////////

export default function TailorDashboard(){

const [tailorName,setTailorName] = useState("");
const [newOrders,setNewOrders] = useState(0);
const [inProgress,setInProgress] = useState(0);
const [completed,setCompleted] = useState(0);
const [unreadChats,setUnreadChats] = useState(0);
const [adminUnread,setAdminUnread] = useState(0);
const [activeTab,setActiveTab] = useState("home");

const slideAnim = useRef(new Animated.Value(80)).current;
const user = auth.currentUser;

////////////////////////////////////////////////////
useFocusEffect(
  React.useCallback(() => {
    setActiveTab("home");
  }, [])
);

useEffect(()=>{

Animated.timing(slideAnim,{
toValue:0,
duration:700,
useNativeDriver:true
}).start();

if(!user) return;

// USER
onValue(ref(database,"Warnings/"+user.uid),(snap)=>{
  if(snap.exists()){
    const data = snap.val()

    let count = 0

    Object.values(data).forEach((w:any)=>{
      if(!w.seen) count++   // 🔥 only unseen
    })

    setAdminUnread(count)
  }else{
    setAdminUnread(0)
  }
});

// ORDERS
onValue(ref(database,"Orders"),(snapshot)=>{
let n=0,p=0,c=0;
snapshot.forEach((child)=>{
const d = child.val();
if(d.tailorId===user.uid){
if(d.status==="new") n++;
if(d.status==="inProgress") p++;
if(d.status==="completed") c++;
}
});
setNewOrders(n);
setInProgress(p);
setCompleted(c);
});

// CHATS
onValue(ref(database,"Chats"),(snapshot)=>{
let unread=0;
snapshot.forEach((child)=>{
const d = child.val();
if(d.tailorId===user.uid){
unread+=d.unreadTailor || 0;
}
});
setUnreadChats(unread);
});



},[]);

////////////////////////////////////////////////////

return(

<SafeAreaView style={styles.container}>

{/* 🎈 STATIC BACKGROUND BALLOONS */}

<View style={styles.circle}/>
<View style={styles.circle2}/>
<View style={styles.circle3}/>

<ScrollView showsVerticalScrollIndicator={false}>

{/* HEADER */}

<LinearGradient
colors={[COLORS.gradientStart, COLORS.gradientEnd]}
style={styles.header}
>

<View style={styles.headerTop}>

<View>
<Text style={styles.welcome}>Welcome to</Text>
<Text style={styles.brand}>TailorVerse</Text>
<Text style={styles.name}>{tailorName}</Text>
</View>

<View style={{flexDirection:"row",alignItems:"center"}}>

<TouchableOpacity
onPress={async ()=>{
  router.push("/AdminMessages")

const warnRef = ref(database,"Warnings/"+user?.uid)

  onValue(warnRef,(snap)=>{
    if(snap.exists()){
      const data = snap.val()

      Object.keys(data).forEach(key=>{
        update(ref(database,"Warnings/"+user?.uid+"/"+key),{
          seen: true
        })
      })
    }
  },{onlyOnce:true})
}}
style={{marginRight:12}}
>
<MaterialCommunityIcons name="bell-outline" size={24} color="#fff"/>

{adminUnread>0 &&(
<View style={styles.badge}>
<Text style={styles.badgeText}>{adminUnread}</Text>
</View>
)}

</TouchableOpacity>

{/* 🔥 SMALLER LOGO */}

<View style={styles.logoWrapper}>
<Image
source={require("../../assets/images/app-logo.png")}
style={styles.logo}
/>
</View>

</View>

</View>

</LinearGradient>

{/* CARDS */}

<Animated.View style={{
transform:[{translateY:slideAnim}]
}}>

<View style={styles.cards}>

<StatCard title="New Orders" value={newOrders} icon="clipboard-list"/>
<StatCard title="In Progress" value={inProgress} icon="progress-clock"/>
<StatCard title="Completed" value={completed} icon="check-circle"/>
<StatCard title="Unread Chats" value={unreadChats} icon="chat"/>

</View>

</Animated.View>

{/* TOTAL */}

<View style={styles.totalBox}>
<Text style={styles.totalText}>Total Deliveries</Text>
<Text style={styles.totalNumber}>{completed}</Text>
</View>

</ScrollView>

{/* TAB BAR */}

<View style={styles.tabBar}>

<Tab icon="calendar" label="Schedule" active={activeTab==="schedule"} onPress={()=>{setActiveTab("schedule");router.push("/schedual")}}/>
<Tab 
  icon="chat" 
  label="Chats" 
  active={activeTab==="chat"} 
  badge={unreadChats}
  onPress={()=>{
    setActiveTab("chat");
    router.push("/TailorCustomerList")
  }}
/>
<Tab icon="clipboard-list" label="Orders" active={activeTab==="orders"} onPress={()=>{setActiveTab("orders");router.push("/TailorOrders")}}/>
<Tab icon="account" label="Profile" active={activeTab==="profile"} onPress={()=>{setActiveTab("profile");router.push("/Tailorprofile")}}/>

</View>

</SafeAreaView>
);
}

////////////////////////////////////////////////////

const StatCard=({title,value,icon}:any)=>(
<View style={styles.card}>
<View style={styles.iconCircle}>
<MaterialCommunityIcons name={icon} size={22} color="#fff"/>
</View>
<Text style={styles.value}>{value}</Text>
<Text style={styles.title}>{title}</Text>
</View>
);

////////////////////////////////////////////////////

const Tab=({icon,label,onPress,active,badge}:any)=>(

<TouchableOpacity style={styles.tabItem} onPress={onPress}>
  
  <View>
    <MaterialCommunityIcons 
      name={icon} 
      size={22} 
      color={active ? COLORS.accent : COLORS.primary}
    />

    {/* ✅ BADGE */}
    {badge && badge > 0 && ( 
      <View style={styles.tabBadge}>
        <Text style={styles.tabBadgeText}>{badge}</Text>
      </View>
    )}
  </View>

  <Text style={{fontSize:11,color:active ? COLORS.accent : COLORS.textSecondary}}>
    {label}
  </Text>

</TouchableOpacity>
);

////////////////////////////////////////////////////

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:COLORS.background
},

// 🎈 MORE VISIBLE BALLOONS
circle:{
position:"absolute",
width:140,
height:140,
borderRadius:70,
backgroundColor:"#E9DCCB",
top:120,
left:-40
},

circle2:{
position:"absolute",
width:180,
height:180,
borderRadius:90,
backgroundColor:"#EDE2D3",
top:300,
right:-60
},

circle3:{
position:"absolute",
width:120,
height:120,
borderRadius:60,
backgroundColor:"#E9DCCB",
bottom:150,
left:60
},

header:{
padding:20,
borderBottomLeftRadius:30,
borderBottomRightRadius:30,
marginBottom:10
},

headerTop:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

welcome:{
color:"#ddd",
fontSize:13,
paddingTop:20
},

brand:{
fontSize:24,
fontWeight:"bold",
color:"#fff"
},

name:{
fontSize:16,
color:"#fff",
marginTop:4
},

// 🔥 SMALLER LOGO

logoWrapper:{
width:42,
height:42,
borderRadius:21,
backgroundColor:"#fff",
justifyContent:"center",
alignItems:"center",
marginLeft:10,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:6,
elevation:4
},

logo:{
width:30,
height:30,
borderRadius:15
},

badge:{
  position:"absolute",
  top:-5,
  right:-5,
  backgroundColor:"#8B4513", 
  borderRadius:10,
  paddingHorizontal:5
},

badgeText:{
color:"#fff",
fontSize:10
},

cards:{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"space-between",
padding:15
},
tabBadge:{
  position:"absolute",
  top:-6,
  right:-10,
 backgroundColor:"#8B4513",
  borderRadius:10,
  paddingHorizontal:5,
  minWidth:16,
  alignItems:"center"
},

tabBadgeText:{
  color:"#fff",
  fontSize:10
},

card:{
width:"48%",
backgroundColor:"#FBF8F4",
padding:18,
borderRadius:18,
marginBottom:15,
borderWidth:1,
borderColor:COLORS.border,
shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:10,
shadowOffset:{width:0,height:5},
elevation:5
},

iconCircle:{
backgroundColor:COLORS.primary,
width:36,
height:36,
borderRadius:18,
justifyContent:"center",
alignItems:"center",
marginBottom:10
},

value:{
fontSize:20,
fontWeight:"bold",
color:COLORS.textPrimary
},

title:{
fontSize:12,
color:COLORS.textSecondary
},

totalBox:{
margin:15,
backgroundColor:"#fff",
padding:18,
borderRadius:16,
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.06,
shadowRadius:8,
elevation:3
},

totalText:{
color:COLORS.textSecondary
},

totalNumber:{
fontSize:24,
fontWeight:"bold",
color:COLORS.primary,
marginTop:4
},

tabBar:{
paddingBottom:30,
position:"absolute",
bottom:15,
left:15,
right:15,
flexDirection:"row",
justifyContent:"space-around",
backgroundColor:"#fff",
paddingVertical:12,
borderRadius:30,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:10,
elevation:10
},

tabItem:{
alignItems:"center"
}

});