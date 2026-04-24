import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import React, { useEffect, useState } from "react";

import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { COLORS } from "../theme/colors";

//////////////////////////////////////////////////////
// CARD COMPONENT
//////////////////////////////////////////////////////

function AnimatedCard({ item, index, router }: any) {

  const anim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: index * 120,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [{ translateY }],
        },
      ]}
    >

      <View style={styles.row}>

        <View>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.meta}>
            {item.category} • {item.style}
          </Text>
        </View>

        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>
            {item.source === "ai" ? "AI" : "Manual"}
          </Text>
        </LinearGradient>

      </View>

      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      <View style={styles.measureBox}>
        {Object.entries(item.measurements || {}).map(
          ([key, val]: any) => (
            <View key={key} style={styles.measureItem}>
              <Text style={styles.measureKey}>{key}</Text>
              <Text style={styles.measureVal}>{val} in</Text>
            </View>
          )
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          router.push({
            pathname: "/CustomerfindTailor",
            params: {
              measurements: JSON.stringify(item.measurements),
              category: item.category,
              type: item.type,
              style: item.style,
            },
          });
        }}
      >
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.useBtn}
        >
          <Text style={styles.useText}>
            Use This Measurement
          </Text>
        </LinearGradient>
      </TouchableOpacity>

    </Animated.View>
  );
}

//////////////////////////////////////////////////////
// MAIN SCREEN
//////////////////////////////////////////////////////

export default function MeasurementHistory() {

  const router = useRouter();
  const auth = getAuth();
  const db = getDatabase();

  const [list, setList] = useState<any[]>([]);

//////////////////////////////////////////////////////
// LOAD DATA
//////////////////////////////////////////////////////

  useEffect(() => {

    const user = auth.currentUser;
    if (!user) return;

    const manualRef = ref(db, `manualMeasurements/${user.uid}`);
    const aiRef = ref(db, `aiMeasurements/${user.uid}`);

    let manualData:any[] = [];
    let aiData:any[] = [];

    const mergeData = () => {
      const combined = [...manualData, ...aiData];
      combined.sort((a,b)=> b.createdAt - a.createdAt);
      setList(combined);
    };

    onValue(manualRef,(snap)=>{
      const data = snap.val();
      manualData = data
        ? Object.entries(data).map(([key,item]:any)=>({
            ...item,
            measurementId:key,
            source:"manual"
          }))
        : [];
      mergeData();
    });

    onValue(aiRef,(snap)=>{
      const data = snap.val();
      aiData = data
        ? Object.entries(data).map(([key,item]:any)=>({
            ...item,
            measurementId:key,
            source:"ai"
          }))
        : [];
      mergeData();
    });

  },[]);

//////////////////////////////////////////////////////
// DELETE
//////////////////////////////////////////////////////

  const handleDelete = async (item:any) => {

    const user = auth.currentUser;
    if (!user) return;

    const path =
      item.source === "ai"
        ? `aiMeasurements/${user.uid}/${item.measurementId}`
        : `manualMeasurements/${user.uid}/${item.measurementId}`;

    await remove(ref(db,path));

    setList(prev =>
      prev.filter(i => i.measurementId !== item.measurementId)
    );
  };

  const confirmDelete = (item:any) => {
    Alert.alert("Delete","Are you sure?",[
      {text:"Cancel"},
      {text:"Delete",onPress:()=>handleDelete(item)}
    ]);
  };

//////////////////////////////////////////////////////
// SWIPE
//////////////////////////////////////////////////////

  const renderRightActions = (item:any) => (
    <TouchableOpacity onPress={()=>confirmDelete(item)}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.deleteBox}
      >
        <MaterialCommunityIcons name="delete" size={26} color="#fff"/>
      </LinearGradient>
    </TouchableOpacity>
  );

//////////////////////////////////////////////////////
// UI
//////////////////////////////////////////////////////

  return (

    <View style={styles.container}>

      {/* 🔥 BACKGROUND CIRCLES */}
      <View style={styles.bgCircle1}/>
      <View style={styles.bgCircle2}/>
      <View style={styles.bgCircle3}/>
      <View style={styles.bgCircle4}/>

      {/* HEADER */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.header}
      >

        <TouchableOpacity
          onPress={()=>router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color="#fff"/>
        </TouchableOpacity>

        <Text style={styles.heading}>
          My Measurements
        </Text>

      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>

        {list.length === 0 ? (
          <Text style={styles.empty}>
            No measurements yet
          </Text>
        ) : (

          list.map((item,index)=>(

            <Swipeable
              key={item.measurementId}
              renderRightActions={()=>renderRightActions(item)}
            >
              <AnimatedCard
                item={item}
                index={index}
                router={router}
              />
            </Swipeable>

          ))

        )}

        <View style={{height:120}}/>

      </ScrollView>

    </View>
  );
}

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:COLORS.background
},

/* ✅ FIXED VISIBLE CIRCLES */

bgCircle1:{
position:"absolute",
width:280,
height:280,
borderRadius:140,
backgroundColor:"#d9c3b2",
top:-80,
left:-100,
opacity:0.7
},

bgCircle2:{
position:"absolute",
width:220,
height:220,
borderRadius:110,
backgroundColor:"#c9a992",
top:120,
right:-90,
opacity:0.6
},

bgCircle3:{
position:"absolute",
width:160,
height:160,
borderRadius:80,
backgroundColor:"#e8d8cc",
bottom:120,
left:-60,
opacity:0.5
},

bgCircle4:{
position:"absolute",
width:120,
height:120,
borderRadius:60,
backgroundColor:"#bfa08a",
bottom:40,
right:40,
opacity:0.4
},

header:{
paddingTop:60,
paddingBottom:25,
paddingHorizontal:20,
borderBottomLeftRadius:25,
borderBottomRightRadius:25,
flexDirection:"row",
alignItems:"center"
},

backBtn:{
marginRight:10
},

heading:{
fontSize:24,
fontWeight:"bold",
color:"#fff"
},

empty:{
textAlign:"center",
marginTop:50,
color:COLORS.textSecondary
},

card:{
backgroundColor:COLORS.card,
marginHorizontal:20,
marginTop:15,
borderRadius:18,
padding:16,

shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:10,
shadowOffset:{width:0,height:4},
elevation:4
},

row:{
flexDirection:"row",
justifyContent:"space-between"
},

type:{
fontSize:18,
fontWeight:"bold",
color:COLORS.textPrimary
},

meta:{
color:COLORS.textSecondary,
marginTop:3
},

badge:{
paddingHorizontal:10,
paddingVertical:4,
borderRadius:10
},

badgeText:{
color:"#fff",
fontSize:10,
fontWeight:"700"
},

date:{
marginTop:8,
fontSize:11,
color:COLORS.textSecondary
},

measureBox:{
marginTop:10,
flexDirection:"row",
flexWrap:"wrap",
gap:10
},

measureItem:{
backgroundColor:COLORS.background,
padding:8,
borderRadius:8,
width:"30%"
},

measureKey:{
fontSize:10,
color:COLORS.textSecondary
},

measureVal:{
fontWeight:"bold",
color:COLORS.textPrimary
},

useBtn:{
marginTop:15,
padding:12,
borderRadius:12,
alignItems:"center"
},

useText:{
color:"#fff",
fontWeight:"600"
},

deleteBox:{
justifyContent:"center",
alignItems:"center",
width:80,
height:80,
marginVertical:15,
borderRadius:15
}

});