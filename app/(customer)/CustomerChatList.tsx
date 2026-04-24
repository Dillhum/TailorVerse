// app/CustomerChatList.tsx

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
// ✅ UPDATED GLASS BUBBLES (MORE FILLED)
//////////////////////////////////////////////////

const BackgroundBubbles = () => {
  const bubbles = [
    { size: 120, top: "10%", left: "5%" },
    { size: 80, top: "25%", left: "70%" },
    { size: 100, top: "60%", left: "10%" },
    { size: 60, top: "75%", left: "50%" },
    { size: 140, top: "40%", left: "80%" },
    { size: 90, top: "85%", left: "20%" },
    { size: 70, top: "15%", left: "40%" },
    { size: 110, top: "55%", left: "60%" },

    // 🔥 NEW BUBBLES (empty space fill)
    { size: 95, top: "35%", left: "20%" },
    { size: 75, top: "70%", left: "75%" },
    { size: 65, top: "5%", left: "55%" },
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
// MAIN SCREEN
//////////////////////////////////////////////////

export default function CustomerChatList() {

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

        if (data.customerId === user.uid) {
          const tailorId = data.tailorId;

          const p = new Promise((resolve) => {
            const tailorRef = ref(db, "Tailorusers/" + tailorId);

            onValue(
              tailorRef,
              (snap) => {
                const val = snap.val();

                resolve({
                  id: child.key,
                  tailorId,
                  tailorName: val?.fullName || "Tailor",
                  tailorImage: val?.profileImage || val?.profileImg || null,
                  tailorPhone: val?.phone || "",
                  lastMessage: data.lastMessage || "",
                  lastTime: data.lastTime || 0,
                  unreadCustomer: data.unreadCustomer || 0
                });
              },
              { onlyOnce: true }
            );
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

  const openChat = (chat: any) => {

    // ✅ ADD THIS (UNREAD RESET)
  const chatRef = ref(db, "Chats/" + chat.id);
  update(chatRef, {
    unreadCustomer: 0
  });
    router.push({
      pathname: "/CustomerChat",
      params: {
        tailorId: chat.tailorId,
        tailorName: chat.tailorName,
        tailorImage: chat.tailorImage,
        tailorPhone: chat.tailorPhone
      }
    });
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>

      {/* ✅ UPDATED BACKGROUND */}
      <BackgroundBubbles />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Tailors</Text>
        <Text style={styles.headerSub}>Chat with your tailors</Text>
      </View>

      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (

          <Animated.View entering={FadeInDown.delay(index * 100)}>

            <TouchableOpacity
              style={styles.chatCard}
              activeOpacity={0.85}
              onPress={() => openChat(item)}
            >

              <View style={styles.avatarContainer}>
                <Image
                  source={
                    item.tailorImage
                      ? { uri: item.tailorImage }
                      : require("../../assets/images/avatar.jpg")
                  }
                  style={styles.avatar}
                />
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.chatInfo}>
                <Text style={styles.tailorName}>
                  {item.tailorName}
                </Text>

                <View style={styles.msgRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.lastMessage,
                      item.unreadCustomer > 0 && styles.unreadMessage
                    ]}
                  >
                    {item.lastMessage || "Start conversation"}
                  </Text>

                  <Text style={styles.timeText}>
                    {formatTime(item.lastTime)}
                  </Text>
                </View>
              </View>

              {item.unreadCustomer > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadCustomer}
                  </Text>
                </View>
              )}

            </TouchableOpacity>

          </Animated.View>

        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No chats yet
          </Text>
        }
      />

    </SafeAreaView>
  );
}

//////////////////////////////////////////////////
// STYLES
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
    padding: 16,
    paddingTop: 20
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

  avatarContainer: {
    position: "relative"
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff"
  },

  chatInfo: {
    flex: 1,
    marginLeft: 12
  },

  tailorName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary
  },

  msgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6
  },

  lastMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8
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
    justifyContent: "center",
    paddingHorizontal: 6
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },

  emptyText: {
    textAlign: "center",
    marginTop: 150,
    fontSize: 15,
    color: COLORS.textPrimary,
    opacity: 0.7
  }

});