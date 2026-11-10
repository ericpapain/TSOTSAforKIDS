import "@testing-library/jest-dom";
import { beforeEach } from "vitest";
import { changeAppLanguage } from "../i18n/setup";

if (typeof window !== "undefined" && window.navigator) {
  Object.defineProperty(window.navigator, "language", {
    value: "fr-FR",
    configurable: true,
  });
  Object.defineProperty(window.navigator, "languages", {
    value: ["fr-FR", "fr"],
    configurable: true,
  });
}

beforeEach(async () => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    window.sessionStorage.clear();
  }
  await changeAppLanguage("fr", { persist: false, syncProfile: false });
});
