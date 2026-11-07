"""Download official WHO Child Growth Standards (2006) and extract into data/who/."""

from __future__ import annotations

import csv
import io
import os
import urllib.request
from datetime import UTC, datetime

import openpyxl

WHO_TABLES = [
    {
        "indicator": "wfl",
        "sex": "F",
        "name": "wfl_girls_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-length-height/expanded-tables/wfl-girls-zscore-expanded-table.xlsx?sfvrsn=db7b5d6b_8",
        "x_label": "length_cm",
    },
    {
        "indicator": "wfl",
        "sex": "M",
        "name": "wfl_boys_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-length-height/expanded-tables/wfl-boys-zscore-expanded-table.xlsx?sfvrsn=d307434f_8",
        "x_label": "length_cm",
    },
    {
        "indicator": "wfh",
        "sex": "F",
        "name": "wfh_girls_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-length-height/expanded-tables/wfh-girls-zscore-expanded-tables.xlsx?sfvrsn=daac732c_8",
        "x_label": "height_cm",
    },
    {
        "indicator": "wfh",
        "sex": "M",
        "name": "wfh_boys_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-length-height/expanded-tables/wfh-boys-zscore-expanded-tables.xlsx?sfvrsn=ac60cb13_8",
        "x_label": "height_cm",
    },
    {
        "indicator": "lhfa",
        "sex": "F",
        "name": "lhfa_girls_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/expandable-tables/lhfa-girls-zscore-expanded-tables.xlsx?sfvrsn=27f1e2cb_10",
        "x_label": "age_days",
    },
    {
        "indicator": "lhfa",
        "sex": "M",
        "name": "lhfa_boys_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/expandable-tables/lhfa-boys-zscore-expanded-tables.xlsx?sfvrsn=7b4a3428_12",
        "x_label": "age_days",
    },
    {
        "indicator": "wfa",
        "sex": "F",
        "name": "wfa_girls_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-tables.xlsx?sfvrsn=f01bc813_10",
        "x_label": "age_days",
    },
    {
        "indicator": "wfa",
        "sex": "M",
        "name": "wfa_boys_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-tables.xlsx?sfvrsn=65cce121_10",
        "x_label": "age_days",
    },
    {
        "indicator": "acfa",
        "sex": "F",
        "name": "acfa_girls_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/arm-circumference-for-age/expanded-tables/acfa-girls-zscore-expanded-tables.xlsx?sfvrsn=31a482c5_8",
        "x_label": "age_days",
    },
    {
        "indicator": "acfa",
        "sex": "M",
        "name": "acfa_boys_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/arm-circumference-for-age/expanded-tables/acfa-boys-zscore-expanded-tables.xlsx?sfvrsn=76ed87fa_10",
        "x_label": "age_days",
    },
    {
        "indicator": "bfa",
        "sex": "F",
        "name": "bfa_girls_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/body-mass-index-for-age/expanded-tables/bfa-girls-zscore-expanded-tables.xlsx?sfvrsn=ae4cb8d1_12",
        "x_label": "age_days",
    },
    {
        "indicator": "bfa",
        "sex": "M",
        "name": "bfa_boys_expanded",
        "url": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/body-mass-index-for-age/expanded-tables/bfa-boys-zscore-expanded-tables.xlsx?sfvrsn=f8e1fbe2_10",
        "x_label": "age_days",
    },
]


def download_and_extract(output_dir: str = "data/who") -> None:
    """Download official WHO Child Growth Standards tables and save raw and CSV representations."""
    os.makedirs(output_dir, exist_ok=True)
    raw_dir = os.path.join(output_dir, "raw")
    os.makedirs(raw_dir, exist_ok=True)

    sources_lines = [
        "# Sources des Tables de Croissance de l'OMS (Standards 2006)",
        "",
        f"Date de téléchargement : {datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "Source officielle : Organisation Mondiale de la Santé (OMS / WHO) - Child Growth Standards",
        "Portail : https://www.who.int/tools/child-growth-standards/standards",
        "",
        "| Indicateur | Sexe | X (unité) | Nom de fichier brut | URL officielle |",
        "|---|---|---|---|---|",
    ]

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for item in WHO_TABLES:
        raw_filename = f"{item['name']}.xlsx"
        raw_path = os.path.join(raw_dir, raw_filename)
        csv_filename = f"{item['indicator']}_{item['sex'].lower()}.csv"
        csv_path = os.path.join(output_dir, csv_filename)

        print(f"Téléchargement {item['name']} depuis {item['url']}...")
        req = urllib.request.Request(item["url"], headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read()

        with open(raw_path, "wb") as f_raw:
            f_raw.write(content)

        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue

        # Standard header: x_value, L, M, S, SD4neg, SD3neg, SD2neg, SD1neg, SD0, SD1, SD2, SD3, SD4
        header_row = rows[0]
        with open(csv_path, "w", encoding="utf-8", newline="") as f_csv:
            writer = csv.writer(f_csv)
            writer.writerow(
                [
                    "indicator",
                    "sex",
                    "x_value",
                    "L",
                    "M",
                    "S",
                    "SD4neg",
                    "SD3neg",
                    "SD2neg",
                    "SD1neg",
                    "SD0",
                    "SD1",
                    "SD2",
                    "SD3",
                    "SD4",
                ]
            )

            for r in rows[1:]:
                if r[0] is None:
                    continue
                # r[0] is length / height / age
                writer.writerow(
                    [
                        item["indicator"],
                        item["sex"],
                        r[0],
                        r[1],
                        r[2],
                        r[3],
                        r[4],
                        r[5],
                        r[6],
                        r[7],
                        r[8],
                        r[9],
                        r[10],
                        r[11],
                        r[12],
                    ]
                )

        sources_lines.append(
            f"| `{item['indicator']}` | {item['sex']} | {item['x_label']} | `{raw_filename}` | {item['url']} |"
        )
        print(f"  -> Sauvegardé {csv_path} ({len(rows) - 1} lignes)")

    sources_path = os.path.join(output_dir, "SOURCES.md")
    with open(sources_path, "w", encoding="utf-8") as f_src:
        f_src.write("\n".join(sources_lines) + "\n")
    print(f"Génération terminée : {sources_path}")


if __name__ == "__main__":
    download_and_extract()

