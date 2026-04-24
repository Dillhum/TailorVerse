import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { COLORS } from "../theme/colors";

import { LinearGradient } from 'expo-linear-gradient';
import { onValue, ref } from "firebase/database";
import { database } from "../firebaseConfig";

interface Admin {
  id: string;
  name: string;
  image: string;
}

const ViewAll = () => {

  const [admins, setAdmins] = useState<Admin[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    const dbRef = ref(database, "admins");

    onValue(dbRef, (snapshot) => {

      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAdmins(list);
      } else {
        setAdmins([]);
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }).start();

    });

  }, []);

  return (

    <View style={styles.container}>

      {/* 🔥 GRADIENT HEADER */}
 <LinearGradient
  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.header}
>
        <Text style={styles.headerTitle}>Trending Designs</Text>
      </LinearGradient>

      {/* 🔥 TRANSPARENT OVERLAY SECTION */}
      <View style={styles.overlayBox}>
        <Text style={styles.overlayText}>
          Explore the Latest Fashion Trends ✨
        </Text>

        <Text style={styles.overlaySub}>
          Handpicked designs just for you
        </Text>
      </View>

      {/* 🔥 CARDS */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >

        {admins.map((item, index) => {

          const translateY = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [60, 0]
          });

          return (

            <Animated.View
              key={item.id}
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY }]
                }
              ]}
            >

              <Image
                source={{ uri: item.image }}
                style={styles.image}
              />

              <View style={styles.cardOverlay} />

              <View style={styles.textBox}>
                <Text style={styles.name}>{item.name}</Text>
              </View>

            </Animated.View>

          );

        })}

      </ScrollView>

    </View>

  );

};

export default ViewAll;

/////////////////////////////////////////////////////////
// STYLES
/////////////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FAF9F6'
  },

  //////////////////////////////////////
  // HEADER
  //////////////////////////////////////

  header: {
    paddingTop: 50,
    paddingBottom: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },

  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },

  //////////////////////////////////////
  // OVERLAY SECTION
  //////////////////////////////////////

  overlayBox: {
    marginHorizontal: 20,
    marginTop: -25, // 🔥 overlap effect
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 18,
    borderRadius: 18,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },

  overlayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E362F'
  },

  overlaySub: {
    fontSize: 13,
    color: '#8D6E63',
    marginTop: 4
  },

  //////////////////////////////////////
  // GRID
  //////////////////////////////////////

  grid: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  //////////////////////////////////////
  // CARD
  //////////////////////////////////////

  card: {
    width: '48%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#fff',

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },

  image: {
    width: '100%',
    aspectRatio: 0.75,
    resizeMode: 'cover'
  },

  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },

  textBox: {
    position: 'absolute',
    bottom: 10,
    left: 12
  },

  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  }

});