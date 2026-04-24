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
const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const uploadToCloudinary = async (uri: string) => {
  const data = new FormData();

  data.append("file", {
    uri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as any);

  data.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
    { method: "POST", body: data }
  );

  const json = await res.json();
  return json.secure_url;
};

//////////////////////////////////////////////////
// DATE FORMAT
//////////////////////////////////////////////////

const formatDateLabel = (timestamp: number) => {
  const d = new Date(timestamp);
  const today = new Date();

  if (d.toDateString() === today.toDateString()) return "Today";

  const y = new Date();
  y.setDate(today.getDate() - 1);

  if (d.toDateString() === y.toDateString()) return "Yesterday";

  return d.toLocaleDateString();
};

//////////////////////////////////////////////////
// BACKGROUND
//////////////////////////////////////////////////

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

export default function CustomerChat() {
  const { tailorId, tailorName, tailorImage, tailorPhone } =
    useLocalSearchParams();

  const auth = getAuth();
  const db = getDatabase();
  const user = auth.currentUser;
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [picking, setPicking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [online, setOnline] = useState(false);

  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [replyMsg, setReplyMsg] = useState<any>(null);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);

  const flatRef = useRef<FlatList>(null);
   useEffect(() => {
  if (!modalVisible) {
    setSelectedMsg(null);
  }
}, [modalVisible]);
  if (!user || !tailorId) return null;

  const otherUserId = String(tailorId);

  const chatId =
    user.uid < otherUserId
      ? user.uid + "_" + otherUserId
      : otherUserId + "_" + user.uid;

  //////////////////////////////////////////////////
  // ONLINE STATUS
  //////////////////////////////////////////////////

  useEffect(() => {
    const statusRef = ref(db, `status/${otherUserId}`);

    return onValue(statusRef, (snap) => {
      setOnline(snap.val()?.online || false);
    });
  }, [otherUserId, db]);

  //////////////////////////////////////////////////
  // LOAD MESSAGES
  //////////////////////////////////////////////////

  useEffect(() => {
    const msgRef = ref(db, "Messages/" + chatId);

    const unsub = onValue(msgRef, (snap) => {
      const data = snap.val();

      if (!data) {
        setMessages([]);
        return;
      }

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
  }, [chatId, db, deletedForMeIds, user.uid]);

  //////////////////////////////////////////////////
  // SEND
  //////////////////////////////////////////////////

  const sendMessage = async (extra: any = {}) => {
    if (!text.trim() && !extra.image && !extra.file) return;

    const newMsg = push(ref(db, "Messages/" + chatId));

    await set(newMsg, {
      text,
      senderId: user.uid,
      createdAt: Date.now(),
      seen: false,
      replyTo: replyMsg
        ? {
            text: replyMsg.text || replyMsg.fileName || "Attachment",
            senderId: replyMsg.senderId,
          }
        : null,
      deleted: false,
      ...extra,
    });

    update(ref(db, "Chats/" + chatId), {
      lastMessage: text || extra.fileName || "📎 file",
      lastTime: Date.now(),
      customerId: user.uid,
      tailorId: otherUserId,
    });
const chatRef = ref(db, "Chats/" + chatId);

onValue(chatRef, (snap) => {
  const data = snap.val() || {};

  update(chatRef, {
    lastMessage: text || extra.fileName || "📎 file",
    lastTime: Date.now(),
    customerId: user.uid,
    tailorId: otherUserId,

    // 🔥 YE LINE ADD KARO (MAIN FIX)
    unreadTailor: (data.unreadTailor || 0) + 1,

    // 🔥 sender ho → apna reset
    unreadCustomer: 0
  });
}, { onlyOnce: true });
    setText("");
    setReplyMsg(null);
  };

  //////////////////////////////////////////////////
  // DELETE ACTIONS
  //////////////////////////////////////////////////

  const handleDeleteForMe = () => {
    if (!selectedMsg) return;

    setDeletedForMeIds((prev) =>
      prev.includes(selectedMsg.id) ? prev : [...prev, selectedMsg.id]
    );

    setModalVisible(false);
    setSelectedMsg(null);
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMsg) return;

    await update(ref(db, `Messages/${chatId}/${selectedMsg.id}`), {
      deleted: true,
      text: "",
      image: null,
      file: null,
      fileName: "",
      replyTo: null,
    });

    setModalVisible(false);
    setSelectedMsg(null);
  };

  const handleReply = () => {
    if (!selectedMsg) return;

    setReplyMsg(selectedMsg);
    setModalVisible(false);
  };

  //////////////////////////////////////////////////
  // IMAGE
  //////////////////////////////////////////////////

  const pickImage = async () => {
    if (picking) return;
    setPicking(true);

    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!res.canceled) {
        const url = await uploadToCloudinary(res.assets[0].uri);
        await sendMessage({ image: url });
      }
    } catch (e) {
      console.log("Image error:", e);
    }

    setPicking(false);
  };

  //////////////////////////////////////////////////
  // FILE
  //////////////////////////////////////////////////

  

  //////////////////////////////////////////////////
  // CALL
  //////////////////////////////////////////////////

  const makeCall = () => {
    if (tailorPhone) Linking.openURL(`tel:${tailorPhone}`);
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
          activeOpacity={0.9}
          onLongPress={() => {
            setSelectedMsg(item);
            setModalVisible(true);
          }}
          style={[
            styles.msg,
            isMe ? styles.my : styles.their,
            selectedMsg?.id === item.id && styles.selectedMsg,
          ]}
        >
          {item.deleted ? (
            <Text style={styles.deletedText}>This message was deleted</Text>
          ) : (
            <>
              {item.replyTo && (
                <View style={styles.replyPreviewBox}>
                  <Text style={styles.replyPreviewText} numberOfLines={1}>
                    ↩ {item.replyTo?.text}
                  </Text>
                </View>
              )}

              {item.text ? <Text>{item.text}</Text> : null}

              {item.image && (
                <Image source={{ uri: item.image }} style={styles.img} />
              )}

              {item.file && (
                <Text style={styles.fileText}>
                  📎 {item.fileName || "Open File"}
                </Text>
              )}
            </>
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

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
          </TouchableOpacity>

          <Image source={{ uri: String(tailorImage) }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{String(tailorName || "")}</Text>
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {online ? "🟢 Online" : "Offline"}
            </Text>
          </View>

          <TouchableOpacity onPress={makeCall}>
            <MaterialCommunityIcons name="phone" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {replyMsg && (
          <View style={styles.replyBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.replyingTitle}>Replying to message</Text>
              <Text numberOfLines={1}>
                {replyMsg.text || replyMsg.fileName || "Attachment"}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setReplyMsg(null)}>
              <MaterialCommunityIcons name="close" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          key={refreshKey}
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage}>
            <MaterialCommunityIcons name="image" size={24} />
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

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
  setModalVisible(false);
  setSelectedMsg(null); // ADD THIS
}}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
           onPress={() => {
  setModalVisible(false);
  setSelectedMsg(null); // ADD THIS
}}

            
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={handleDeleteForMe}
              >
                <Text style={styles.modalText}>Delete for you</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={handleDeleteForEveryone}
              >
                <Text style={styles.modalText}>Delete for everyone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={handleReply}
              >
                <Text style={styles.modalText}>Reply</Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
    gap: 10,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.primary
  },

  title: { color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1 },

  avatar: { width: 36, height: 36, borderRadius: 18 },

  msg: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
    maxWidth: "75%"
  },

  my: { alignSelf: "flex-end", backgroundColor: "#d6bfae" },

  their: { alignSelf: "flex-start", backgroundColor: "#fff" },

  selectedMsg: {
    width: "100%",
    maxWidth: "100%",
    backgroundColor: "#ffe0b2"
  },

  img: { width: 180, height: 180, borderRadius: 10, marginTop: 4 },

  fileText: {
    color: "blue",
    marginTop: 4
  },

  deletedText: {
    color: "#777",
    fontStyle: "italic"
  },

  replyPreviewBox: {
    backgroundColor: "#f1e5d7",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6
  },

  replyPreviewText: {
    fontSize: 12,
    color: "#555"
  },

  replyingTitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600"
  },

  dateLabel: {
    alignSelf: "center",
    marginVertical: 10,
    fontSize: 12,
    color: "#777"
  },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    backgroundColor: "#fff"
  },

  input: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginHorizontal: 8
  },

  send: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 20
  },

  replyBox: {
    backgroundColor: "#f3ede6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#e2d7ca",
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },

  modalBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 8
  },

  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14
  },

  modalText: {
    fontSize: 16,
    color: "#2d2d2d"
  },

  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(210,180,140,0.25)",
    top: 50,
    left: -80
  },

  circle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(210,180,140,0.2)",
    bottom: 100,
    right: -60
  },

  circle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(210,180,140,0.2)",
    top: 300,
    left: 120
  }
});