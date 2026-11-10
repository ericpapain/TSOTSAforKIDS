/**
 * Push notifications and scheduled reminders foundation for TSOTSA Kids Mobile.
 * Configures expo-notifications handlers and action categories.
 */

import * as Notifications from "expo-notifications";

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

export interface LocalIntakeReminderParams {
  slotId?: string;
  personName: string;
  productName: string;
  quantity: number | string;
  unit: string;
  locale?: "fr" | "en";
}

export function buildLocalReminderContent(params: LocalIntakeReminderParams): {
  title: string;
  body: string;
  actions: { id: string; title: string }[];
} {
  const isEn = params.locale === "en";
  return {
    title: isEn ? "TSOTSA KIDS • now" : "TSOTSA KIDS • maintenant",
    body: isEn
      ? `Reminder for ${params.personName}\nIt is time for ${params.productName} (${params.quantity} ${params.unit}).`
      : `Rappel pour ${params.personName}\nC'est l'heure de la prise de ${params.productName} (${params.quantity} ${params.unit}).`,
    actions: isEn
      ? [
          { id: "given", title: "Given" },
          { id: "later", title: "Later" },
          { id: "not_given", title: "Not given" },
        ]
      : [
          { id: "given", title: "C'est donné" },
          { id: "later", title: "Plus tard" },
          { id: "not_given", title: "Pas donné" },
        ]
  };
}

export async function scheduleLocalIntakeReminder(
  params: LocalIntakeReminderParams,
  triggerSeconds = 1
): Promise<string> {
  const content = buildLocalReminderContent(params);
  return await Notifications.scheduleNotificationAsync({
    identifier: `intake-offline-${params.slotId || Date.now()}`,
    content: {
      title: content.title,
      body: content.body,
      sound: true,
      data: { ...params },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, triggerSeconds),
      repeats: false,
    },
  });
}

