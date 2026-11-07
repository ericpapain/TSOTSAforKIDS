import { clearQueue, enqueueIntake, getPendingCount } from "../sqliteQueue";
import { syncPendingIntakes } from "../syncService";
import { isOnline, setOnlineState, subscribeNetworkState } from "../networkState";
import type { OfflineIntake } from "../types";

describe("Sync Service and Network State", () => {
  beforeEach(async () => {
    await clearQueue();
    setOnlineState(true);
    // Reset fetch
    (globalThis.fetch as jest.Mock) = jest.fn();
  });

  const sampleIntake: OfflineIntake = {
    id: "test-sync-001",
    person_id: "p-amina-1",
    person_name: "Amina",
    item_type: "product",
    item_id: "prod-plumpy-1",
    product_name: "Plumpy'Nut",
    quantity: 1,
    unit: "sachet",
    taken_at: new Date().toISOString(),
    consumption: "all",
    origin: "app",
    created_at: new Date().toISOString(),
    status: "pending",
  };

  it("returns zero counts when queue is empty", async () => {
    const result = await syncPendingIntakes();
    expect(result.syncedCount).toBe(0);
    expect(result.failedCount).toBe(0);
  });

  it("synchronizes pending intakes successfully and clears queue", async () => {
    await enqueueIntake(sampleIntake);
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        received_count: 1,
        inserted_count: 1,
        duplicate_count: 0,
      }),
    });

    const result = await syncPendingIntakes();
    expect(result.syncedCount).toBe(1);
    expect(result.failedCount).toBe(0);

    const count = await getPendingCount();
    expect(count).toBe(0);
  });

  it("retains queue items when network call fails", async () => {
    await enqueueIntake(sampleIntake);
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network connection error")
    );

    const result = await syncPendingIntakes();
    expect(result.syncedCount).toBe(0);
    expect(result.failedCount).toBe(1);

    const count = await getPendingCount();
    expect(count).toBe(1);
  });

  it("manages online state and notifies subscribers", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeNetworkState(listener);

    setOnlineState(false);
    expect(isOnline()).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);

    setOnlineState(true);
    expect(isOnline()).toBe(true);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
  });
});

