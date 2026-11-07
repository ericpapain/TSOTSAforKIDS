import {
  clearQueue,
  enqueueIntake,
  getPendingCount,
  getPendingIntakes,
  removeIntakes,
} from "../sqliteQueue";
import type { OfflineIntake } from "../types";

describe("SQLite Queue Service", () => {
  beforeEach(async () => {
    await clearQueue();
  });

  const sampleIntake: OfflineIntake = {
    id: "test-uuid-001",
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

  it("enqueues an intake and retrieves it from pending list", async () => {
    await enqueueIntake(sampleIntake);
    const count = await getPendingCount();
    expect(count).toBe(1);

    const pending = await getPendingIntakes();
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe("test-uuid-001");
    expect(pending[0].product_name).toBe("Plumpy'Nut");
  });

  it("avoids duplicates by replacing with identical id", async () => {
    await enqueueIntake(sampleIntake);
    await enqueueIntake({ ...sampleIntake, quantity: 2 });

    const pending = await getPendingIntakes();
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe("test-uuid-001");
  });

  it("removes specified intakes by ids", async () => {
    await enqueueIntake(sampleIntake);
    const second: OfflineIntake = {
      ...sampleIntake,
      id: "test-uuid-002",
    };
    await enqueueIntake(second);

    await removeIntakes(["test-uuid-001"]);
    const pending = await getPendingIntakes();
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe("test-uuid-002");
  });

  it("clears all intakes from queue", async () => {
    await enqueueIntake(sampleIntake);
    await clearQueue();
    const count = await getPendingCount();
    expect(count).toBe(0);
  });
});

