"""Génération du gabarit Excel de saisie pour la base aliments TSOTSA Kids.

Utilise openpyxl pour construire data/gabarit_base_aliments.xlsx avec :
- Feuille 'Base aliments' : colonnes avec listes déroulantes
- Feuille 'Listes' : valeurs de référence pour les validations
- Feuille 'Mode d'emploi' : explications et consignes de saisie
"""

from __future__ import annotations

import csv
from pathlib import Path
import subprocess
import sys
from typing import Any

try:
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.worksheet.datavalidation import DataValidation
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.worksheet.datavalidation import DataValidation

HEADER_FILL = PatternFill(
    start_color="0F7B5F", end_color="0F7B5F", fill_type="solid"
)
HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
TITLE_FONT = Font(name="Calibri", size=14, bold=True, color="0F7B5F")
BOLD_FONT = Font(name="Calibri", size=11, bold=True)
REGULAR_FONT = Font(name="Calibri", size=11)
BORDER_GRAY = Side(style="thin", color="D5DEDA")
CELL_BORDER = Border(
    left=BORDER_GRAY, right=BORDER_GRAY, top=BORDER_GRAY, bottom=BORDER_GRAY
)

COLUMNS: list[tuple[str, int]] = [
    ("aliment", 24),
    ("nom_local", 20),
    ("categorie", 22),
    ("etat", 14),
    ("nutriment", 20),
    ("valeur", 14),
    ("unite", 12),
    ("base", 24),
    ("region", 18),
    ("pays", 16),
    ("orkg_comparaison", 20),
    ("orkg_contribution", 24),
    ("article_reference", 32),
    ("doi", 30),
    ("saisi_par", 18),
    ("date_saisie", 16),
    ("remarque", 30),
]

CATEGORIES: list[str] = [
    "Plat composé",
    "Céréale / Bouillie",
    "Légumineuse",
    "Tubercule / Racine",
    "Légume",
    "Fruit",
    "Graine / Oléagineux",
    "Viande / Poisson / Œuf",
    "Produit laitier",
    "Produit thérapeutique",
    "Autre",
]

UNITS: list[str] = ["mg", "g", "µg", "kcal", "kJ", "%", "ml"]

REGIONS: list[str] = [
    "Adamaoua",
    "Centre",
    "Est",
    "Extrême-Nord",
    "Littoral",
    "Nord",
    "Nord-Ouest",
    "Ouest",
    "Sud",
    "Sud-Ouest",
    "National",
]


def load_nutrients(dict_path: Path) -> list[str]:
    """Charge la liste ordonnée des noms canoniques de nutriments."""
    nutrients: list[str] = []
    if not dict_path.exists():
        return ["Zinc", "Magnésium", "Cuivre", "Fer", "Phytate"]
    with open(dict_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("nom_canonique") or "").strip()
            if name and name not in nutrients:
                nutrients.append(name)
    return nutrients


def populate_lists_sheet(
    ws: Any, nutrients: list[str]
) -> dict[str, str]:
    """Remplit la feuille Listes et retourne les plages de validation."""
    headers = ["Catégories", "Nutriments", "Unités", "Régions"]
    for col_idx, h in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=h)
        cell.font = BOLD_FONT
        cell.alignment = Alignment(horizontal="center")

    max_rows = {
        "A": len(CATEGORIES),
        "B": len(nutrients),
        "C": len(UNITS),
        "D": len(REGIONS),
    }
    for i, item in enumerate(CATEGORIES, start=2):
        ws[f"A{i}"] = item
    for i, item in enumerate(nutrients, start=2):
        ws[f"B{i}"] = item
    for i, item in enumerate(UNITS, start=2):
        ws[f"C{i}"] = item
    for i, item in enumerate(REGIONS, start=2):
        ws[f"D{i}"] = item

    return {
        "categorie": f"Listes!$A$2:$A${max_rows['A'] + 1}",
        "nutriment": f"Listes!$B$2:$B${max_rows['B'] + 1}",
        "unite": f"Listes!$C$2:$C${max_rows['C'] + 1}",
        "region": f"Listes!$D$2:$D${max_rows['D'] + 1}",
    }


def add_validations(ws: Any, ranges: dict[str, str], max_rows: int = 500) -> None:
    """Attache les validations de données par listes déroulantes."""
    val_cat = DataValidation(
        type="list", formula1=f"={ranges['categorie']}", allow_blank=True
    )
    val_nut = DataValidation(
        type="list", formula1=f"={ranges['nutriment']}", allow_blank=True
    )
    val_unit = DataValidation(
        type="list", formula1=f"={ranges['unite']}", allow_blank=True
    )
    val_reg = DataValidation(
        type="list", formula1=f"={ranges['region']}", allow_blank=True
    )

    ws.add_data_validation(val_cat)
    ws.add_data_validation(val_nut)
    ws.add_data_validation(val_unit)
    ws.add_data_validation(val_reg)

    val_cat.add(f"C2:C{max_rows}")
    val_nut.add(f"E2:E{max_rows}")
    val_unit.add(f"G2:G{max_rows}")
    val_reg.add(f"I2:I{max_rows}")


def setup_base_aliments_sheet(ws: Any, ranges: dict[str, str]) -> None:
    """Configure la feuille principale Base aliments avec en-têtes et formats."""
    ws.title = "Base aliments"
    for col_idx, (col_name, width) in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = CELL_BORDER
        col_letter = chr(64 + col_idx) if col_idx <= 26 else f"A{chr(64 + col_idx - 26)}"
        ws.column_dimensions[col_letter].width = width

    ws.row_dimensions[1].height = 28
    ws.freeze_panes = "A2"
    add_validations(ws, ranges)


def write_instructions_section(ws: Any, row: int, title: str, text: str) -> int:
    """Écrit une section dans la feuille Mode d'emploi."""
    ws.cell(row=row, column=1, value=title).font = BOLD_FONT
    ws.cell(row=row + 1, column=1, value=text).font = REGULAR_FONT
    return row + 3


def setup_instructions_sheet(ws: Any) -> None:
    """Rédige la feuille Mode d'emploi avec consignes strictes."""
    ws.title = "Mode d'emploi"
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 75

    ws.cell(row=1, column=1, value="Gabarit de Saisie des Aliments – TSOTSA Kids").font = TITLE_FONT
    row = 3
    row = write_instructions_section(
        ws, row, "1. Règle d'or : Structure",
        "Une seule ligne par couple (aliment, nutriment). Un plat riche en 5 nutriments occupera 5 lignes distinctes."
    )
    row = write_instructions_section(
        ws, row, "2. Règle de stricte intégrité (Zero Mock)",
        "Aucune donnée inventée. Si une information est inconnue, laisser la cellule vide. Ne jamais extrapoler."
    )
    row = write_instructions_section(
        ws, row, "3. Base de calcul",
        "Renseigner systématiquement la base (ex: '100 g de partie comestible, poids frais'). À défaut, mentionner 'À CONFIRMER'."
    )
    row = write_instructions_section(
        ws, row, "4. Traçabilité des sources",
        "Renseigner l'identifiant ORKG (R...), le libellé de contribution, l'article scientifique de référence et son DOI."
    )
    row = write_instructions_section(
        ws, row, "5. Circuit de validation",
        "Chaque fichier importé passe par une double validation humaine dans l'espace administration avant publication."
    )


def build_template_workbook(dict_path: Path) -> Workbook:
    """Construit le classeur Excel complet avec toutes ses feuilles."""
    wb = Workbook()
    ws_main = wb.active
    ws_lists = wb.create_sheet(title="Listes")
    ws_instructions = wb.create_sheet(title="Mode d'emploi")

    nutrients = load_nutrients(dict_path)
    ranges = populate_lists_sheet(ws_lists, nutrients)
    setup_base_aliments_sheet(ws_main, ranges)
    setup_instructions_sheet(ws_instructions)

    # Réorganiser l'ordre des onglets : Base aliments, Mode d'emploi, Listes
    wb._sheets = [ws_main, ws_instructions, ws_lists]
    return wb


def main() -> None:
    """Point d'entrée du script de génération."""
    project_root = Path(__file__).resolve().parent.parent
    dict_path = project_root / "data" / "dictionnaire_nutriments.csv"
    output_path = project_root / "data" / "gabarit_base_aliments.xlsx"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    wb = build_template_workbook(dict_path)
    wb.save(output_path)
    print(f"[OK] Gabarit généré avec succès : {output_path}")


if __name__ == "__main__":
    main()
