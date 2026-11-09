import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ViolationType =
  | "missing_file"
  | "missing_in_en"
  | "missing_in_fr"
  | "empty_value"
  | "variable_mismatch";

export interface I18nViolation {
  namespace: string;
  key: string;
  locale?: "fr" | "en";
  type: ViolationType;
  message: string;
}

const DEFAULT_NAMESPACES = [
  "common",
  "auth",
  "nutrition",
  "caregiver",
  "admin",
  "notifications",
  "errors",
  "medical",
] as const;

export function flattenCatalog(
  obj: Record<string, unknown>,
  prefix = ""
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [rawKey, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${rawKey}` : rawKey;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const nested = flattenCatalog(value as Record<string, unknown>, fullKey);
      for (const [k, v] of nested.entries()) {
        result.set(k, v);
      }
    } else {
      result.set(fullKey, value === null || value === undefined ? "" : String(value));
    }
  }
  return result;
}

export function extractVariables(value: string): string[] {
  const vars = new Set<string>();
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
  let match: RegExpExecArray | null = regex.exec(value);
  while (match !== null) {
    vars.add(match[1].trim());
    match = regex.exec(value);
  }
  return Array.from(vars).sort();
}

function checkMissingAndEmptyKeys(
  namespace: string,
  frMap: Map<string, string>,
  enMap: Map<string, string>
): I18nViolation[] {
  const violations: I18nViolation[] = [];

  for (const [key, frVal] of frMap.entries()) {
    if (!enMap.has(key)) {
      violations.push({
        namespace,
        key,
        locale: "en",
        type: "missing_in_en",
        message: `Key "${key}" is present in FR but missing in EN.`,
      });
    }
    if (frVal.trim().length === 0) {
      violations.push({
        namespace,
        key,
        locale: "fr",
        type: "empty_value",
        message: `Key "${key}" has an empty value in FR.`,
      });
    }
  }

  for (const [key, enVal] of enMap.entries()) {
    if (!frMap.has(key)) {
      violations.push({
        namespace,
        key,
        locale: "fr",
        type: "missing_in_fr",
        message: `Key "${key}" is present in EN but missing in FR.`,
      });
    }
    if (enVal.trim().length === 0) {
      violations.push({
        namespace,
        key,
        locale: "en",
        type: "empty_value",
        message: `Key "${key}" has an empty value in EN.`,
      });
    }
  }

  return violations;
}

export function compareNamespaceCatalogs(
  namespace: string,
  frCatalog: Record<string, unknown>,
  enCatalog: Record<string, unknown>
): I18nViolation[] {
  const frMap = flattenCatalog(frCatalog);
  const enMap = flattenCatalog(enCatalog);
  const violations = checkMissingAndEmptyKeys(namespace, frMap, enMap);

  for (const [key, frVal] of frMap.entries()) {
    const enVal = enMap.get(key);
    if (enVal === undefined) {
      continue;
    }
    const frVars = extractVariables(frVal);
    const enVars = extractVariables(enVal);
    if (frVars.join(",") !== enVars.join(",")) {
      violations.push({
        namespace,
        key,
        type: "variable_mismatch",
        message: `Key "${key}" has mismatched variables: FR=[${frVars.join(", ")}] vs EN=[${enVars.join(", ")}].`,
      });
    }
  }

  return violations;
}

function discoverNamespaces(localesDir: string): string[] {
  const set = new Set<string>(DEFAULT_NAMESPACES);
  for (const locale of ["fr", "en"]) {
    const dir = path.join(localesDir, locale);
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith(".json")) {
          set.add(file.slice(0, -5));
        }
      }
    }
  }
  return Array.from(set).sort();
}

export function checkLocalesDir(
  localesDir: string,
  namespaces?: readonly string[]
): I18nViolation[] {
  const violations: I18nViolation[] = [];
  const nsList = namespaces ? Array.from(namespaces) : discoverNamespaces(localesDir);

  for (const ns of nsList) {
    const frPath = path.join(localesDir, "fr", `${ns}.json`);
    const enPath = path.join(localesDir, "en", `${ns}.json`);

    if (!fs.existsSync(frPath)) {
      violations.push({
        namespace: ns,
        key: "*",
        locale: "fr",
        type: "missing_file",
        message: `Missing FR catalog file: ${frPath}`,
      });
      continue;
    }
    if (!fs.existsSync(enPath)) {
      violations.push({
        namespace: ns,
        key: "*",
        locale: "en",
        type: "missing_file",
        message: `Missing EN catalog file: ${enPath}`,
      });
      continue;
    }

    const frData = JSON.parse(fs.readFileSync(frPath, "utf-8")) as Record<string, unknown>;
    const enData = JSON.parse(fs.readFileSync(enPath, "utf-8")) as Record<string, unknown>;
    violations.push(...compareNamespaceCatalogs(ns, frData, enData));
  }

  return violations;
}

export function runCli(localesDir?: string): number {
  const targetDir = localesDir ?? path.resolve(process.cwd(), "packages/i18n/locales");
  const violations = checkLocalesDir(targetDir);

  if (violations.length > 0) {
    console.error(`[ERROR] Found ${violations.length} i18n catalog violation(s):`);
    for (const v of violations) {
      console.error(`  - [${v.namespace}] ${v.key} (${v.type}): ${v.message}`);
    }
    return 1;
  }

  console.log("[OK] i18n check passed: all FR and EN namespaces match with identical keys and variables.");
  return 0;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  process.exit(runCli(process.argv[2]));
}

