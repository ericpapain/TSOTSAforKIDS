import {
  fetchSymptomCatalog,
  submitHealthEvent,
  syncOfflineHealthEvents,
  FALLBACK_SYMPTOMS,
} from "../healthService";
import * as SecureStore from "expo-secure-store";
import { getApiClient } from "../../../api/client";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock("../../../api/client", () => ({
  getApiClient: jest.fn(),
}));

describe("Mobile Health Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns fallback catalog when API fails", async () => {
    (getApiClient as jest.Mock).mockReturnValue({
      client: {
        GET: jest.fn().mockRejectedValue(new Error("Network error")),
      },
    });

    const catalog = await fetchSymptomCatalog();
    expect(catalog).toEqual(FALLBACK_SYMPTOMS);
    expect(catalog.length).toBeGreaterThan(5);
  });

  it("submits health event successfully when online", async () => {
    const mockCreated = {
      id: "evt-mob-1",
      person_id: "p-01",
      created_at: new Date().toISOString(),
      status: "open",
      priority: "normal",
      has_danger_sign: false,
      parent_guidance_message: "Événement enregistré avec succès.",
      symptoms: [{ symptom_code: "fever", duration: "less_than_24h" }],
    };

    (getApiClient as jest.Mock).mockReturnValue({
      client: {
        POST: jest.fn().mockResolvedValue({ data: mockCreated }),
      },
    });

    const result = await submitHealthEvent({
      person_id: "p-01",
      symptom_code: "fever",
      duration: "less_than_24h",
      temperature_celsius: 38.5,
    });

    expect(result.id).toBe("evt-mob-1");
    expect(result.has_danger_sign).toBe(false);
  });

  it("queues event in SecureStore when network fails", async () => {
    (getApiClient as jest.Mock).mockReturnValue({
      client: {
        POST: jest.fn().mockRejectedValue(new Error("Network unreachable")),
      },
    });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const result = await submitHealthEvent({
      person_id: "p-01",
      symptom_code: "convulsions",
      duration: "less_than_24h",
    });

    expect(result.id).toContain("offline-");
    expect(result.has_danger_sign).toBe(true);
    expect(result.priority).toBe("urgent");
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });

  it("syncs offline events when connectivity returns", async () => {
    const queuedEvents = [
      {
        person_id: "p-02",
        symptom_code: "diarrhea",
        duration: "1_to_3_days",
      },
    ];

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(queuedEvents));
    (getApiClient as jest.Mock).mockReturnValue({
      client: {
        POST: jest.fn().mockResolvedValue({ data: { id: "synced-1" } }),
      },
    });

    const count = await syncOfflineHealthEvents();
    expect(count).toBe(1);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "tsotsa_offline_health_events",
      JSON.stringify([])
    );
  });
});

