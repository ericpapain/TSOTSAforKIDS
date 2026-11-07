import { clearQueue, getPendingCount } from "../../../offline/sqliteQueue";
import { setOnlineState } from "../../../offline/networkState";
import {
  listPersonIntakes,
  recordIntake,
} from "../intakesService";

describe("Intakes Service", () => {
  beforeEach(async () => {
    await clearQueue();
    setOnlineState(true);
    global.fetch = jest.fn();
  });

  it("records intake online via API successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: "server-id-123",
        person_id: "p-amina-1",
        item_type: "product",
        item_id: "prod-plumpy-1",
        quantity: "1",
        unit: "sachet",
        taken_at: new Date().toISOString(),
        consumption: "all",
        origin: "app",
        created_at: new Date().toISOString(),
      }),
    });

    const res = await recordIntake({
      person_id: "p-amina-1",
      person_name: "Amina",
      item_type: "product",
      item_id: "prod-plumpy-1",
      product_name: "Plumpy'Nut",
      quantity: 1,
      unit: "sachet",
      consumption: "all",
    });

    expect(res.id).toBe("server-id-123");
    expect(res.is_offline_pending).toBeUndefined();
    const count = await getPendingCount();
    expect(count).toBe(0);
  });

  it("records intake offline directly when offline", async () => {
    setOnlineState(false);

    const res = await recordIntake({
      person_id: "p-amina-1",
      person_name: "Amina",
      item_type: "product",
      item_id: "prod-plumpy-1",
      product_name: "Plumpy'Nut",
      quantity: 2,
      unit: "sachet",
      consumption: "half",
    });

    expect(res.is_offline_pending).toBe(true);
    const count = await getPendingCount();
    expect(count).toBe(1);
  });

  it("falls back to offline queue on network error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network timeout")
    );

    const res = await recordIntake({
      person_id: "p-amina-1",
      person_name: "Amina",
      item_type: "product",
      item_id: "prod-plumpy-1",
      product_name: "Plumpy'Nut",
      quantity: 1,
      unit: "sachet",
      consumption: "all",
      origin: "late",
    });

    expect(res.is_offline_pending).toBe(true);
    expect(res.origin).toBe("late");
    const count = await getPendingCount();
    expect(count).toBe(1);
  });

  it("lists person intakes merging server and pending offline items", async () => {
    setOnlineState(false);
    await recordIntake({
      person_id: "p-amina-1",
      person_name: "Amina",
      item_type: "product",
      item_id: "prod-plumpy-1",
      product_name: "Plumpy'Nut",
      quantity: 1,
      unit: "sachet",
      consumption: "all",
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "server-past-1",
          person_id: "p-amina-1",
          item_type: "product",
          item_id: "prod-plumpy-1",
          quantity: "1",
          unit: "sachet",
          taken_at: "2026-11-06T12:00:00Z",
          consumption: "all",
          origin: "app",
          created_at: "2026-11-06T12:00:00Z",
        },
      ],
    });

    const list = await listPersonIntakes("p-amina-1");
    expect(list.length).toBe(2);
  });
});

