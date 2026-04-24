// app/TailorChatList.tsx

import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, onValue, ref, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../theme/colors";

//////////////////////////////////////////////////
// BACKGROUND SAME AS CUSTOMER
//////////////////////////////////////////////////

const BackgroundBubbles = () => {
  const bubbles = [
    { size: 120, top: "10%", left: "5%" },
    { size: 80, top: "25%", left: "70%" },
    { size: 100, top: "60%", left: "10%" },
    { size: 60, top: "75%", left: "50%" },
    { size: 140, top: "40%", left: "80%" },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {bubbles.map((b, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: b.size,
            height: b.size,
            borderRadius: b.size / 2,
            backgroundColor: "rgba(210, 180, 140, 0.25)",
            top: b.top,
            left: b.left,
          }}
        />
      ))}
    </View>
  );
};

//////////////////////////////////////////////////
// MAIN
//////////////////////////////////////////////////

export default function TailorChatList() {

  const auth = getAuth();
  const db = getDatabase();
  const router = useRouter();
  const user = auth.currentUser;

  const [chatList, setChatList] = useState<any[]>([]);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return "";

    const d = new Date(timestamp);
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes();
    const ampm = d.getHours() >= 12 ? "PM" : "AM";

    return `${h}:${m < 10 ? "0" + m : m} ${ampm}`;
  };

  useEffect(() => {
    if (!user) return;

    const chatRef = ref(db, "Chats");

    const unsubscribe = onValue(chatRef, async (snapshot) => {
      let promises: any[] = [];

      snapshot.forEach((child) => {
        const data = child.val();

        // ✅ ONLY TAILOR CHATS
        if (data.tailorId === user.uid) {

          const customerId = data.customerId;

          const p = new Promise((resolve) => {

            // ✅ CUSTOMER INFO
            const userRef = ref(db, "users/" + customerId);

            onValue(userRef, (snap) => {
              const val = snap.val();

              resolve({
                id: child.key,
                customerId,
                customerName: val?.fullName || "Customer",
                customerImage: val?.profileImage || null,
                lastMessage: data.lastMessage || "",
                lastTime: data.lastTime || 0,
                unreadTailor: data.unreadTailor || 0
              });

            }, { onlyOnce: true });
          });

          promises.push(p);
        }
      });

      const results: any = await Promise.all(promises);
      results.sort((a: any, b: any) => b.lastTime - a.lastTime);

      setChatList(results);
    });

    return () => unsubscribe();
  }, []);

  //////////////////////////////////////////////////
  // OPEN CHAT + RESET UNREAD
  //////////////////////////////////////////////////

  const openChat = (chat: any) => {

    // ✅ RESET UNREAD FOR TAILOR
    const chatRef = ref(db, "Chats/" + chat.id);
    update(chatRef, {
      unreadTailor: 0
    });

    router.push({
      pathname: "/TailorChatList",
      params: {
        customerId: chat.customerId,
        customerName: chat.customerName,
        customerImage: chat.customerImage
      }
    });
  };

  if (!user) return null;

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <SafeAreaView style={styles.container}>

      <BackgroundBubbles />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSub}>Your chat list</Text>
      </View>

      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, index }) => (

          <Animated.View entering={FadeInDown.delay(index * 100)}>

            <TouchableOpacity
              style={styles.chatCard}
              activeOpacity={0.85}
              onPress={() => openChat(item)}
            >

              <Image
                source={
                  item.customerImage
                    ? { uri: item.customerImage }
                    : require("../../assets/images/avatar.jpg")
                }
                style={styles.avatar}
              />

              <View style={styles.chatInfo}>

                <Text style={styles.name}>
                  {item.customerName}
                </Text>

                <View style={styles.msgRow}>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.lastMessage,
                      item.unreadTailor > 0 && styles.unreadMessage
                    ]}
                  >
                    {item.lastMessage || "Start conversation"}
                  </Text>

                  <Text style={styles.timeText}>
                    {formatTime(item.lastTime)}
                  </Text>

                </View>
              </View>

              {item.unreadTailor > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadTailor}
                  </Text>
                </View>
              )}

            </TouchableOpacity>

          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

//////////////////////////////////////////////////
// STYLES (CUSTOMER SAME)
//////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  header: {
    paddingTop: 55,
    paddingBottom: 25,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff"
  },

  headerSub: {
    fontSize: 13,
    color: "#e7d8cc",
    marginTop: 4
  },

  listContainer: {
    padding: 16
  },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    elevation: 4
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28
  },

  chatInfo: {
    flex: 1,
    marginLeft: 12
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary
  },

  msgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6
  },

  lastMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1
  },

  unreadMessage: {
    fontWeight: "700",
    color: "#000"
  },

  timeText: {
    fontSize: 11,
    color: "#9e9e9e"
  },

  badge: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center"
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  }

});