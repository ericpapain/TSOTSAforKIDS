import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  compareNamespaceCatalogs,
  checkLocalesDir,
  runCli,
} from "../../../scripts/check_i18n";

describe("scripts/check_i18n", () => {
  it("validates the repository packages/i18n/locales without any violation", () => {
    const repoLocales = path.resolve(__dirname, "../locales");
    const violations = checkLocalesDir(repoLocales);
    expect(violations).toEqual([]);
    expect(runCli(repoLocales)).toBe(0);
  });

  it("detects a missing key in EN or FR", () => {
    const frFixture = {
      header: {
        title: "Espace soignant",
        onlyInFr: "Texte présent uniquement en français",
      },
    };
    const enFixture = {
      header: {
        title: "Caregiver portal",
        onlyInEn: "Text only in English",
      },
    };

    const violations = compareNamespaceCatalogs("common", frFixture, enFixture);
    expect(violations).toHaveLength(2);
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          namespace: "common",
          key: "header.onlyInFr",
          type: "missing_in_en",
        }),
        expect.objectContaining({
          namespace: "common",
          key: "header.onlyInEn",
          type: "missing_in_fr",
        }),
      ])
    );
  });

  it("detects an empty value in FR or EN", () => {
    const frFixture = {
      actions: {
        save: "Enregistrer",
        cancel: "   ",
      },
    };
    const enFixture = {
      actions: {
        save: "",
        cancel: "Cancel",
      },
    };

    const violations = compareNamespaceCatalogs("common", frFixture, enFixture);
    expect(violations).toHaveLength(2);
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          namespace: "common",
          key: "actions.cancel",
          locale: "fr",
          type: "empty_value",
        }),
        expect.objectContaining({
          namespace: "common",
          key: "actions.save",
          locale: "en",
          type: "empty_value",
        }),
      ])
    );
  });

  it("detects mismatched {{variables}} between FR and EN", () => {
    const frFixture = {
      notifications: {
        unread: "Vous avez {{count}} message de {{sender}}",
      },
    };
    const enFixture = {
      notifications: {
        unread: "You have {{count}} message from {{author}}",
      },
    };

    const violations = compareNamespaceCatalogs("notifications", frFixture, enFixture);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      namespace: "notifications",
      key: "notifications.unread",
      type: "variable_mismatch",
    });
  });

  it("returns exit code 1 from runCli when fixture directory has violations", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tsotsa-i18n-test-"));
    try {
      fs.mkdirSync(path.join(tmpRoot, "fr"), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, "en"), { recursive: true });

      fs.writeFileSync(
        path.join(tmpRoot, "fr", "common.json"),
        JSON.stringify({ greeting: "Bonjour {{name}}" }),
        "utf-8"
      );
      fs.writeFileSync(
        path.join(tmpRoot, "en", "common.json"),
        JSON.stringify({ greeting: "Hello {{user}}" }),
        "utf-8"
      );

      const code = runCli(tmpRoot);
      expect(code).toBe(1);
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

