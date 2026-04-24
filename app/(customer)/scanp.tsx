import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Easing,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ScanMeasurement() {

  const params = useLocalSearchParams();

  const category = (params.category as string) || "";
  const type = (params.type as string) || "";
  const style = (params.style as string) || "";
  const colorName = (params.colorName as string) || "";
  const fabric = (params.fabric as string) || "";
  const referenceImage = (params.referenceImage as string) || "";

  const router = useRouter();
  const cameraRef = useRef<any>(null);

  const [facing,setFacing] = useState<"front"|"back">("back");
  const [feet,setFeet] = useState("");
  const [inch,setInch] = useState("");
  const [timer,setTimer] = useState<number|null>(null);
  const [step,setStep] = useState<"front"|"side">("front");
  const [frontImage,setFrontImage] = useState<any>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const [isScanning,setIsScanning] = useState(false);

const API_URL = "http://192.168.100.36:8000";

  useEffect(()=>{
    Speech.speak("چھ فٹ فاصلے پر سیدھا کھڑے ہوں، پورا جسم واضح نظر آئے",{language:"ur-PK"});
  },[]);

  const convertHeight = ()=>{
    if(!feet) return 0;
    const totalInches = parseInt(feet)*12 + (parseInt(inch)||0);
    return totalInches * 2.54;
  };

  const startTimer = ()=>{
    const heightCm = convertHeight();

    if(!heightCm){
      Alert.alert("Height Required","Enter height first");
      return;
    }

    let count = 5;
    setTimer(count);

    Speech.speak("تصویر پانچ سیکنڈ بعد لی جائے گی",{language:"ur-PK"});

    const interval = setInterval(()=>{
      count--;
      setTimer(count);

      if(count===0){
        clearInterval(interval);
        setTimer(null);
        startScan(heightCm);
      }
    },1000);
  };

  const startScan = (heightCm:number)=>{
    setIsScanning(true);
    scanAnim.setValue(0);

    Animated.timing(scanAnim,{
      toValue:1,
      duration:1500,
      easing:Easing.linear,
      useNativeDriver:true
    }).start(()=>{
      setIsScanning(false);
      capture(heightCm);
    });
  };

  const capture = async(heightCm:number)=>{
    if(!cameraRef.current) return;

    Speech.speak("حرکت نہ کریں",{language:"ur-PK"});

    const photo = await cameraRef.current.takePictureAsync({
      quality:1,
      skipProcessing:true
    });

    if(step==="front"){
      setFrontImage(photo);
      setStep("side");
      Speech.speak("اب سائیڈ میں کھڑے ہوں",{language:"ur-PK"});
      Alert.alert("Side Scan","Turn sideways and capture again");
    }else{
      if(!frontImage){
        Alert.alert("Error","Front image missing");
        return;
      }
      sendToServer(frontImage,photo,heightCm);
    }
  };

  const sendToServer = async(front:any,side:any,height:number)=>{
    const formData = new FormData();

    formData.append("front",{uri:front.uri,name:"front.jpg",type:"image/jpeg"} as any);
    formData.append("side",{uri:side.uri,name:"side.jpg",type:"image/jpeg"} as any);
    formData.append("height",height.toString());
    formData.append("category",category);
    formData.append("type",type);
    formData.append("style",style);

    try{
      const response = await fetch(`${API_URL}/measure-pro`,{
        method:"POST",
        body:formData
      });

      const data = await response.json();

      if(data.error){
        Alert.alert("Scan Error",data.error);
        return;
      }

      router.push({
        pathname:"/(customer)/scanResult",
        params:{
          measurements:JSON.stringify(data),
          category,
          type,
          style,
          colorName,
          fabric,
          referenceImage
        }
      });

    }catch(e){
      Alert.alert("Connection Error","Check backend connection");
    }
  };

  const isHeightValid = feet.length > 0;

  return(
    <View style={{flex:1}}>

      <CameraView ref={cameraRef} style={{flex:1}} facing={facing}/>

      {/* FRAME */}
      <View style={styles.frame}/>

      {/* 🔄 SWITCH CAMERA (TOP RIGHT) */}
      <TouchableOpacity
        style={styles.switchIcon}
        onPress={()=>setFacing(facing==="front"?"back":"front")}
      >
        <MaterialCommunityIcons name="camera-flip-outline" size={26} color="#fff"/>
      </TouchableOpacity>

      {/* SCAN LINE */}
      {isScanning && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform:[
                {
                  translateY: scanAnim.interpolate({
                    inputRange:[0,1],
                    outputRange:[0,300]
                  })
                }
              ]
            }
          ]}
        />
      )}

      {/* TIMER */}
      {timer!==null && (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{timer}</Text>
        </View>
      )}

      {/* OVERLAY */}
      <View style={styles.overlay}>

        <Text style={styles.title}>
          {step==="front" ? "Front Scan" : "Side Scan"}
        </Text>

        <Text style={styles.subtitle}>
          Stand straight • Full body visible
        </Text>

        <View style={styles.row}>
          <TextInput
            placeholder="Feet"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={feet}
            onChangeText={setFeet}
            style={styles.input}
          />
          <TextInput
            placeholder="Inches"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={inch}
            onChangeText={setInch}
            style={styles.input}
          />
        </View>

        {/* 🎯 CAMERA BUTTON */}
        <View style={{alignItems:"center"}}>
          
          <TouchableOpacity
            onPress={startTimer}
            activeOpacity={0.8}
            style={[
              styles.captureCircle,
              {opacity:isHeightValid?1:0.4}
            ]}
          >
            <View style={styles.innerCircle}/>
          </TouchableOpacity>

          <Text style={styles.captureLabel}>
            Start Scan
          </Text>

        </View>

      </View>

    </View>
  );
}

////////////////////////////////////////////////

const styles = StyleSheet.create({

frame:{
position:"absolute",
top:"18%",
left:"8%",
right:"8%",
bottom:"18%",
borderWidth:2,
borderColor:"#A06A42",
borderRadius:25
},

switchIcon:{
  position:"absolute",
  top:50,        // 🔥 top right pe le aya
  right:20,
  zIndex:20,
  backgroundColor:"rgba(0,0,0,0.5)",
  padding:10,
  borderRadius:30
},
scanLine:{
position:"absolute",
left:"8%",
right:"8%",
height:2,
backgroundColor:"#A06A42",
top:"18%"
},

timerBox:{
position:"absolute",
top:"40%",
alignSelf:"center",
backgroundColor:"rgba(0,0,0,0.6)",
padding:25,
borderRadius:60
},

timerText:{
color:"#fff",
fontSize:32,
fontWeight:"bold"
},

overlay:{
position:"absolute",
bottom:30,
left:20,
right:20,
backgroundColor:"rgba(0,0,0,0.4)",
borderRadius:20,
padding:20
},

title:{
color:"#fff",
fontSize:22,
fontWeight:"700",
textAlign:"center",
marginBottom:5
},

subtitle:{
color:"#ddd",
textAlign:"center",
marginBottom:15
},

row:{
flexDirection:"row",
gap:10,
marginBottom:20
},

input:{
flex:1,
backgroundColor:"rgba(255,255,255,0.1)",
borderRadius:10,
padding:12,
color:"#fff",
borderWidth:1,
borderColor:"rgba(255,255,255,0.2)"
},

captureCircle:{
width:80,
height:80,
borderRadius:40,
borderWidth:4,
borderColor:"#fff",
justifyContent:"center",
alignItems:"center",
marginBottom:8
},

innerCircle:{
width:55,
height:55,
borderRadius:30,
backgroundColor:"#fff"
},

captureLabel:{
color:"#fff",
fontSize:14,
fontWeight:"600"
}

});