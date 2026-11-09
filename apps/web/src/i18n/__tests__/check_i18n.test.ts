import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  compareNamespaceCatalogs,
  checkLocalesDir,
  runCli,
} from "../../../../../scripts/check_i18n";

describe("check_i18n catalog validator", () => {
  it("passes on packages/i18n/locales", () => {
    const localesDir = path.resolve(__dirname, "../../../../../packages/i18n/locales");
    expect(checkLocalesDir(localesDir)).toEqual([]);
    expect(runCli(localesDir)).toBe(0);
  });

  it("detects a missing key in EN or FR", () => {
    const violations = compareNamespaceCatalogs(
      "common",
      { header: { title: "Titre", extraFr: "Seulement FR" } },
      { header: { title: "Title" } }
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      namespace: "common",
      key: "header.extraFr",
      type: "missing_in_en",
    });
  });

  it("detects an empty value", () => {
    const violations = compareNamespaceCatalogs(
      "common",
      { header: { title: "Titre" } },
      { header: { title: "   " } }
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      namespace: "common",
      key: "header.title",
      locale: "en",
      type: "empty_value",
    });
  });

  it("detects a different {{variable}} placeholder", () => {
    const violations = compareNamespaceCatalogs(
      "common",
      { notif: "Notifications ({{count}} non lues)" },
      { notif: "Notifications ({{total}} unread)" }
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      namespace: "common",
      key: "notif",
      type: "variable_mismatch",
    });
  });
});

