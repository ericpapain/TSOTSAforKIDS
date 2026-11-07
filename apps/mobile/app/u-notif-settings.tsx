import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AppBar } from "../src/components/AppBar";
import { Toggle } from "../src/components/Toggle";
import { settingsStyles } from "../src/features/notifications/settingsStyles";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  DEFAULT_PREFERENCES,
} from "../src/notifications";

export default function NotifSettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    void loadNotificationPreferences().then(setPrefs);
  }, []);

  const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    if (key === "reminders_enabled" && !value) {
      updated.followup_enabled = false;
      setPrefs(updated);
      void saveNotificationPreferences(updated);
      router.push("/u-notif-off");
      return;
    }
    setPrefs(updated);
    void saveNotificationPreferences(updated);
  };

  return (
    <View style={settingsStyles.container}>
      <AppBar title="Notifications" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={settingsStyles.content}>
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
            onValueChange={(val) => updatePref("reminders_enabled", val)}
            testID="toggle-reminders"
          />
        </View>

        <View
          style={[
            settingsStyles.settingRow,
            !prefs.reminders_enabled && settingsStyles.settingRowDisabled,
          ]}
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
            value={prefs.followup_enabled}
            disabled={!prefs.reminders_enabled}
            onValueChange={(val) => updatePref("followup_enabled", val)}
            testID="toggle-followup"
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
            onValueChange={(val) => updatePref("caregiver_messages_enabled", val)}
            testID="toggle-caregiver"
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
            onValueChange={(val) => updatePref("evaluations_enabled", val)}
            testID="toggle-evaluations"
          />
        </View>

        <Text style={settingsStyles.sectionHeader}>Comment recevoir</Text>

        <View style={settingsStyles.settingRow}>
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>Sur ce téléphone</Text>
            <Text style={settingsStyles.settingDescription}>
              Notifications de l'application
            </Text>
          </View>
          <Toggle
            value={prefs.push_channel_enabled}
            onValueChange={(val) => updatePref("push_channel_enabled", val)}
            testID="toggle-push"
          />
        </View>

        <View style={settingsStyles.settingRow}>
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>
              SMS si pas d'accès Internet
            </Text>
            <Text style={settingsStyles.settingDescription}>
              Envoi d'un SMS après 1h sans confirmation
            </Text>
          </View>
          <Toggle
            value={prefs.sms_fallback_enabled}
            onValueChange={(val) => updatePref("sms_fallback_enabled", val)}
            testID="toggle-sms"
          />
        </View>

        <Text style={settingsStyles.sectionHeader}>Heures calmes</Text>

        <View style={settingsStyles.settingRow}>
          <View style={settingsStyles.textContainer}>
            <Text style={settingsStyles.settingLabel}>
              Ne pas déranger (21h00 - 06h00)
            </Text>
            <Text style={settingsStyles.settingDescription}>
              Désactive les sonneries pendant la nuit
            </Text>
          </View>
          <Toggle
            value={prefs.quiet_hours_enabled}
            onValueChange={(val) => updatePref("quiet_hours_enabled", val)}
            testID="toggle-quiet-hours"
          />
        </View>
      </ScrollView>
    </View>
  );
}
