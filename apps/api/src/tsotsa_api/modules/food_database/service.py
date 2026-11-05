"""Service orchestrating food ingestion, validation, manual entry, review, and search."""

from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError, ValidationError
from tsotsa_api.modules.food_database.importer import (
    guess_column_mapping,
    parse_csv_file,
    parse_xlsx_file,
)
from tsotsa_api.modules.food_database.manual import create_manual_food_entry
from tsotsa_api.modules.food_database.models import (
    Food,
    FoodNutrientValue,
    ImportBatch,
    ImportBatchRow,
)
from tsotsa_api.modules.food_database.persistence import persist_imported_row
from tsotsa_api.modules.food_database.repository import FoodDatabaseRepository
from tsotsa_api.modules.food_database.schemas import (
    BatchValidationReport,
    ManualFoodCreate,
)
from tsotsa_api.modules.food_database.validation import IngestionValidator
from tsotsa_api.modules.nutrients.service import NutrientService


class FoodDatabaseService:
    """Core domain service for food imports, quality gatekeeping, and publishing workflow."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = FoodDatabaseRepository(session)
        self.nutrient_service = NutrientService(session)
        self.validator = IngestionValidator(self.nutrient_service)

    async def create_import_batch_from_file(
        self, user_id: str, file_name: str, file_bytes: bytes
    ) -> ImportBatch:
        lower_name = file_name.lower()
        if lower_name.endswith(".csv"):
            headers, rows = parse_csv_file(file_bytes)
            file_type = "csv"
        elif lower_name.endswith(".xlsx"):
            headers, rows = parse_xlsx_file(file_bytes)
            file_type = "xlsx"
        else:
            raise ValidationError("Format de fichier non pris en charge. Utilisez .xlsx ou .csv.")

        if not headers or not rows:
            raise ValidationError(
                "Le fichier déposé est vide ou ne contient aucune ligne de données."
            )

        mapping = guess_column_mapping(headers)
        batch = ImportBatch(
            file_name=file_name,
            file_type=file_type,
            status="draft",
            created_by=user_id,
            column_mapping=mapping,
        )
        self.session.add(batch)
        await self.session.flush()

        for idx, row in enumerate(rows, start=1):
            batch_row = ImportBatchRow(
                batch_id=batch.id,
                row_number=idx,
                raw_data=row,
                status="valid",
            )
            self.session.add(batch_row)

        await self.session.flush()
        return batch

    async def update_column_mapping(self, batch_id: str, mapping: dict[str, str]) -> ImportBatch:
        batch = await self.repo.get_batch_by_id(batch_id)
        if not batch:
            raise NotFoundError("Lot d'importation introuvable.")
        batch.column_mapping = mapping
        await self.session.flush()
        return batch

    async def validate_batch_dry_run(self, batch_id: str) -> BatchValidationReport:
        batch = await self.repo.get_batch_by_id(batch_id)
        if not batch:
            raise NotFoundError("Lot d'importation introuvable.")

        raw_rows = [r.raw_data for r in sorted(batch.rows, key=lambda x: x.row_number)]
        mapping = batch.column_mapping or {}
        report = await self.validator.validate_rows(
            batch_id=batch.id,
            file_name=batch.file_name,
            rows=raw_rows,
            column_mapping=mapping,
        )

        batch.rows_valid = report.rows_valid
        batch.rows_warning = report.rows_warning
        batch.rows_error = report.rows_error
        batch.control_report = report.model_dump()

        row_map = {r.row_number: r for r in batch.rows}
        for det in report.details:
            r = row_map.get(det.row_number)
            if r:
                r.status = det.status
                r.messages = det.messages

        await self.session.flush()
        return report

    async def execute_import(self, batch_id: str) -> ImportBatch:
        batch = await self.repo.get_batch_by_id(batch_id)
        if not batch:
            raise NotFoundError("Lot d'importation introuvable.")

        report = await self.validate_batch_dry_run(batch_id)
        if report.rows_valid == 0:
            raise ValidationError("Le lot ne contient aucune ligne valide à importer.")

        row_map = {r.row_number: r for r in batch.rows}
        valid_details = [d for d in report.details if d.status in ("valid", "warning")]

        for det in valid_details:
            batch_row = row_map[det.row_number]
            mapped = self.validator._map_row(batch_row.raw_data, batch.column_mapping or {})
            await persist_imported_row(
                self.session, self.repo, self.nutrient_service, batch, mapped
            )

        batch.status = "to_review"
        await self.session.flush()
        return batch

    async def create_manual_food(self, user_id: str, payload: ManualFoodCreate) -> Food:
        return await create_manual_food_entry(
            self.session,
            self.repo,
            self.nutrient_service,
            self.validator,
            user_id,
            payload,
        )

    async def review_batch(
        self, batch_id: str, reviewer_user_id: str, decision: str
    ) -> ImportBatch:
        batch = await self.repo.get_batch_by_id(batch_id)
        if not batch:
            raise NotFoundError("Lot introuvable.")

        # Règle absolue : Le relecteur doit être une AUTRE personne que l'auteur.
        if reviewer_user_id == batch.created_by:
            raise ForbiddenError(
                "Le relecteur doit obligatoirement être une autre personne que l'auteur du lot."
            )

        if decision == "publish":
            batch.status = "published"
            batch.reviewed_by = reviewer_user_id
            for r in batch.rows:
                r.status = "published"

            await self.session.execute(
                update(FoodNutrientValue)
                .where(FoodNutrientValue.batch_id == batch.id)
                .values(reviewed_by=reviewer_user_id)
            )
            food_ids_stmt = (
                select(FoodNutrientValue.food_id)
                .where(FoodNutrientValue.batch_id == batch.id)
                .distinct()
            )
            food_ids = (await self.session.execute(food_ids_stmt)).scalars().all()
            if food_ids:
                await self.session.execute(
                    update(Food).where(Food.id.in_(food_ids)).values(status="published")
                )
        elif decision == "reject":
            batch.status = "rejected"
            batch.reviewed_by = reviewer_user_id
        else:
            raise ValidationError(f"Décision de relecture invalide : '{decision}'.")

        await self.session.flush()
        return batch

    async def create_food_correction(
        self, food_id: str, user_id: str, updated_name: str | None = None
    ) -> Food:
        existing = await self.repo.get_food_by_id(food_id)
        if not existing:
            raise NotFoundError("Aliment introuvable.")

        existing.is_current = False
        new_version = existing.version + 1
        root_id = existing.root_food_id or existing.id

        new_food = Food(
            name=updated_name or existing.name,
            kind=existing.kind,
            scientific_name=existing.scientific_name,
            category_id=existing.category_id,
            food_group_id=existing.food_group_id,
            state=existing.state,
            status="to_review",
            version=new_version,
            is_current=True,
            root_food_id=root_id,
            created_by=user_id,
        )
        self.session.add(new_food)
        await self.session.flush()
        return new_food
