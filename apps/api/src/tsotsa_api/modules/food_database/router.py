"""FastAPI router for Domain E (Food database and administrative ingestion)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.database import get_db_session
from tsotsa_api.core.pagination import PaginatedResponse, PaginationParams
from tsotsa_api.modules.food_database.models import Food
from tsotsa_api.modules.food_database.repository import FoodDatabaseRepository
from tsotsa_api.modules.food_database.schemas import (
    BatchReviewDecision,
    BatchValidationReport,
    ColumnMappingUpdate,
    FoodDetailRead,
    FoodNameRead,
    FoodNutrientValueRead,
    FoodRegionRead,
    FoodSummaryRead,
    ImportBatchRead,
    ManualFoodCreate,
    SourceRead,
)
from tsotsa_api.modules.food_database.service import FoodDatabaseService
from tsotsa_api.modules.identity import require_role

admin_router = APIRouter(prefix="/admin", tags=["Admin - Food Imports"])
public_router = APIRouter(prefix="/foods", tags=["Foods"])


@admin_router.post(
    "/food-imports", response_model=ImportBatchRead, status_code=status.HTTP_201_CREATED
)
async def upload_food_import_file(
    file: UploadFile = File(...),
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ImportBatchRead:
    """Upload a CSV or Excel file for ingestion into the food database."""
    content = await file.read()
    service = FoodDatabaseService(db)
    batch = await service.create_import_batch_from_file(
        user_id=admin.id,
        file_name=file.filename or "upload.csv",
        file_bytes=content,
    )
    return ImportBatchRead.model_validate(batch)


@admin_router.get("/food-imports/template")
async def download_import_template(
    _: Any = Depends(require_role("admin")),
) -> FileResponse:
    """Download the official empty XLSX food ingestion template."""
    candidates = [
        Path("data/gabarit_base_aliments.xlsx"),
        Path("../../data/gabarit_base_aliments.xlsx"),
        Path(__file__).parents[5] / "data" / "gabarit_base_aliments.xlsx",
    ]
    for c in candidates:
        if c.exists():
            return FileResponse(
                c.resolve(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename="gabarit_base_aliments.xlsx",
            )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Gabarit de saisie introuvable sur le serveur.",
    )


@admin_router.put("/food-imports/{batch_id}/mapping", response_model=ImportBatchRead)
async def update_column_mapping(
    batch_id: str,
    payload: ColumnMappingUpdate,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ImportBatchRead:
    """Update column mapping for a batch."""
    service = FoodDatabaseService(db)
    batch = await service.update_column_mapping(batch_id, payload.mapping)
    return ImportBatchRead.model_validate(batch)


@admin_router.post("/food-imports/{batch_id}/validate", response_model=BatchValidationReport)
async def validate_batch_dry_run(
    batch_id: str,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> BatchValidationReport:
    """Dry-run quality check without inserting data."""
    service = FoodDatabaseService(db)
    return await service.validate_batch_dry_run(batch_id)


@admin_router.post("/food-imports/{batch_id}/execute", response_model=ImportBatchRead)
async def execute_batch_import(
    batch_id: str,
    _: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ImportBatchRead:
    """Import valid rows into food database with status 'to_review'."""
    service = FoodDatabaseService(db)
    batch = await service.execute_import(batch_id)
    return ImportBatchRead.model_validate(batch)


@admin_router.post("/food-imports/{batch_id}/review", response_model=ImportBatchRead)
async def review_import_batch(
    batch_id: str,
    decision: BatchReviewDecision,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> ImportBatchRead:
    """Review and approve or reject an import batch (reviewer must differ from creator)."""
    service = FoodDatabaseService(db)
    batch = await service.review_batch(batch_id, admin.id, decision.decision)
    return ImportBatchRead.model_validate(batch)


@admin_router.post("/foods", response_model=FoodSummaryRead, status_code=status.HTTP_201_CREATED)
async def create_manual_food(
    payload: ManualFoodCreate,
    admin: Any = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db_session),
) -> FoodSummaryRead:
    """Manually enter food item and composition through identical quality controls."""
    service = FoodDatabaseService(db)
    food = await service.create_manual_food(admin.id, payload)
    return FoodSummaryRead(
        id=food.id,
        name=food.name,
        kind=food.kind,
        category=payload.category,
        state=food.state,
        status=food.status,
        version=food.version,
    )


@public_router.get("", response_model=PaginatedResponse[FoodSummaryRead])
async def search_published_foods(
    q: str | None = Query(None, description="Recherche textuelle sur le nom"),
    category: str | None = Query(None, description="Code catégorie"),
    region: str | None = Query(None, description="Code région"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db_session),
) -> PaginatedResponse[FoodSummaryRead]:
    """Retrieve published food catalog with pagination and filters."""
    repo = FoodDatabaseRepository(db)
    foods = await repo.search_foods(
        query=q,
        category_code=category,
        region_code=region,
        offset=pagination.offset,
        limit=pagination.limit,
        only_published=True,
    )
    total = await repo.count_foods(
        query=q,
        category_code=category,
        region_code=region,
        only_published=True,
    )
    items = [
        FoodSummaryRead(
            id=f.id,
            name=f.name,
            kind=f.kind,
            category=f.category.name if f.category else None,
            state=f.state,
            status=f.status,
            version=f.version,
        )
        for f in foods
    ]
    return PaginatedResponse.create(items=items, total=total, params=pagination)


@public_router.get("/{food_id}", response_model=FoodDetailRead)
async def get_published_food_detail(
    food_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> FoodDetailRead:
    """Retrieve full details of a published food item."""
    repo = FoodDatabaseRepository(db)
    food = await repo.get_food_by_id(food_id)
    if not food or food.status != "published" or not food.is_current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aliment publié introuvable.",
        )

    return _build_food_detail(food)


def _build_food_detail(food: Food) -> FoodDetailRead:
    return FoodDetailRead(
        id=food.id,
        name=food.name,
        kind=food.kind,
        scientific_name=food.scientific_name,
        category=food.category.name if food.category else None,
        food_group=food.food_group.name if food.food_group else None,
        state=food.state,
        status=food.status,
        version=food.version,
        is_current=food.is_current,
        created_at=food.created_at,
        local_names=[
            FoodNameRead(language_or_dialect=n.language_or_dialect, name=n.name) for n in food.names
        ],
        regions=[
            FoodRegionRead(
                region_code=r.region.code,
                region_name=r.region.name,
                availability=r.availability,
                season_months=r.season_months,
            )
            for r in food.regions
        ],
        nutrients=[
            FoodNutrientValueRead(
                id=nv.id,
                nutrient_code="nutrient",
                nutrient_name="Nutriment",
                value_per_100g=nv.value_per_100g,
                unit="unit",
                basis=nv.basis,
                sample_label=nv.sample_label,
                is_estimated=nv.is_estimated,
                source=SourceRead.model_validate(nv.source) if nv.source else None,
            )
            for nv in food.nutrient_values
            if nv.is_current
        ],
    )
