import "@testing-library/jest-dom";

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
