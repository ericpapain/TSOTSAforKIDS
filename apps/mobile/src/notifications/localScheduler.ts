/**
 * Local offline scheduler for daily reminders and follow-up alerts.
 * Uses expo-notifications triggers to ring even without internet connectivity.
 */

import * as Notifications from "expo-notifications";
import {
  INTAKE_CATEGORY_IDENTIFIER,
  IntakeNotificationPayload,
  NotificationPreferences,
  ScheduleSlot,
} from "./types";

export function parseHourMinute(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0] || "0", 10);
  const minute = parseInt(parts[1] || "0", 10);
  return { hour, minute };
}

export function isTimeInQuietHours(
  timeStr: string,
  quietStart: string,
  quietEnd: string
): boolean {
  const target = parseHourMinute(timeStr);
  const start = parseHourMinute(quietStart);
  const end = parseHourMinute(quietEnd);

  const targetMinutes = target.hour * 60 + target.minute;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes > endMinutes) {
    // Overnight quiet period, e.g., 21:00 to 06:00
    return targetMinutes >= startMinutes || targetMinutes < endMinutes;
  }
  return targetMinutes >= startMinutes && targetMinutes < endMinutes;
}

export async function scheduleSlotReminder(
  slot: ScheduleSlot,
  personName: string,
  preferences: NotificationPreferences
): Promise<string | null> {
  if (!slot.enabled || !preferences.reminders_enabled) {
    return null;
  }

  if (
    preferences.quiet_hours_enabled &&
    isTimeInQuietHours(
      slot.local_time,
      preferences.quiet_hours_start,
      preferences.quiet_hours_end
    )
  ) {
    return null;
  }

  const { hour, minute } = parseHourMinute(slot.local_time);
  const payload: IntakeNotificationPayload = {
    person_id: slot.id,
    person_name: personName,
    schedule_time_id: slot.id,
    product_name: slot.product_name,
    quantity: slot.quantity,
    unit: slot.unit,
    time_label: slot.local_time,
    is_followup: false,
  };

  const id = await Notifications.scheduleNotificationAsync({
    identifier: `intake-slot-${slot.id}`,
    content: {
      title: "TSOTSA KIDS • maintenant",
      body: `Rappel pour ${personName}\nC'est l'heure de la prise de ${slot.product_name} (${slot.quantity} ${slot.unit}).`,
      categoryIdentifier: INTAKE_CATEGORY_IDENTIFIER,
      data: payload as unknown as Record<string, unknown>,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

export async function scheduleFollowupReminder(
  slotId: string,
  personName: string,
  productName: string,
  minutesDelay = 30
): Promise<string> {
  const followupId = `intake-followup-${slotId}`;
  await Notifications.cancelScheduledNotificationAsync(followupId).catch(() => {});

  const triggerSeconds = Math.max(1, minutesDelay * 60);

  return Notifications.scheduleNotificationAsync({
    identifier: followupId,
    content: {
      title: "TSOTSA KIDS • Relance",
      body: `Rappel : la prise de ${productName} pour ${personName} n'a pas encore été confirmée.`,
      categoryIdentifier: INTAKE_CATEGORY_IDENTIFIER,
      sound: true,
      data: { slotId, personName, productName, is_followup: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
      repeats: false,
    },
  });
}

export async function cancelFollowupReminder(slotId: string): Promise<void> {
  const followupId = `intake-followup-${slotId}`;
  await Notifications.cancelScheduledNotificationAsync(followupId).catch(() => {});
}

export async function snoozeReminder(
  payload: IntakeNotificationPayload,
  minutes = 15
): Promise<string> {
  const snoozeId = `intake-snooze-${payload.schedule_time_id || Date.now()}`;
  await Notifications.cancelScheduledNotificationAsync(snoozeId).catch(() => {});

  const triggerSeconds = Math.max(1, minutes * 60);

  return Notifications.scheduleNotificationAsync({
    identifier: snoozeId,
    content: {
      title: "TSOTSA KIDS • Rappel reporté",
      body: `C'est l'heure : prise de ${payload.product_name} pour ${payload.person_name}.`,
      categoryIdentifier: INTAKE_CATEGORY_IDENTIFIER,
      sound: true,
      data: { ...payload, is_snoozed: true } as unknown as Record<string, unknown>,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
      repeats: false,
    },
  });
}

export async function syncAllLocalReminders(
  slots: ScheduleSlot[],
  personName: string,
  preferences: NotificationPreferences
): Promise<string[]> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

  if (!preferences.reminders_enabled) {
    return [];
  }

  const ids: string[] = [];
  for (const slot of slots) {
    const id = await scheduleSlotReminder(slot, personName, preferences);
    if (id) {
      ids.push(id);
    }
  }

  return ids;
}

