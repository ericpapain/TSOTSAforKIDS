/**
 * High-level notification manager.
 * Configures push categories, handles actions, and registers push tokens.
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  INTAKE_CATEGORY_IDENTIFIER,
  IntakeNotificationPayload,
  NOTIF_ACTIONS,
} from "./types";
import { cancelFollowupReminder, snoozeReminder } from "./localScheduler";

export interface NavigationHandler {
  push: (href: string) => void;
  replace: (href: string) => void;
}

export async function registerNotificationCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(INTAKE_CATEGORY_IDENTIFIER, [
    {
      identifier: NOTIF_ACTIONS.GIVE_NOW,
      buttonTitle: "C'est donné",
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: NOTIF_ACTIONS.SNOOZE,
      buttonTitle: "Plus tard",
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: NOTIF_ACTIONS.NOT_GIVEN,
      buttonTitle: "Pas donné",
      options: {
        opensAppToForeground: true,
        isDestructive: true,
      },
    },
  ]);
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tsotsa-reminders", {
      name: "Rappels de prise",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1B5E20",
      sound: "default",
    });
  }
}

export function initNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  void registerNotificationCategory();
  void setupNotificationChannels();
}

export async function requestPermissionWithRationale(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return { granted: true, canAskAgain: true };
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return {
    granted: requested.granted,
    canAskAgain: requested.canAskAgain,
  };
}

export async function registerPushDeviceToken(
  apiCaller?: (token: string, platform: string) => Promise<unknown>
): Promise<string | null> {
  try {
    const { granted } = await requestPermissionWithRationale();
    if (!granted) {
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;

    if (apiCaller) {
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await apiCaller(token, platform);
    }

    return token;
  } catch {
    return null;
  }
}

export async function handleNotificationActionResponse(
  actionId: string,
  payload: IntakeNotificationPayload,
  navigator: NavigationHandler
): Promise<string> {
  if (actionId === NOTIF_ACTIONS.GIVE_NOW) {
    if (payload.schedule_time_id) {
      await cancelFollowupReminder(payload.schedule_time_id);
    }
    const query = new URLSearchParams({
      person_id: payload.person_id || "",
      product_name: payload.product_name || "Plumpy'Nut",
      quantity: payload.quantity || "1",
      unit: payload.unit || "sachet",
      schedule_time_id: payload.schedule_time_id || "",
    }).toString();
    navigator.push(`/u-give?${query}`);
    return "given";
  }

  if (actionId === NOTIF_ACTIONS.SNOOZE) {
    await snoozeReminder(payload, 15);
    return "snoozed";
  }

  if (actionId === NOTIF_ACTIONS.NOT_GIVEN) {
    navigator.push("/u-history");
    return "not_given";
  }

  return "unhandled";
}

