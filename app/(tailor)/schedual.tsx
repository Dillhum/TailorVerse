import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { getDatabase, onValue, ref, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { COLORS } from "../theme/colors";

export default function TailorScheduleScreen() {
  const auth = getAuth();
  const db = getDatabase();
  const tailorId = auth.currentUser?.uid ?? null;

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [bookings, setBookings] = useState<any[]>([]);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [weeklyOff, setWeeklyOff] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!tailorId) return;

    // ✅ READ FROM Orders (NOT bookings)
    const ordersRef = ref(db, "Orders");

    onValue(ordersRef, (snap) => {
      const data = snap.val() || {};

      const list = Object.entries(data).map(([id, v]: any) => ({
        id,
        ...v,
      }));

      // Only this tailor's orders
      const tailorOrders = list.filter(
        (o: any) => o.tailorId === tailorId
      );

      setBookings(tailorOrders);
    });

    // Availability
    onValue(ref(db, `tailorAvailability/${tailorId}`), (snap) => {
      const v = snap.val();
      if (!v) return;

      setAcceptingOrders(v.acceptingOrders ?? true);
      setWeeklyOff(v.weeklyOff ?? []);
      if (v.startTime) setStartTime(new Date(v.startTime));
      if (v.endTime) setEndTime(new Date(v.endTime));
    });
  }, [tailorId]);

  /* ================= SAVE SCHEDULE ================= */

  const saveSchedule = async () => {
    if (!tailorId) return;

    await update(ref(db, `tailorAvailability/${tailorId}`), {
      acceptingOrders,
      weeklyOff,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });

    alert("Schedule Saved ✅");
  };

  /* ================= HELPERS ================= */

  const toggleDay = (d: string) => {
    setWeeklyOff((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  // ✅ DATE MATCH (ISO format expected: YYYY-MM-DD)
  const todays = bookings.filter(
    (b: any) => b.deliveryDate === selectedDate
  );

  // Calendar dots
  const marked: any = {};
  bookings.forEach((b: any) => {
    if (b.deliveryDate) {
      marked[b.deliveryDate] = {
        marked: true,
        dotColor: "#5C2E00",
      };
    }
  });

  marked[selectedDate] = {
    ...marked[selectedDate],
    selected: true,
    selectedColor: "#5C2E00",
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.big}>WORK SCHEDULE</Text>

      <Calendar
        markedDates={marked}
        onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
      />

      {/* ================= BOOKINGS ================= */}

      <Text style={styles.section}>
        Bookings on {selectedDate}
      </Text>

      {todays.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ color: COLORS.textSecondary}}>
            No bookings for this date
          </Text>
        </View>
      ) : (
        <FlatList
          data={todays}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingName}>
                  {item.name || "Customer"}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Phone:</Text>
              <Text>{item.phone || "Not Provided"}</Text>

              <Text style={styles.label}>Style:</Text>
              <Text>{item.style || "-"}</Text>

              <Text style={styles.label}>Category:</Text>
              <Text>{item.category || "-"}</Text>

              <Text style={styles.label}>Address:</Text>
              <Text>
                {item.address}, {item.city}
              </Text>
            </View>
          )}
        />
      )}

      {/* ================= AVAILABILITY ================= */}

      <Text style={styles.section}>Availability</Text>

      <View style={styles.row}>
        <Text>Accepting Orders</Text>
        <Switch
          value={acceptingOrders}
          onValueChange={setAcceptingOrders}
        />
      </View>

      <Text style={styles.sub}>Working Hours</Text>

      <TouchableOpacity onPress={() => setShowStart(true)}>
        <Text style={styles.timeBtn}>
          Start: {fmt(startTime)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowEnd(true)}>
        <Text style={styles.timeBtn}>
          End: {fmt(endTime)}
        </Text>
      </TouchableOpacity>

      {showStart && (
        <DateTimePicker
          value={startTime}
          mode="time"
          onChange={(_, d) => {
            setShowStart(false);
            if (d) setStartTime(d);
          }}
        />
      )}

      {showEnd && (
        <DateTimePicker
          value={endTime}
          mode="time"
          onChange={(_, d) => {
            setShowEnd(false);
            if (d) setEndTime(d);
          }}
        />
      )}

      <Text style={styles.sub}>Weekly Off</Text>

      <View style={styles.days}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.day,
              weeklyOff.includes(d) && styles.dayOn,
            ]}
            onPress={() => toggleDay(d)}
          >
            <Text
              style={{
                color: weeklyOff.includes(d)
                  ? "white"
                  : "#333",
              }}
            >
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
  onPress={saveSchedule}
  style={{ borderRadius: 12, overflow: "hidden", marginTop: 16 }}
>
  <LinearGradient
    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.saveBtn}
  >
    <Text style={{ color: COLORS.card, fontWeight: "bold" }}>
      SAVE SCHEDULE
    </Text>
  </LinearGradient>
</TouchableOpacity>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    backgroundColor: COLORS.background,
    paddingTop: 36,
  },

  big: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
  },

  section: {
    fontSize: 18,
    fontWeight: "700",
   color: COLORS.primary,
    marginTop: 14,
  },

  sub: {
    fontSize: 15,
    color: COLORS.primary,
    marginTop: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  emptyCard: {
backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },

  bookingCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 14,
    marginVertical: 8,
    elevation: 3,
  },

  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  bookingName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  label: {
    fontWeight: "bold",
    marginTop: 6,
  },

  statusBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  timeBtn: {
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },

  days: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },

  day: {
    padding: 10,
    borderWidth: 1,
   borderColor: COLORS.primary,
    borderRadius: 8,
  },

  dayOn: {
    backgroundColor: "#5C2E00",
  },

 saveBtn: {
  padding: 14,
  alignItems: "center",
},
});