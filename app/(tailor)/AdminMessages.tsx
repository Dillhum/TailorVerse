import React, { useEffect, useRef, useState } from 'react'
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'
import { onValue, ref } from "firebase/database"
import { auth, database } from "../firebaseConfig"

const AdminMessages = () => {

  const [warnings,setWarnings] = useState<any[]>([])
  const slideAnim = useRef(new Animated.Value(-100)).current

  const user = auth.currentUser

  ////////////////////////////////////////////////////

  useEffect(()=>{

    if(!user) return

    const warnRef = ref(database,"Warnings/"+user.uid)

    onValue(warnRef,(snapshot)=>{

      if(snapshot.exists()){

        const data = snapshot.val()

        const list = Object.keys(data).map(key=>({
          id:key,
          ...data[key]
        }))

        setWarnings(list.reverse())

      }else{
        setWarnings([])
      }

    })

  },[])

  ////////////////////////////////////////////////////

  useEffect(()=>{

    slideAnim.setValue(-100)

    Animated.timing(slideAnim,{
      toValue:0,
      duration:600,
      useNativeDriver:true
    }).start()

  },[warnings])

  ////////////////////////////////////////////////////

  return (

    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        Admin Warnings
      </Text>

      {warnings.length === 0 ? (

        <Text style={styles.empty}>
          No warnings yet
        </Text>

      ) : (

        warnings.map((w,i)=>(

          <Animated.View
            key={i}
            style={{
              transform:[{translateX:slideAnim}],
              opacity: slideAnim.interpolate({
                inputRange:[-100,0],
                outputRange:[0,1]
              })
            }}
          >

            <LinearGradient
              colors={['#4E362F','#8D6E63']}
              style={styles.card}
            >

              <Text style={styles.label}>⚠ Warning</Text>

              <Text style={styles.message}>
                {w.message}
              </Text>

              <View style={styles.divider}/>

              <Text style={styles.subLabel}>Complaint</Text>

              <Text style={styles.complaint}>
                {w.complaint}
              </Text>

            </LinearGradient>

          </Animated.View>

        ))

      )}

    </ScrollView>
  )
}

export default AdminMessages

////////////////////////////////////////////////////

const styles = StyleSheet.create({

container:{
  paddingTop:30,
  flex:1,
  backgroundColor:"#F6F3EE",
  padding:15
},

title:{
  fontSize:22,
  fontWeight:"bold",
  marginBottom:15,
  color:"#4E362F"
},

empty:{
  textAlign:"center",
  marginTop:40,
  color:"#999"
},

card:{
  padding:18,
  borderRadius:18,
  marginBottom:15,

  shadowColor:"#000",
  shadowOpacity:0.2,
  shadowRadius:10,
  elevation:6
},

label:{
  color:"#FFD180",
  fontWeight:"bold",
  marginBottom:6
},

message:{
  color:"#FFF",
  fontSize:15,
  fontWeight:"600"
},

divider:{
  height:1,
  backgroundColor:"rgba(255,255,255,0.3)",
  marginVertical:10
},

subLabel:{
  color:"#E0D6CF",
  fontSize:12
},

complaint:{
  color:"#FFF",
  fontSize:14
}

})