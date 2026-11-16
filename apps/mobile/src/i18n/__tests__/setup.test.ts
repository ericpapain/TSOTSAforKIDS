import * as SecureStore from "expo-secure-store";
import {
  changeMobileLanguage,
  getStoredLocale,
  initMobileI18n,
  resolvePreferredLocale,
  resolvePreferredLocaleSync,
  storeLocaleChoice,
} from "../setup";
import { buildLocalReminderContent } from "../../notifications";
import { calculateAgeLabel } from "../../features/persons/personsService";

describe("mobile i18n setup & priority", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await initMobileI18n("fr");
  });

  it("prioritizes profile.preferred_locale over stored choice and device locale", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("fr");
    const locale = await resolvePreferredLocale({
      profileLocale: "en",
      phoneLocales: ["fr-FR"],
    });
    expect(locale).toBe("en");
  });

  it("falls back to stored choice when profile locale is absent", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("en");
    const locale = await resolvePreferredLocale({
      phoneLocales: ["fr-FR"],
    });
    expect(locale).toBe("en");
  });

  it("falls back to device locale when no profile or stored choice exists", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const localeEn = await resolvePreferredLocale({
      phoneLocales: ["en-US"],
    });
    expect(localeEn).toBe("en");

    const localeFr = await resolvePreferredLocale({
      phoneLocales: ["fr-CA"],
    });
    expect(localeFr).toBe("fr");
  });

  it("defaults to 'fr' when device locale is neither fr nor en", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const locale = await resolvePreferredLocale({
      phoneLocales: ["es-ES", "de-DE"],
    });
    expect(locale).toBe("fr");
  });

  it("synchronously resolves language with same priority", () => {
    expect(resolvePreferredLocaleSync({ profileLocale: "en", storedLocale: "fr" })).toBe("en");
    expect(resolvePreferredLocaleSync({ storedLocale: "en", phoneLocales: ["fr"] })).toBe("en");
    expect(resolvePreferredLocaleSync({ phoneLocales: ["en-GB"] })).toBe("en");
    expect(resolvePreferredLocaleSync({ phoneLocales: ["it-IT"] })).toBe("fr");
  });

  it("stores and retrieves language in SecureStore", async () => {
    await storeLocaleChoice("en");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("tsotsa.locale", "en");

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("en");
    const stored = await getStoredLocale();
    expect(stored).toBe("en");
  });

  it("switches mobile language dynamically with changeMobileLanguage", async () => {
    const switched = await changeMobileLanguage("en");
    expect(switched).toBe("en");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("tsotsa.locale", "en");
  });
});

describe("localized offline notification and age formatting", () => {
  it("builds notification content in French and English with localized action labels", () => {
    const frReminder = buildLocalReminderContent({
      personName: "Amina",
      productName: "Plumpy'Nut",
      quantity: "1",
      unit: "sachet",
      locale: "fr",
    });
    expect(frReminder.title).toBe("TSOTSA KIDS • maintenant");
    expect(frReminder.body).toContain("Rappel pour Amina");
    const frGiven = frReminder.actions.find((a) => a.id === "given")?.title;
    const frLater = frReminder.actions.find((a) => a.id === "later")?.title;
    const frNotGiven = frReminder.actions.find((a) => a.id === "not_given")?.title;
    expect(frGiven).toBe("C'est donné");
    expect(frLater).toBe("Plus tard");
    expect(frNotGiven).toBe("Pas donné");

    const enReminder = buildLocalReminderContent({
      personName: "Amina",
      productName: "Plumpy'Nut",
      quantity: "1",
      unit: "sachet",
      locale: "en",
    });
    expect(enReminder.title).toBe("TSOTSA KIDS • now");
    expect(enReminder.body).toContain("Reminder for Amina");
    const enGiven = enReminder.actions.find((a) => a.id === "given")?.title;
    const enLater = enReminder.actions.find((a) => a.id === "later")?.title;
    const enNotGiven = enReminder.actions.find((a) => a.id === "not_given")?.title;
    expect(enGiven).toBe("Given");
    expect(enLater).toBe("Later");
    expect(enNotGiven).toBe("Not given");
  });

  it("formats age label according to active locale", () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

    const frAge = calculateAgeLabel(oneMonthAgo, "fr");
    const enAge = calculateAgeLabel(oneMonthAgo, "en");

    expect(frAge).toContain("mois");
    expect(enAge).toContain("month");
  });
});
