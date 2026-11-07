import * as Notifications from "expo-notifications";
import {
  requestPermissionWithRationale,
  registerPushDeviceToken,
  registerNotificationCategory,
  handleNotificationActionResponse,
  initNotifications,
} from "../notificationService";
import { NOTIF_ACTIONS } from "../types";

describe("notificationService", () => {
  const mockNavigator = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const samplePayload = {
    person_id: "person-123",
    person_name: "Amina",
    schedule_time_id: "slot-noon",
    product_name: "Plumpy'Nut",
    quantity: "1",
    unit: "sachet",
    time_label: "12:30",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initNotifications", () => {
    it("configures handler, categories and channels without throwing", () => {
      expect(() => initNotifications()).not.toThrow();
      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });
  });

  describe("registerNotificationCategory", () => {
    it("registers category with 3 required actions", async () => {
      await registerNotificationCategory();
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        "INTAKE_REMINDER",
        expect.arrayContaining([
          expect.objectContaining({ identifier: "GIVE_NOW", buttonTitle: "C'est donné" }),
          expect.objectContaining({ identifier: "SNOOZE", buttonTitle: "Plus tard" }),
          expect.objectContaining({ identifier: "NOT_GIVEN", buttonTitle: "Pas donné" }),
        ])
      );
    });
  });

  describe("requestPermissionWithRationale", () => {
    it("returns granted if already granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
        canAskAgain: true,
      });

      const res = await requestPermissionWithRationale();
      expect(res.granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("requests permissions if not initially granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
        canAskAgain: true,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
        canAskAgain: true,
      });

      const res = await requestPermissionWithRationale();
      expect(res.granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe("registerPushDeviceToken", () => {
    it("registers token with API caller if granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: "ExponentPushToken[unit-test-token]",
      });

      const mockApiCaller = jest.fn().mockResolvedValueOnce({ ok: true });
      const token = await registerPushDeviceToken(mockApiCaller);

      expect(token).toBe("ExponentPushToken[unit-test-token]");
      expect(mockApiCaller).toHaveBeenCalledWith(
        "ExponentPushToken[unit-test-token]",
        expect.any(String)
      );
    });

    it("returns null if permission is not granted", async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
      });

      const token = await registerPushDeviceToken();
      expect(token).toBeNull();
    });
  });

  describe("handleNotificationActionResponse", () => {
    it("handles GIVE_NOW: cancels followup and navigates to /u-give", async () => {
      const result = await handleNotificationActionResponse(
        NOTIF_ACTIONS.GIVE_NOW,
        samplePayload,
        mockNavigator
      );
      expect(result).toBe("given");
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "intake-followup-slot-noon"
      );
      expect(mockNavigator.push).toHaveBeenCalledWith(
        expect.stringContaining("/u-give?person_id=person-123")
      );
    });

    it("handles SNOOZE: schedules a 15-min reminder", async () => {
      const result = await handleNotificationActionResponse(
        NOTIF_ACTIONS.SNOOZE,
        samplePayload,
        mockNavigator
      );
      expect(result).toBe("snoozed");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
      expect(mockNavigator.push).not.toHaveBeenCalled();
    });

    it("handles NOT_GIVEN: navigates to /u-history", async () => {
      const result = await handleNotificationActionResponse(
        NOTIF_ACTIONS.NOT_GIVEN,
        samplePayload,
        mockNavigator
      );
      expect(result).toBe("not_given");
      expect(mockNavigator.push).toHaveBeenCalledWith("/u-history");
    });

    it("returns unhandled for unknown action identifier", async () => {
      const result = await handleNotificationActionResponse(
        "UNKNOWN_ACTION",
        samplePayload,
        mockNavigator
      );
      expect(result).toBe("unhandled");
    });
  });
});

