import { LinearGradient } from "expo-linear-gradient";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, database } from "../firebaseConfig";
import { COLORS } from "../theme/colors";

/* ================= MAIN SCREEN ================= */

export default function TailorOrders() {
  const [activeTab, setActiveTab] = useState("new");
  const [orders, setOrders] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(database, "Orders");

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      let list: any[] = [];

      snapshot.forEach((child) => {
        const data = child.val();

        if (data.tailorId === user.uid) {
          list.push({
            id: child.key,
            ...data,
          });
        }
      });

      setOrders(list);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(
    (order) => order.status === activeTab
  );

 const updateStatus = async (id: string, newStatus: string, item:any) => {

  // 🔴 EXISTING CODE (same)
  await update(ref(database, "Orders/" + id), {
    status: newStatus,
  });

  // ✅ SIRF YEH ADD HOGA (EMAIL)
  if(newStatus === "completed"){
    try{
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    service_id: "service_f119dql",
    template_id: "template_9uh2xfb",
    user_id: "JYq5PoScSVLkM1fhd",
    template_params: {
      to_email: item.customerEmail || item.email || item.userEmail,
      name: item.name
    }
  })
});

// 🔥 THIS IS THE REAL DEBUG
const text = await res.text();
console.log("EMAIL RESPONSE:", text);
      console.log("Completion Email Sent");
    }catch(e){
      console.log("Email Error:", e);
    }
  }
};
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Orders</Text>

      {/* TABS */}
      <View style={styles.tabs}>
        {["new", "inProgress", "completed"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={{
                color:
                  activeTab === tab
                    ? "#fff"
                    : COLORS.primary,
                fontWeight: "600",
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <OrderCard
            item={item}
            index={index}
            updateStatus={updateStatus}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No Orders Found
          </Text>
        }
      />
    </SafeAreaView>
  );
}

/* ================= ORDER CARD ================= */

const OrderCard = ({ item, index, updateStatus }: any) => {
  const translateX = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderRow = (label: string, value: string) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.customerName}>
          {item.name || item.customerName || "Customer"}
        </Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* FULL DETAILS */}
      {renderRow("Phone", item.phone || item.customerPhone || "-")}
      {renderRow(
        "Address",
        `${item.address || "-"}, ${item.city || "-"}`
      )}
      {renderRow(
        "Category",
        item.category || item.suitType || "-"
      )}
      {renderRow(
        "Style",
        item.style || item.dressType || "-"
      )}
      {renderRow(
        "Fabric",
        `${item.colorName || "-"} / ${item.fabric || "-"}`
      )}
      {renderRow(
        "Delivery",
        item.deliveryDate || "-"
      )}

      {/* MEASUREMENTS */}
      {item.measurements &&
        typeof item.measurements === "object" && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Measurements</Text>
            {Object.entries(item.measurements).map(
              ([key, value]: any) => (
                <Text style={styles.value} key={key}>
                  • {key}: {value} in
                </Text>
              )
            )}
          </View>
        )}

      {/* NOTES */}
      {item.notes ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{item.notes}</Text>
        </View>
      ) : null}

      {/* BUTTON */}
      {item.status !== "completed" && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            updateStatus(
              item.id,
              item.status === "new"
                ? "inProgress"
                : "completed",
                  item   
            )
          }
        >
          <LinearGradient
            colors={[
              COLORS.gradientStart,
              COLORS.gradientEnd,
            ]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {item.status === "new"
                ? "Start Stitching"
                : "Mark Completed"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },

  heading: {
    paddingTop:30,
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  tabs: {
    flexDirection: "row",
    marginBottom: 16,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginHorizontal: 4,
  },

  activeTab: {
    backgroundColor: COLORS.primary,
  },

  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,

    borderWidth: 1.5,
    borderColor: COLORS.border,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    elevation: 6,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  value: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },

  statusBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  button: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textSecondary,
  },
});