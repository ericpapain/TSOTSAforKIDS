import * as SecureStore from "expo-secure-store";
import { getApiClient } from "../../api/client";
import type {
  MobileSymptomItem,
  MobileHealthEventInput,
  MobileHealthEventOut,
} from "./healthTypes";

const OFFLINE_QUEUE_KEY = "tsotsa_offline_health_events";

export const FALLBACK_SYMPTOMS: MobileSymptomItem[] = [
  { code: "fever", category: "general", label_fr: "Fièvre chaude au toucher", label_en: "Fever", is_danger_sign: false, display_order: 1 },
  { code: "convulsions", category: "neurological", label_fr: "Convulsions ou crises", label_en: "Convulsions", is_danger_sign: true, display_order: 2 },
  { code: "vomiting", category: "digestive", label_fr: "Vomissements répétés", label_en: "Repeated vomiting", is_danger_sign: false, display_order: 3 },
  { code: "cannot_drink", category: "general", label_fr: "Incapable de boire ou téter", label_en: "Unable to drink or breastfeed", is_danger_sign: true, display_order: 4 },
  { code: "diarrhea", category: "digestive", label_fr: "Diarrhée (selles liquides)", label_en: "Diarrhea", is_danger_sign: false, display_order: 5 },
  { code: "respiratory_distress", category: "respiratory", label_fr: "Respiration rapide ou difficile", label_en: "Rapid or difficult breathing", is_danger_sign: true, display_order: 6 },
  { code: "lethargy", category: "neurological", label_fr: "Enfant très mou ou inconscient", label_en: "Lethargic or unconscious", is_danger_sign: true, display_order: 7 },
  { code: "cough", category: "respiratory", label_fr: "Toux persistante", label_en: "Cough", is_danger_sign: false, display_order: 8 },
  { code: "fatigue", category: "general", label_fr: "Fatigue intense / Faiblesse", label_en: "Extreme fatigue", is_danger_sign: false, display_order: 9 },
  { code: "appetite_loss", category: "digestive", label_fr: "Refus de manger / Perte d'appétit", label_en: "Loss of appetite", is_danger_sign: false, display_order: 10 },
];

export async function fetchSymptomCatalog(): Promise<MobileSymptomItem[]> {
  try {
    const client = getApiClient().client;
    const res = await (client as unknown as {
      GET: (url: string) => Promise<{ data: MobileSymptomItem[] }>;
    }).GET("/v1/health/symptoms/catalog");
    if (res.data && res.data.length > 0) {
      return res.data;
    }
    return FALLBACK_SYMPTOMS;
  } catch {
    return FALLBACK_SYMPTOMS;
  }
}

export async function submitHealthEvent(
  input: MobileHealthEventInput
): Promise<MobileHealthEventOut> {
  const isDanger = ["convulsions", "cannot_drink", "respiratory_distress", "lethargy"].includes(input.symptom_code);

  const payload = {
    person_id: input.person_id,
    intake_id: input.intake_id || null,
    declaration_context: input.declaration_context || "standalone",
    meal_interrupted: input.meal_interrupted ?? false,
    symptoms: [
      {
        symptom_code: input.symptom_code,
        duration: input.duration,
        duration_days: input.duration_days,
        specific_metrics: {
          has_blood: input.has_blood_stools ?? false,
        },
      },
    ],
    temperature_celsius: input.temperature_celsius,
    stools_frequency_per_day: input.stools_frequency_per_day,
    vomiting_frequency_per_day: input.vomiting_frequency_per_day,
    comment: input.comment,
  };

  try {
    const client = getApiClient().client;
    const res = await (client as unknown as {
      POST: (url: string, opts: { body: unknown }) => Promise<{ data: MobileHealthEventOut }>;
    }).POST("/v1/health/events", { body: payload });
    return res.data;
  } catch {
    // Save to offline queue if network error
    await queueOfflineEvent(input);
    return {
      id: `offline-${Date.now()}`,
      person_id: input.person_id,
      created_at: new Date().toISOString(),
      status: "open",
      priority: isDanger ? "urgent" : "normal",
      has_danger_sign: isDanger,
      declaration_context: input.declaration_context || "standalone",
      parent_guidance_message: isDanger
        ? "URGENCE VITALE : Conduisez immédiatement l'enfant au centre de santé ou à l'hôpital le plus proche."
        : "Signalement enregistré hors ligne. Il sera synchronisé dès le retour de la connexion.",
      symptoms: [{ symptom_code: input.symptom_code, duration: input.duration }],
    };
  }
}

export async function fetchChildHealthEvents(
  personId: string
): Promise<MobileHealthEventOut[]> {
  try {
    const client = getApiClient().client;
    const res = await (client as unknown as {
      GET: (url: string) => Promise<{ data: MobileHealthEventOut[] }>;
    }).GET(`/v1/health/events/person/${personId}`);
    return res.data || [];
  } catch {
    return [];
  }
}

async function queueOfflineEvent(event: MobileHealthEventInput): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
    const list: MobileHealthEventInput[] = raw ? JSON.parse(raw) : [];
    list.push(event);
    await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage failure
  }
}

export async function syncOfflineHealthEvents(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
    if (!raw) return 0;
    const list: MobileHealthEventInput[] = JSON.parse(raw);
    if (list.length === 0) return 0;

    let synced = 0;
    const remaining: MobileHealthEventInput[] = [];

    for (const item of list) {
      try {
        await submitHealthEvent(item);
        synced += 1;
      } catch {
        remaining.push(item);
      }
    }

    await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    return synced;
  } catch {
    return 0;
  }
}

