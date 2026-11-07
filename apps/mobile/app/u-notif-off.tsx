import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { AppBar } from "../src/components/AppBar";
import { Toggle } from "../src/components/Toggle";
import { settingsStyles } from "../src/features/notifications/settingsStyles";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  DEFAULT_PREFERENCES,
} from "../src/notifications";

export default function NotifOffScreen(): React.JSX.Element {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_PREFERENCES,
    reminders_enabled: false,
    followup_enabled: false,
  });

  useEffect(() => {
    void loadNotificationPreferences().then((loaded) => {
      setPrefs({ ...loaded, reminders_enabled: false, followup_enabled: false });
    });
  }, []);

  const handleToggleReminders = (enabled: boolean) => {
    const updated = {
      ...prefs,
      reminders_enabled: enabled,
      followup_enabled: enabled,
    };
    setPrefs(updated);
    void saveNotificationPreferences(updated);
    if (enabled) {
      router.replace("/u-notif-settings");
    }
  };

  return (
    <View style={settingsStyles.container}>
      <AppBar title="Notifications" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={settingsStyles.content}>
        <View style={settingsStyles.warningCard} testID="warning-caregiver-card">
          <FontAwesome5 name="exclamation-triangle" size={20} color="#E65100" />
          <View style={{ flex: 1 }}>
            <Text style={settingsStyles.warningTitle}>Attention</Text>
            <Text style={settingsStyles.warningBody}>
              Le soignant Dr. Mbarga sera informé que les rappels sont désactivés
              pour Amina.
            </Text>
          </View>
        </View>

        <Text style={settingsStyles.sectionHeader}>Pour Amina</Text>

        <View style={settingsStyles.settingRow}>
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>Rappels aux heures prévues</Text>
            <Text style={settingsStyles.settingDescription}>
              Recevoir une notification à chaque créneau prescrit
            </Text>
          </View>
          <Toggle
            value={prefs.reminders_enabled}
            onValueChange={handleToggleReminders}
            testID="toggle-reminders-off"
          />
        </View>

        <View
          style={[settingsStyles.settingRow, settingsStyles.settingRowDisabled]}
        >
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>
              Relance si pas de confirmation
            </Text>
            <Text style={settingsStyles.settingDescription}>
              Rappel 30 min après si la prise n'est pas validée
            </Text>
          </View>
          <Toggle
            value={false}
            disabled={true}
            onValueChange={() => {}}
            testID="toggle-followup-disabled"
          />
        </View>

        <Text style={settingsStyles.sectionHeader}>Général</Text>

        <View style={settingsStyles.settingRow}>
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>Messages du soignant</Text>
            <Text style={settingsStyles.settingDescription}>
              Conseils et retours de Dr. Mbarga
            </Text>
          </View>
          <Toggle
            value={prefs.caregiver_messages_enabled}
            onValueChange={(val) =>
              setPrefs((p) => ({ ...p, caregiver_messages_enabled: val }))
            }
          />
        </View>

        <View style={settingsStyles.settingRow}>
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>Évaluations de santé</Text>
            <Text style={settingsStyles.settingDescription}>
              Rappels de pesée et de mesure du bras
            </Text>
          </View>
          <Toggle
            value={prefs.evaluations_enabled}
            onValueChange={(val) =>
              setPrefs((p) => ({ ...p, evaluations_enabled: val }))
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
