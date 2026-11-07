import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { AppBar } from "../src/components/AppBar";
import { Button } from "../src/components/Button";
import { Toggle } from "../src/components/Toggle";
import { scheduleStyles } from "../src/features/notifications/scheduleStyles";
import {
  DEFAULT_SCHEDULE_SLOTS,
  ScheduleSlot,
} from "../src/notifications";

export default function ScheduleScreen(): React.JSX.Element {
  const router = useRouter();
  const [slots, setSlots] = useState<ScheduleSlot[]>(DEFAULT_SCHEDULE_SLOTS);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const toggleSlot = (id: string, enabled: boolean) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, enabled } : slot))
    );
  };

  const handleAddPersonalReminder = () => {
    const newSlot: ScheduleSlot = {
      id: `slot-personal-${Date.now()}`,
      local_time: "15:30",
      period_label: "Collation",
      product_name: "Plumpy'Nut",
      quantity: "1",
      unit: "sachet",
      enabled: true,
      is_prescribed: false,
    };
    setSlots((prev) => [...prev, newSlot]);
    setAddedNotice("Rappel personnel ajouté à 15:30");
  };

  return (
    <View style={scheduleStyles.container}>
      <AppBar
        title="Rappels d'Amina"
        onBack={() => router.back()}
        rightIcon="clock"
        rightAccessibilityLabel="Heures prévues"
      />

      <ScrollView contentContainerStyle={scheduleStyles.content}>
        <View style={scheduleStyles.prescribedCard} testID="prescribed-plan-card">
          <View style={scheduleStyles.prescribedHeader}>
            <FontAwesome5 name="clipboard-check" size={16} color="#1B5E20" />
            <Text style={scheduleStyles.prescribedTitle}>
              Plan prescrit par Dr. Mbarga
            </Text>
          </View>
          <Text style={scheduleStyles.prescribedDetails}>
            3 prises par jour de Plumpy'Nut (1 sachet par prise)
          </Text>
          <Text style={scheduleStyles.prescribedDates}>
            Du 10 nov. au 24 nov. 2026
          </Text>
        </View>

        <View style={scheduleStyles.slotsList}>
          {slots.map((slot) => (
            <View key={slot.id} style={scheduleStyles.slotCard} testID={`slot-${slot.id}`}>
              <View style={scheduleStyles.slotLeft}>
                <View style={scheduleStyles.timeBox}>
                  <Text style={scheduleStyles.timeText}>{slot.local_time}</Text>
                </View>
                <View style={scheduleStyles.slotInfo}>
                  <Text style={scheduleStyles.periodLabel}>{slot.period_label}</Text>
                  <Text style={scheduleStyles.productLabel}>
                    {slot.quantity} {slot.unit} {slot.product_name}
                  </Text>
                </View>
              </View>

              <Toggle
                value={slot.enabled}
                onValueChange={(val) => toggleSlot(slot.id, val)}
                testID={`toggle-slot-${slot.id}`}
              />
            </View>
          ))}
        </View>

        {addedNotice ? (
          <Text
            style={[scheduleStyles.prescribedDates, { textAlign: "center", marginBottom: 12 }]}
            testID="notice-added"
          >
            {addedNotice}
          </Text>
        ) : null}

        <TouchableOpacity
          style={scheduleStyles.addPersonalReminderBtn}
          onPress={handleAddPersonalReminder}
          testID="btn-add-reminder"
        >
          <Text style={scheduleStyles.addPersonalReminderText}>
            + Ajouter un rappel personnel
          </Text>
        </TouchableOpacity>

        <View style={scheduleStyles.bottomActionContainer}>
          <Button
            title="Réglages des notifications"
            variant="outline"
            onPress={() => router.push("/u-notif-settings")}
            testID="btn-to-settings"
          />
        </View>
      </ScrollView>
    </View>
  );
}
