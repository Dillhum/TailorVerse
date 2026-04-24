import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, push, ref, set } from "firebase/database";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ScanResult(){

  const router = useRouter();
  const params = useLocalSearchParams();

  const colorName = (params.colorName as string) || "";
  const fabric = (params.fabric as string) || "";
  const referenceImage = (params.referenceImage as string) || "";
  const category = (params.category as string) || "";
  const type = (params.type as string) || "";
  const style = (params.style as string) || "";

  // ✅ SAFE PARSE (important)
  let data:any = {};
  try{
    data = params.measurements
      ? JSON.parse(params.measurements as string)
      : {};
  }catch(e){
    console.log("JSON ERROR", e);
  }

  const [note,setNote] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase();

  ////////////////////////////////////////////////
  // SAVE + NEXT
  ////////////////////////////////////////////////
  const goNext = async ()=>{

    if(!user){
      alert("User not logged in");
      return;
    }

    try{

      const measurementRef = push(ref(db,`scanMeasurements/${user.uid}`));

      await set(measurementRef,{
        measurementId:measurementRef.key,
        userId:user.uid,
        category,
        type,
        style,
        colorName,
        fabric,
        referenceImage,
        measurements:data,
        note,
        createdAt:Date.now()
      });

      router.push({
        pathname:"/(customer)/CustomerfindTailor",
        params:{
          colorName,
          fabric,
          referenceImage,
          category,
          type,
          style,
          measurements:JSON.stringify(data)
        }
      });

    }catch(e){
      alert("Error saving data");
    }
  };

  ////////////////////////////////////////////////

  return(

    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        AI Measurement Result
      </Text>

      <View style={styles.card}>

        {/* ✅ ERROR SHOW */}
        {data?.error ? (
          <Text style={{color:"red",textAlign:"center"}}>
            {data.error}
          </Text>
        ) : (
          Object.keys(data).map((key)=>(
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key}</Text>
              <Text style={styles.value}>{data[key]} in</Text>
            </View>
          ))
        )}

      </View>

      <Text style={styles.noteTitle}>
        Extra Notes (Optional)
      </Text>

      <TextInput
        style={styles.noteInput}
        placeholder="Write any measurement related instruction..."
        value={note}
        onChangeText={setNote}
        multiline
      />

      <TouchableOpacity onPress={goNext}>

        <LinearGradient
          colors={["#7B4A2F","#4A2B1B"]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Next
          </Text>
        </LinearGradient>

      </TouchableOpacity>

    </ScrollView>
  )
}

////////////////////////////////////////////////
const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:"#F6F1EA",
    padding:20,
    paddingTop:70
  },
  title:{
    fontSize:24,
    fontWeight:"800",
    color:"#4A2E1F",
    marginBottom:20,
    textAlign:"center"
  },
  card:{
    backgroundColor:"#fff",
    borderRadius:15,
    padding:20,
    marginBottom:25,
    elevation:5
  },
  row:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginBottom:10
  },
  label:{
    fontSize:16,
    color:"#4A2E1F",
    fontWeight:"600"
  },
  value:{
    fontSize:16,
    color:"#7B4A2F",
    fontWeight:"700"
  },
  noteTitle:{
    fontWeight:"700",
    marginBottom:8,
    color:"#4A2E1F"
  },
  noteInput:{
    backgroundColor:"#fff",
    borderRadius:12,
    padding:15,
    height:100,
    textAlignVertical:"top",
    marginBottom:30
  },
  button:{
    padding:16,
    borderRadius:30,
    alignItems:"center"
  },
  buttonText:{
    color:"#fff",
    fontWeight:"700",
    fontSize:16
  }
});