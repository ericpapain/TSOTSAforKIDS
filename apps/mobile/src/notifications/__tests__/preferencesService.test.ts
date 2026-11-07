import * as SecureStore from "expo-secure-store";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  toggleReminders,
} from "../preferencesService";
import { DEFAULT_PREFERENCES } from "../constants";

describe("preferencesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads default preferences when secure store is empty", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const prefs = await loadNotificationPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it("loads stored preferences merged with defaults", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ reminders_enabled: false })
    );
    const prefs = await loadNotificationPreferences();
    expect(prefs.reminders_enabled).toBe(false);
    expect(prefs.quiet_hours_start).toBe("21:00");
  });

  it("saves preferences to secure store and calls api syncer", async () => {
    const apiSyncer = jest.fn().mockResolvedValueOnce({});
    const customPrefs = { ...DEFAULT_PREFERENCES, quiet_hours_start: "22:00" };

    await saveNotificationPreferences(customPrefs, apiSyncer);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "tsotsa_notification_preferences",
      expect.stringContaining('"quiet_hours_start":"22:00"')
    );
    expect(apiSyncer).toHaveBeenCalledWith(customPrefs);
  });

  it("toggles reminders off and cascades to followup", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(DEFAULT_PREFERENCES)
    );
    const updated = await toggleReminders(false);
    expect(updated.reminders_enabled).toBe(false);
    expect(updated.followup_enabled).toBe(false);
  });
});

