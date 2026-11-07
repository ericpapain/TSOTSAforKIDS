"""Conversion d'un export CSV ORKG vers les lignes du gabarit TSOTSA Kids.

Lit un export CSV ORKG (Type A: composition par nutriment, Type B: recettes),
normalise les nutriments selon le dictionnaire officiel et produit les lignes du gabarit.
Règle absolue : Ne jamais deviner ni inventer de valeur manquante.
"""

from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Any


@dataclass
class NutrientDef:
    canonical_name: str
    code: str
    category: str
    synonyms: list[str]
    reference_unit: str
    conversion_factors: dict[str, float]
    plausible_min: float
    plausible_max: float


@dataclass
class ConversionReport:
    total_contributions: int = 0
    converted_rows: int = 0
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def parse_conversion_factors(factors_str: str) -> dict[str, float]:
    """Parse les facteurs de conversion séparés par des barres."""
    factors: dict[str, float] = {}
    for part in factors_str.split("|"):
        if ":" in part:
            unit, val = part.split(":", 1)
            try:
                factors[unit.strip()] = float(val.strip())
            except ValueError:
                pass
    return factors


def load_dictionary(dict_path: Path) -> dict[str, NutrientDef]:
    """Charge le dictionnaire des nutriments indexé par synonyme normalisé."""
    synonym_map: dict[str, NutrientDef] = {}
    if not dict_path.exists():
        return synonym_map
    with open(dict_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            canon = row.get("nom_canonique", "").strip()
            syns = [s.strip() for s in row.get("synonymes", "").split("|") if s.strip()]
            ndef = NutrientDef(
                canonical_name=canon,
                code=row.get("code", "").strip(),
                category=row.get("categorie", "").strip(),
                synonyms=syns,
                reference_unit=row.get("unite_reference", "").strip(),
                conversion_factors=parse_conversion_factors(row.get("facteurs_conversion", "")),
                plausible_min=float(row.get("plausible_min_100g", "0") or "0"),
                plausible_max=float(row.get("plausible_max_100g", "10000") or "10000"),
            )
            synonym_map[canon.lower()] = ndef
            synonym_map[ndef.code.lower()] = ndef
            for syn in syns:
                synonym_map[syn.lower()] = ndef
    return synonym_map


def match_nutrient(name: str, dict_map: dict[str, NutrientDef]) -> NutrientDef | None:
    """Retrouve la définition d'un nutriment à partir de son nom brut."""
    cleaned = name.strip().lower()
    if cleaned in dict_map:
        return dict_map[cleaned]
    if ":" in cleaned:
        cleaned = cleaned.split(":")[-1].strip()
        if cleaned in dict_map:
            return dict_map[cleaned]
    return None


def parse_label_type_a(label: str) -> tuple[str, str, str]:
    """Extrait le nom du plat, l'échantillon et le nutriment depuis un libellé."""
    m = re.match(r"^(.+?)(0[1-9]|[1-9][0-9])?_([A-Za-zÀ-ÿ]+)$", label.strip())
    if m:
        return m.group(1).strip(), m.group(2) or "", m.group(3).strip()
    return label.strip(), "", ""


def read_orkg_csv(csv_path: Path) -> tuple[list[str], dict[str, list[str]]]:
    """Lit un fichier CSV ORKG structuré par propriétés en lignes."""
    with open(csv_path, mode="r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        return [], {}
    headers = [h.strip() for h in rows[0]]
    properties: dict[str, list[str]] = {}
    for r in rows[1:]:
        if not r:
            continue
        prop_name = r[0].strip()
        vals = [v.strip() for v in r[1:]]
        if len(vals) < len(headers) - 1:
            vals.extend([""] * (len(headers) - 1 - len(vals)))
        properties[prop_name] = vals
    return headers[1:], properties


def convert_value_unit(
    raw_val: str, raw_unit: str, ndef: NutrientDef | None, report: ConversionReport, label: str
) -> tuple[float | None, str]:
    """Convertit une valeur dans l'unité de référence si possible."""
    try:
        val_float = float(raw_val.replace(",", "."))
    except ValueError:
        report.errors.append(f"[{label}] Valeur non numérique : '{raw_val}'")
        return None, raw_unit
    if not ndef:
        return val_float, raw_unit
    unit_clean = raw_unit.strip()
    if not unit_clean or unit_clean == ndef.reference_unit:
        return val_float, ndef.reference_unit
    if unit_clean in ndef.conversion_factors:
        return val_float * ndef.conversion_factors[unit_clean], ndef.reference_unit
    report.warnings.append(
        f"[{label}] Unité '{unit_clean}' non convertible vers '{ndef.reference_unit}'"
    )
    return val_float, unit_clean


def extract_raw_values(
    col_idx: int, properties: dict[str, list[str]], nut_label: str
) -> tuple[str, str, str]:
    """Extrait le nutriment brut, la valeur brute et l'unité brute."""
    comp_rows = [k for k in properties if "component name" in k.lower()]
    raw_nut = properties[comp_rows[0]][col_idx] if comp_rows else nut_label
    num_rows = [k for k in properties if k.lower() in ("numericvalue", "numeric_value")]
    unit_rows = [k for k in properties if k.lower() == "unit"]
    raw_num = properties[num_rows[0]][col_idx] if num_rows else ""
    raw_unit = properties[unit_rows[0]][col_idx] if unit_rows else ""
    if not raw_num:
        val_rows = [k for k in properties if k.lower() == "value"]
        if val_rows:
            parts = properties[val_rows[0]][col_idx].split()
            raw_num = parts[0] if parts else ""
            raw_unit = parts[1] if len(parts) > 1 else raw_unit
    return raw_nut, raw_num, raw_unit


def convert_type_a_column(
    col_idx: int,
    contrib_label: str,
    properties: dict[str, list[str]],
    dict_map: dict[str, NutrientDef],
    report: ConversionReport,
    metadata: dict[str, str],
) -> dict[str, Any] | None:
    """Convertit une colonne de contribution Type A en une ligne gabarit."""
    dish, sample, nut_label = parse_label_type_a(contrib_label)
    raw_nut, raw_num, raw_unit = extract_raw_values(col_idx, properties, nut_label)
    ndef = match_nutrient(raw_nut or nut_label, dict_map)
    canonical_nut = ndef.canonical_name if ndef else (raw_nut or nut_label)
    if not ndef:
        report.warnings.append(f"[{contrib_label}] Nutriment non reconnu : '{raw_nut}'")
    if not raw_num:
        report.errors.append(f"[{contrib_label}] Aucune valeur trouvée")
        return None
    converted_val, final_unit = convert_value_unit(raw_num, raw_unit, ndef, report, contrib_label)
    if converted_val is None:
        return None
    if ndef and (converted_val < ndef.plausible_min or converted_val > ndef.plausible_max):
        report.warnings.append(
            f"[{contrib_label}] Valeur hors limites : {converted_val} {final_unit}"
        )
    art_rows = [k for k in properties if "titre" in k.lower() or "title" in k.lower()]
    doi_rows = [k for k in properties if k.lower() == "doi"]
    return {
        "aliment": dish,
        "nom_local": dish,
        "categorie": "Plat composé",
        "etat": "cuit",
        "nutriment": canonical_nut,
        "valeur": round(converted_val, 4),
        "unite": final_unit,
        "base": metadata.get("base", "À CONFIRMER"),
        "region": metadata.get("region", "Centre"),
        "pays": metadata.get("pays", "Cameroun"),
        "orkg_comparaison": metadata.get("comparison_id", ""),
        "orkg_contribution": contrib_label,
        "article_reference": properties[art_rows[0]][col_idx] if art_rows else metadata.get("article", ""),
        "doi": properties[doi_rows[0]][col_idx] if doi_rows else metadata.get("doi", ""),
        "saisi_par": metadata.get("saisi_par", "ORKG"),
        "date_saisie": metadata.get("date_saisie", ""),
        "remarque": f"Échantillon {sample}" if sample else "",
    }


def convert_export_file(
    input_csv: Path, dict_path: Path, metadata: dict[str, str] | None = None
) -> tuple[list[dict[str, Any]], ConversionReport]:
    """Convertit un export ORKG complet en liste de lignes de gabarit."""
    meta = metadata or {}
    report = ConversionReport()
    dict_map = load_dictionary(dict_path)
    headers, properties = read_orkg_csv(input_csv)
    report.total_contributions = len(headers)
    gabarit_rows: list[dict[str, Any]] = []
    for idx, contrib_label in enumerate(headers):
        if "ingredient" in contrib_label.lower():
            report.warnings.append(
                f"[{contrib_label}] Ligne de recette (Type B) non convertie en aliment simple"
            )
            continue
        row = convert_type_a_column(idx, contrib_label, properties, dict_map, report, meta)
        if row:
            gabarit_rows.append(row)
            report.converted_rows += 1
    return gabarit_rows, report


def write_gabarit_csv(rows: list[dict[str, Any]], output_csv: Path) -> None:
    """Écrit les lignes converties dans un fichier CSV compatible gabarit."""
    if not rows:
        return
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(output_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    """Point d'entrée en ligne de commande du convertisseur."""
    parser = argparse.ArgumentParser(description="Convertit un export ORKG en gabarit.")
    parser.add_argument("input_csv", type=Path, help="Fichier CSV exporté d'ORKG")
    parser.add_argument("--output", type=Path, default=None, help="Chemin du CSV de sortie")
    parser.add_argument("--dict", type=Path, default=None, help="Dictionnaire des nutriments")
    parser.add_argument("--cid", type=str, default="", help="Identifiant comparaison ORKG")
    args = parser.parse_args()
    project_root = Path(__file__).resolve().parent.parent
    dict_path = args.dict or project_root / "data" / "dictionnaire_nutriments.csv"
    meta = {"comparison_id": args.cid or args.input_csv.stem.split("_")[0]}
    rows, report = convert_export_file(args.input_csv, dict_path, meta)
    if args.output:
        write_gabarit_csv(rows, args.output)
        print(f"[OK] {len(rows)} lignes écrites dans {args.output}")
    print(f"Rapport : {report.converted_rows}/{report.total_contributions} contributions converties.")


if __name__ == "__main__":
    main()
