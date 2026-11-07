/**
 * Preferences manager for notifications and reminder channels.
 * Stores preferences securely offline and optionally syncs with the API.
 */

import * as SecureStore from "expo-secure-store";
import { DEFAULT_PREFERENCES } from "./constants";
import { NotificationPreferences } from "./types";

const PREFS_STORAGE_KEY = "tsotsa_notification_preferences";

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function saveNotificationPreferences(
  prefs: NotificationPreferences,
  apiSyncer?: (prefs: NotificationPreferences) => Promise<unknown>
): Promise<NotificationPreferences> {
  try {
    await SecureStore.setItemAsync(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    if (apiSyncer) {
      await apiSyncer(prefs).catch(() => {});
    }
  } catch {
    // Keep local write failure resilient
  }
  return prefs;
}

export async function toggleReminders(
  enabled: boolean,
  apiSyncer?: (prefs: NotificationPreferences) => Promise<unknown>
): Promise<NotificationPreferences> {
  const current = await loadNotificationPreferences();
  const updated: NotificationPreferences = {
    ...current,
    reminders_enabled: enabled,
    followup_enabled: enabled ? current.followup_enabled : false,
  };
  return saveNotificationPreferences(updated, apiSyncer);
}

