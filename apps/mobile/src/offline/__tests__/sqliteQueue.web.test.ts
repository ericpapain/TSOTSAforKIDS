import {
  enqueueIntake,
  getPendingIntakes,
  getPendingCount,
  removeIntakes,
  clearQueue,
  getDatabase,
} from "../sqliteQueue.web";
import type { OfflineIntake } from "../types";

describe("sqliteQueue.web", () => {
  beforeEach(async () => {
    await clearQueue();
  });

  const sampleIntake: OfflineIntake = {
    id: "intake-web-1",
    person_id: "person-1",
    person_name: "Amina",
    item_type: "product",
    item_id: "prod-1",
    product_name: "Plumpy Nut",
    quantity: 1,
    unit: "sachet",
    taken_at: new Date().toISOString(),
    consumption: "all",
    origin: "app",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  it("handles enqueue, count and getPendingIntakes", async () => {
    expect(await getPendingCount()).toBe(0);
    await enqueueIntake(sampleIntake);
    expect(await getPendingCount()).toBe(1);

    const pending = await getPendingIntakes();
    expect(pending.length).toBe(1);
    expect(pending[0].product_name).toBe("Plumpy Nut");

    // Update existing
    await enqueueIntake({ ...sampleIntake, product_name: "Updated" });
    const updated = await getPendingIntakes();
    expect(updated[0].product_name).toBe("Updated");
  });

  it("handles removeIntakes and clearQueue", async () => {
    await enqueueIntake(sampleIntake);
    expect(await getPendingCount()).toBe(1);

    await removeIntakes([]);
    expect(await getPendingCount()).toBe(1);

    await removeIntakes([sampleIntake.id]);
    expect(await getPendingCount()).toBe(0);

    await enqueueIntake(sampleIntake);
    await clearQueue();
    expect(await getPendingCount()).toBe(0);
  });

  it("returns null for getDatabase on web", async () => {
    expect(await getDatabase()).toBeNull();
  });
});

