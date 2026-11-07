"""Service layer for Domain Growth (WHO 2006 Standards and curves)."""

from __future__ import annotations

import csv
import glob
import os
from decimal import Decimal
from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.modules.growth.engine import (
    ChildAnthropometryEvaluation,
    adjust_measurement_position,
    evaluate_child_anthropometry,
)
from tsotsa_api.modules.growth.repository import GrowthRepository
from tsotsa_api.modules.growth.schemas import CurvePointRead, GrowthCurvesResponse


class GrowthService:
    """Manages WHO reference tables, evaluations of anthropometric measurements, and curves."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = GrowthRepository(session)

    async def seed_from_directory(self, dir_path: str = "data/who") -> int:
        """Idempotently load official WHO CSV files into the database."""
        csv_files = glob.glob(os.path.join(dir_path, "*.csv"))
        loaded_count = 0

        for file_path in csv_files:
            with open(file_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    indicator = r["indicator"]
                    sex: Literal["F", "M"] = "F" if r["sex"] == "F" else "M"
                    x_val = Decimal(r["x_value"])
                    l_val = Decimal(r["L"])
                    m_val = Decimal(r["M"])
                    s_val = Decimal(r["S"])
                    sd3neg = Decimal(r["SD3neg"])
                    sd2neg = Decimal(r["SD2neg"])
                    sd0 = Decimal(r["SD0"])
                    sd2 = Decimal(r["SD2"])
                    sd3 = Decimal(r["SD3"])
                    sd4neg = Decimal(r["SD4neg"]) if r.get("SD4neg") else None
                    sd1neg = Decimal(r["SD1neg"]) if r.get("SD1neg") else None
                    sd1 = Decimal(r["SD1"]) if r.get("SD1") else None
                    sd4 = Decimal(r["SD4"]) if r.get("SD4") else None

                    await self.repo.upsert_row(
                        indicator=indicator,
                        sex=sex,
                        x_value=x_val,
                        l=l_val,
                        m=m_val,
                        s=s_val,
                        sd3neg=sd3neg,
                        sd2neg=sd2neg,
                        sd0=sd0,
                        sd2=sd2,
                        sd3=sd3,
                        sd4neg=sd4neg,
                        sd1neg=sd1neg,
                        sd1=sd1,
                        sd4=sd4,
                    )
                    loaded_count += 1

        await self.session.commit()
        return loaded_count

    async def evaluate_measurements(
        self,
        weight_kg: Decimal,
        length_cm: Decimal,
        age_days: int,
        sex: Literal["F", "M"],
        muac_mm: Decimal | None = None,
        position: str | None = None,
        edema: str | None = None,
    ) -> tuple[ChildAnthropometryEvaluation, Decimal, str]:
        """Perform position correction, lookup WHO parameters, and compute all z-scores."""
        adj_len_float, final_pos = adjust_measurement_position(
            length_or_height=float(length_cm),
            position=position,
            age_days=age_days,
        )
        adj_len = Decimal(str(adj_len_float))

        # Select WFL (length, 0-2 yrs) or WFH (height, >= 2 yrs)
        wfl_indicator = "wfl" if age_days < 731 else "wfh"
        ref_wfl = await self.repo.get_reference_row(wfl_indicator, sex, adj_len)
        ref_lhfa = await self.repo.get_reference_row("lhfa", sex, age_days)
        ref_wfa = await self.repo.get_reference_row("wfa", sex, age_days)
        ref_acfa = await self.repo.get_reference_row("acfa", sex, age_days) if muac_mm else None
        ref_bfa = await self.repo.get_reference_row("bfa", sex, age_days)

        evaluation = evaluate_child_anthropometry(
            weight_kg=weight_kg,
            length_height_cm=adj_len,
            age_days=age_days,
            sex=sex,
            muac_mm=muac_mm,
            position=final_pos,
            edema=edema,
            ref_wfl=ref_wfl,
            ref_lhfa=ref_lhfa,
            ref_wfa=ref_wfa,
            ref_acfa=ref_acfa,
            ref_bfa=ref_bfa,
        )

        return evaluation, adj_len, final_pos

    async def get_growth_curves(
        self, indicator: str, sex: Literal["F", "M"]
    ) -> GrowthCurvesResponse:
        """Return full standard deviation points for plotting growth charts."""
        records = await self.repo.get_reference_curve(indicator, sex)
        unit_x = "cm" if indicator in ("wfl", "wfh") else "jours"
        points = [
            CurvePointRead(
                x_value=r.x_value,
                sd3neg=r.sd3neg,
                sd2neg=r.sd2neg,
                sd0=r.sd0,
                sd2=r.sd2,
                sd3=r.sd3,
            )
            for r in records
        ]
        return GrowthCurvesResponse(
            indicator=indicator,
            sex=sex,
            unit_x=unit_x,
            points=points,
        )
