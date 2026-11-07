import {
  getInAppNotifications,
  markAsRead,
  resetInAppNotifications,
} from "../inAppService";

describe("inAppService", () => {
  beforeEach(() => {
    resetInAppNotifications();
  });

  it("retrieves the initial set of notifications", () => {
    const list = getInAppNotifications();
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(list[0].person_name).toBe("Amina");
  });

  it("marks an unread notification as read", () => {
    const initialList = getInAppNotifications();
    const unreadItem = initialList.find((item) => item.read_at === null);
    expect(unreadItem).toBeDefined();

    const updated = markAsRead(unreadItem!.id);
    expect(updated).not.toBeNull();
    expect(updated?.read_at).toBeTruthy();

    const afterList = getInAppNotifications();
    const afterItem = afterList.find((i) => i.id === unreadItem!.id);
    expect(afterItem?.read_at).toBeTruthy();
  });

  it("returns null when marking an unknown id", () => {
    const result = markAsRead("unknown-id-xyz");
    expect(result).toBeNull();
  });
});

