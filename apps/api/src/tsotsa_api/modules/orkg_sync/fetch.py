"""Step 1 of ORKG pipeline: Fetch comparison via ORKG API, manual CSV, or snapshot."""

from __future__ import annotations

import csv
import hashlib
import io
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from tsotsa_api.modules.orkg_sync.models import OrkgSnapshot
from tsotsa_api.modules.orkg_sync.schemas import FetchedComparisonData


def _resolve_default_exports_dir(exports_dir: Path | None) -> Path:
    if exports_dir is not None:
        return exports_dir
    for candidate in [
        Path("data/orkg_exports"),
        Path("../../data/orkg_exports"),
        Path(__file__).parents[5] / "data" / "orkg_exports",
    ]:
        if candidate.exists():
            return candidate
    return Path("data/orkg_exports")


def _resolve_default_raw_root(raw_root: Path | None) -> Path:
    if raw_root is not None:
        return raw_root
    for base in [Path("."), Path("../.."), Path(__file__).parents[5]]:
        if (base / "data").exists():
            return base / "data" / "orkg" / "raw"
    return Path("data/orkg/raw")


def _compute_checksum(headers: list[str], rows: list[list[str]]) -> str:
    payload = json.dumps({"headers": headers, "rows": rows}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _save_raw_snapshot_file(
    raw_root: Path,
    comparison_id: str,
    fetched_at: datetime,
    headers: list[str],
    rows: list[list[str]],
) -> str:
    comp_dir = raw_root / comparison_id
    comp_dir.mkdir(parents=True, exist_ok=True)
    stamp = fetched_at.strftime("%Y%m%dT%H%M%SZ")
    file_path = comp_dir / f"{stamp}.json"
    content = {
        "comparison_id": comparison_id,
        "fetched_at": fetched_at.isoformat(),
        "headers": headers,
        "rows": rows,
    }
    file_path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
    return file_path.as_posix()


def _dataframe_to_table(df_or_resp: Any) -> tuple[list[str], list[list[str]]]:
    data = getattr(df_or_resp, "content", df_or_resp)
    if isinstance(data, tuple) and len(data) >= 1:
        data = data[0]

    if isinstance(data, dict) and "headers" in data and "rows" in data:
        return list(data["headers"]), [list(r) for r in data["rows"]]

    if hasattr(data, "columns") and hasattr(data, "iterrows"):
        cols = [str(c) for c in data.columns]
        if not cols:
            raise ValueError("DataFrame ORKG vide (aucune colonne).")
        if cols[0] == "Properties":
            headers = cols
            rows = [[str(v) if v is not None else "" for v in row] for _, row in data.iterrows()]
            return headers, rows
        headers = ["Properties", *cols]
        rows = [
            [str(idx), *[str(v) if v is not None else "" for v in row]]
            for idx, row in data.iterrows()
        ]
        return headers, rows

    raise ValueError("Format de réponse ORKG non reconnu.")


def _fetch_from_orkg_api(
    comparison_id: str, orkg_client: Any | None = None
) -> tuple[list[str], list[list[str]]]:
    client = orkg_client
    if client is None:
        from tsotsa_api.core.config import get_settings

        if get_settings().APP_ENV == "test":
            raise RuntimeError("Mode test hors-ligne : repli ORKG activé.")
        from orkg import ORKG

        client = ORKG(host="https://orkg.org")

    resp = client.contributions.compare_dataframe(
        comparison_id=comparison_id,
        like_ui=False,
        include_meta=True,
    )
    if hasattr(resp, "succeeded") and not resp.succeeded:
        raise RuntimeError(f"ORKG API returned unsuccessful response for {comparison_id}")
    return _dataframe_to_table(resp)


def _find_manual_csv_table(
    comparison_id: str, exports_dir: Path
) -> tuple[list[str], list[list[str]], str] | None:
    if not exports_dir.exists():
        return None
    matches = sorted(exports_dir.glob(f"{comparison_id}*.csv"))
    if not matches:
        return None
    csv_path = matches[0]
    raw_text = csv_path.read_text(encoding="utf-8-sig")
    reader = list(csv.reader(io.StringIO(raw_text)))
    if not reader or len(reader[0]) <= 1:
        return None
    headers = [c.strip() for c in reader[0]]
    rows = [[c.strip() for c in r] for r in reader[1:] if any(c.strip() for c in r)]
    return headers, rows, csv_path.as_posix()


def fetch_comparison_with_fallback(
    comparison_id: str,
    orkg_client: Any | None = None,
    exports_dir: Path | None = None,
    raw_root: Path | None = None,
    latest_snapshot: OrkgSnapshot | None = None,
) -> tuple[FetchedComparisonData | None, str | None]:
    """Fetch ORKG comparison via API -> manual CSV -> latest snapshot."""
    now = datetime.now(UTC)
    exp_dir = _resolve_default_exports_dir(exports_dir)
    r_root = _resolve_default_raw_root(raw_root)
    api_error: str | None = None

    try:
        headers, rows = _fetch_from_orkg_api(comparison_id, orkg_client=orkg_client)
        checksum = _compute_checksum(headers, rows)
        raw_file = _save_raw_snapshot_file(r_root, comparison_id, now, headers, rows)
        return (
            FetchedComparisonData(
                comparison_id=comparison_id,
                fetched_at=now,
                method="api",
                checksum=checksum,
                raw_file=raw_file,
                headers=headers,
                rows=rows,
            ),
            None,
        )
    except Exception as exc:
        api_error = f"Alerte ORKG ({comparison_id}) : échec de récupération API ({exc})."

    csv_res = _find_manual_csv_table(comparison_id, exp_dir)
    if csv_res is not None:
        headers, rows, _ = csv_res
        checksum = _compute_checksum(headers, rows)
        raw_file = _save_raw_snapshot_file(r_root, comparison_id, now, headers, rows)
        alert = f"{api_error} Repli sur l'export CSV manuel."
        return (
            FetchedComparisonData(
                comparison_id=comparison_id,
                fetched_at=now,
                method="manual_csv",
                checksum=checksum,
                raw_file=raw_file,
                headers=headers,
                rows=rows,
                alert_message=alert,
            ),
            alert,
        )

    if latest_snapshot and latest_snapshot.raw_payload:
        headers = list(latest_snapshot.raw_payload.get("headers", []))
        rows = [list(r) for r in latest_snapshot.raw_payload.get("rows", [])]
        if headers and rows:
            checksum = _compute_checksum(headers, rows)
            alert = f"{api_error} Repli sur le dernier instantané ({latest_snapshot.id})."
            return (
                FetchedComparisonData(
                    comparison_id=comparison_id,
                    fetched_at=now,
                    method="snapshot",
                    checksum=checksum,
                    raw_file=latest_snapshot.raw_file,
                    headers=headers,
                    rows=rows,
                    alert_message=alert,
                ),
                alert,
            )

    fail_alert = f"{api_error} Aucun export CSV ni instantané disponible."
    return None, fail_alert
