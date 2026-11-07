import * as Notifications from "expo-notifications";
import {
  parseHourMinute,
  isTimeInQuietHours,
  scheduleSlotReminder,
  scheduleFollowupReminder,
  cancelFollowupReminder,
  snoozeReminder,
  syncAllLocalReminders,
} from "../localScheduler";
import { DEFAULT_PREFERENCES } from "../constants";
import { ScheduleSlot } from "../types";

describe("localScheduler", () => {
  const sampleSlot: ScheduleSlot = {
    id: "slot-noon",
    local_time: "12:30",
    period_label: "Midi",
    product_name: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    enabled: true,
    is_prescribed: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseHourMinute", () => {
    it("correctly parses HH:MM strings", () => {
      expect(parseHourMinute("08:00")).toEqual({ hour: 8, minute: 0 });
      expect(parseHourMinute("12:30")).toEqual({ hour: 12, minute: 30 });
      expect(parseHourMinute("23:59")).toEqual({ hour: 23, minute: 59 });
    });
  });

  describe("isTimeInQuietHours", () => {
    it("handles overnight quiet periods (e.g. 21:00 to 06:00)", () => {
      expect(isTimeInQuietHours("22:00", "21:00", "06:00")).toBe(true);
      expect(isTimeInQuietHours("05:30", "21:00", "06:00")).toBe(true);
      expect(isTimeInQuietHours("12:30", "21:00", "06:00")).toBe(false);
      expect(isTimeInQuietHours("08:00", "21:00", "06:00")).toBe(false);
    });

    it("handles daytime quiet periods (e.g. 13:00 to 14:00)", () => {
      expect(isTimeInQuietHours("13:30", "13:00", "14:00")).toBe(true);
      expect(isTimeInQuietHours("12:00", "13:00", "14:00")).toBe(false);
    });
  });

  describe("scheduleSlotReminder", () => {
    it("schedules a notification when slot and preferences are enabled", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce(
        "notif-123"
      );

      const id = await scheduleSlotReminder(sampleSlot, "Amina", DEFAULT_PREFERENCES);
      expect(id).toBe("notif-123");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "intake-slot-slot-noon",
          content: expect.objectContaining({
            title: "TSOTSA KIDS • maintenant",
            categoryIdentifier: "INTAKE_REMINDER",
          }),
        })
      );
    });

    it("returns null if slot is disabled", async () => {
      const disabledSlot = { ...sampleSlot, enabled: false };
      const id = await scheduleSlotReminder(disabledSlot, "Amina", DEFAULT_PREFERENCES);
      expect(id).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("returns null if reminders are globally disabled", async () => {
      const prefs = { ...DEFAULT_PREFERENCES, reminders_enabled: false };
      const id = await scheduleSlotReminder(sampleSlot, "Amina", prefs);
      expect(id).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("returns null if slot time is within quiet hours", async () => {
      const nightSlot = { ...sampleSlot, local_time: "22:30" };
      const id = await scheduleSlotReminder(nightSlot, "Amina", DEFAULT_PREFERENCES);
      expect(id).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe("scheduleFollowupReminder and cancelFollowupReminder", () => {
    it("schedules a 30-minute follow-up notification", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce(
        "followup-123"
      );

      const id = await scheduleFollowupReminder(
        "slot-noon",
        "Amina",
        "Plumpy'Nut",
        30
      );
      expect(id).toBe("followup-123");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "intake-followup-slot-noon",
          trigger: expect.objectContaining({ seconds: 1800, repeats: false }),
        })
      );
    });

    it("cancels a follow-up reminder without throwing", async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValueOnce(
        undefined
      );
      await expect(cancelFollowupReminder("slot-noon")).resolves.not.toThrow();
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "intake-followup-slot-noon"
      );
    });
  });

  describe("snoozeReminder", () => {
    it("schedules a snooze notification for +15 minutes", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValueOnce(
        "snooze-456"
      );

      const payload = {
        person_id: "person-1",
        person_name: "Amina",
        schedule_time_id: "slot-noon",
        product_name: "Plumpy'Nut",
        quantity: "1",
        unit: "sachet",
        time_label: "12:30",
      };

      const id = await snoozeReminder(payload, 15);
      expect(id).toBe("snooze-456");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "intake-snooze-slot-noon",
          trigger: expect.objectContaining({ seconds: 900, repeats: false }),
        })
      );
    });
  });

  describe("syncAllLocalReminders", () => {
    it("cancels existing and schedules all enabled slots", async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        "scheduled-id"
      );

      const slots: ScheduleSlot[] = [
        sampleSlot,
        {
          ...sampleSlot,
          id: "slot-morning",
          local_time: "08:00",
          period_label: "Matin",
        },
      ];

      const ids = await syncAllLocalReminders(slots, "Amina", DEFAULT_PREFERENCES);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(ids.length).toBe(2);
    });

    it("returns empty list if reminders are disabled", async () => {
      const prefs = { ...DEFAULT_PREFERENCES, reminders_enabled: false };
      const ids = await syncAllLocalReminders([sampleSlot], "Amina", prefs);
      expect(ids).toEqual([]);
    });
  });
});

