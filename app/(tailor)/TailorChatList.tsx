// app/TailorChat.tsx

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
    getDatabase,
    onValue,
    push,
    ref,
    set,
    update,
} from "firebase/database";

import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";

//////////////////////////////////////////////////
// CLOUDINARY
//////////////////////////////////////////////////

const CLOUD_NAME = "dcu5kjqfj";
const UPLOAD_PRESET = "tailor_unsigned";

const uploadToCloudinary = async (uri: string) => {
  try {
    const data = new FormData();

    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);

    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();

    if (!json.secure_url) throw new Error("Upload failed");

    return json.secure_url;
  } catch (e) {
    console.log("Cloudinary error:", e);
    return null;
  }
};

//////////////////////////////////////////////////
// TIME / DATE
//////////////////////////////////////////////////

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateLabel = (timestamp: number) => {
  const d = new Date(timestamp);
  const today = new Date();

  if (d.toDateString() === today.toDateString()) return "Today";

  const y = new Date();
  y.setDate(today.getDate() - 1);

  if (d.toDateString() === y.toDateString()) return "Yesterday";

  return d.toLocaleDateString();
};

const BackgroundBubbles = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <View style={styles.circle1} />
    <View style={styles.circle2} />
    <View style={styles.circle3} />
  </View>
);

//////////////////////////////////////////////////
// MAIN
//////////////////////////////////////////////////

export default function TailorChat() {

  const { customerId, customerName, customerImage, customerPhone } =
    useLocalSearchParams();

  const auth = getAuth();
  const db = getDatabase();
  const user = auth.currentUser;
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [picking, setPicking] = useState(false);
  const [online, setOnline] = useState(false);

  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [replyMsg, setReplyMsg] = useState<any>(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);

  const flatRef = useRef<FlatList>(null);

  if (!user || !customerId) return null;

  const otherUserId = String(customerId);

  const chatId =
    user.uid < otherUserId
      ? user.uid + "_" + otherUserId
      : otherUserId + "_" + user.uid;

  //////////////////////////////////////////////////
  // ONLINE
  //////////////////////////////////////////////////

  useEffect(() => {
    const statusRef = ref(db, `status/${otherUserId}`);
    return onValue(statusRef, (snap) => {
      setOnline(snap.val()?.online || false);
    });
  }, []);

  //////////////////////////////////////////////////
  // LOAD MESSAGES
  //////////////////////////////////////////////////

  useEffect(() => {
    const msgRef = ref(db, "Messages/" + chatId);

    const unsub = onValue(msgRef, (snap) => {
      const data = snap.val();

      if (!data) return setMessages([]);

      const list = Object.keys(data).map((k) => ({
        id: k,
        ...data[k],
      }));

      list.sort((a, b) => a.createdAt - b.createdAt);

      const visibleList = list.filter((m) => !deletedForMeIds.includes(m.id));

      setMessages([...visibleList]);

      visibleList.forEach((m) => {
        if (m.senderId !== user.uid && !m.seen && !m.deleted) {
          update(ref(db, `Messages/${chatId}/${m.id}`), {
            seen: true,
          });
        }
      });

      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    return () => unsub();
  }, [chatId, deletedForMeIds]);

  //////////////////////////////////////////////////
  // SEND MESSAGE
  //////////////////////////////////////////////////

  const sendMessage = async (extra: any = {}) => {
    if (!text.trim() && !extra.image) return;

    const newMsg = push(ref(db, "Messages/" + chatId));

    await set(newMsg, {
      text,
      senderId: user.uid,
      createdAt: Date.now(),
      seen: false,
      replyTo: replyMsg
        ? {
            text: replyMsg.text || "Attachment",
            senderId: replyMsg.senderId,
          }
        : null,
      deleted: false,
      ...extra,
    });

    const chatRef = ref(db, "Chats/" + chatId);

onValue(chatRef, (snap) => {
  const data = snap.val() || {};

  update(chatRef, {
    lastMessage: text || "📷 Image",
    lastTime: Date.now(),
    customerId: otherUserId,
    tailorId: user.uid,

    
    unreadCustomer: (data.unreadCustomer || 0) + 1,
  });
}, { onlyOnce: true });
    setText("");
    setReplyMsg(null);
  };

  //////////////////////////////////////////////////
  // IMAGE
  //////////////////////////////////////////////////

  const pickImage = async () => {
    if (picking) return;
    setPicking(true);

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled && res.assets?.length > 0) {
      const url = await uploadToCloudinary(res.assets[0].uri);
      if (url) await sendMessage({ image: url });
    }

    setPicking(false);
  };

  //////////////////////////////////////////////////
  // ACTIONS
  //////////////////////////////////////////////////

  const handleLongPress = (msg: any) => {
    setSelectedMsg(msg);
    setModalVisible(true);
  };

  const deleteForMe = () => {
    setDeletedForMeIds((prev) => [...prev, selectedMsg.id]);
    setModalVisible(false);
  };

  const deleteForEveryone = async () => {
    await update(ref(db, `Messages/${chatId}/${selectedMsg.id}`), {
      deleted: true,
      text: "This message was deleted",
      image: null,
    });
    setModalVisible(false);
  };

  const replyToMessage = () => {
    setReplyMsg(selectedMsg);
    setModalVisible(false);
  };

  //////////////////////////////////////////////////
  // CALL
  //////////////////////////////////////////////////

  const makeCall = () => {
    if (customerPhone) Linking.openURL(`tel:${customerPhone}`);
  };

  //////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////

  const renderItem = ({ item, index }: any) => {
    const isMe = item.senderId === user.uid;

    const showDate =
      index === 0 ||
      formatDateLabel(item.createdAt) !==
        formatDateLabel(messages[index - 1]?.createdAt);

    return (
      <View>
        {showDate && (
          <Text style={styles.dateLabel}>
            {formatDateLabel(item.createdAt)}
          </Text>
        )}

        <TouchableOpacity
          onLongPress={() => handleLongPress(item)}
          style={[styles.msg, isMe ? styles.my : styles.their]}
        >
          {item.text && <Text>{item.text}</Text>}

          {item.image && (
            <Image source={{ uri: item.image }} style={styles.img} />
          )}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4 }}>
  
  <Text style={{ fontSize: 10, color: "#777", marginRight: 5 }}>
    {formatTime(item.createdAt)}
  </Text>

  {isMe && !item.deleted && (
    <MaterialCommunityIcons
      name={
        item.seen
          ? "check-all"
          : online
          ? "check-all"
          : "check"
      }
      size={14}
      color={item.seen ? "#2196F3" : "#999"}
    />
  )}

</View>
        </TouchableOpacity>
      </View>
    );
  };

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <SafeAreaView style={styles.container}>
        <BackgroundBubbles />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
          </TouchableOpacity>

          <Image source={{ uri: String(customerImage) }} style={styles.avatar} />
          <Text style={styles.title}>{String(customerName)}</Text>

          <TouchableOpacity onPress={makeCall}>
            <MaterialCommunityIcons name="phone" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* CHAT */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
        />

        {/* REPLY BAR */}
        {replyMsg && (
          <View style={{ padding: 8, backgroundColor: "#eee" }}>
            <Text>Replying: {replyMsg.text || "Image"}</Text>
            <TouchableOpacity onPress={() => setReplyMsg(null)}>
              <Text style={{ color: "red" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage}>
            <MaterialCommunityIcons name="image" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type message..."
            style={styles.input}
          />

          <TouchableOpacity style={styles.send} onPress={() => sendMessage()}>
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* POPUP */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.popup}>
              <TouchableOpacity onPress={replyToMessage}>
                <Text style={styles.popupText}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={deleteForMe}>
                <Text style={styles.popupText}>Delete for me</Text>
              </TouchableOpacity>

              {selectedMsg?.senderId === user.uid && (
                <TouchableOpacity onPress={deleteForEveryone}>
                  <Text style={styles.popupText}>Delete for everyone</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

//////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.primary,
    gap: 10,
  },

  title: { color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },

  msg: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
    maxWidth: "75%",
  },

  my: { alignSelf: "flex-end", backgroundColor: "#d6bfae" },
  their: { alignSelf: "flex-start", backgroundColor: "#fff" },

  img: { width: 180, height: 180, borderRadius: 10 },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  input: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginHorizontal: 8,
  },

  send: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    width: 200,
  },

  popupText: {
    paddingVertical: 10,
    fontSize: 14,
  },

  dateLabel: {
    alignSelf: "center",
    marginVertical: 10,
    fontSize: 12,
    color: "#777",
  },

  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(210,180,140,0.25)", top: 50, left: -80 },
  circle2: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(210,180,140,0.2)", bottom: 100, right: -60 },
  circle3: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(210,180,140,0.2)", top: 300, left: 120 },
});