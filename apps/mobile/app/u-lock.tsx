import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { lockStyles } from "../src/features/notifications/lockStyles";
import {
  handleNotificationActionResponse,
  NOTIF_ACTIONS,
  IntakeNotificationPayload,
} from "../src/notifications";

export default function LockScreen(): React.JSX.Element {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);

  const payload: IntakeNotificationPayload = {
    person_id: "person-amina",
    person_name: "Amina",
    schedule_time_id: "slot-noon",
    product_name: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    time_label: "12:30",
    is_followup: false,
  };

  const handleAction = async (actionId: string) => {
    const outcome = await handleNotificationActionResponse(actionId, payload, {
      push: (href: string) =>
        router.push(href as Parameters<typeof router.push>[0]),
      replace: (href: string) =>
        router.replace(href as Parameters<typeof router.replace>[0]),
    });
    if (outcome === "snoozed") {
      setFeedback("Rappel reporté de 15 minutes");
    }
  };

  return (
    <SafeAreaView style={lockStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={lockStyles.clockContainer}>
          <Text style={lockStyles.clockTime}>12:30</Text>
          <Text style={lockStyles.clockDate}>Jeudi 12 novembre</Text>
        </View>

        <View style={lockStyles.notificationCard} testID="lock-notification-card">
          <View style={lockStyles.cardHeader}>
            <View style={lockStyles.brandTag}>
              <FontAwesome5 name="bell" size={12} color="#1B5E20" />
              <Text style={lockStyles.brandText}>TSOTSA KIDS • maintenant</Text>
            </View>
            <Text style={lockStyles.timeTag}>12:30</Text>
          </View>

          <Text style={lockStyles.cardTitle}>Rappel pour Amina</Text>
          <Text style={lockStyles.cardBody}>
            C'est l'heure de la prise de Plumpy'Nut (1 sachet).{"\n"}
            Prenez une photo de l'emballage après la prise.
          </Text>

          {feedback ? (
            <Text
              style={[lockStyles.brandText, { marginBottom: 12 }]}
              testID="feedback-text"
            >
              {feedback}
            </Text>
          ) : null}

          <View style={lockStyles.actionRow}>
            <TouchableOpacity
              style={[lockStyles.actionButton, lockStyles.actionButtonPrimary]}
              onPress={() => handleAction(NOTIF_ACTIONS.GIVE_NOW)}
              testID="btn-give-now"
            >
              <Text style={lockStyles.actionTextPrimary}>C'est donné</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={lockStyles.actionButton}
              onPress={() => handleAction(NOTIF_ACTIONS.SNOOZE)}
              testID="btn-snooze"
            >
              <Text style={lockStyles.actionTextSecondary}>Plus tard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[lockStyles.actionButton, lockStyles.actionButtonDestructive]}
              onPress={() => handleAction(NOTIF_ACTIONS.NOT_GIVEN)}
              testID="btn-not-given"
            >
              <Text style={lockStyles.actionTextDestructive}>Pas donné</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={lockStyles.previousCard}>
          <Text style={lockStyles.previousText}>
            10:15 • Prise du matin confirmée (1 sachet)
          </Text>
          <FontAwesome5 name="check-circle" size={14} color="#81C784" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
