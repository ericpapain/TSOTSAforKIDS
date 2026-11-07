"""Domain E (Food database and import batches) module public interface."""

from tsotsa_api.modules.food_database.models import (
    Food,
    FoodCategory,
    FoodGroup,
    FoodName,
    FoodNutrientValue,
    FoodRegion,
    ImportBatch,
    ImportBatchRow,
    Region,
    Source,
)
from tsotsa_api.modules.food_database.repository import FoodDatabaseRepository
from tsotsa_api.modules.food_database.router import admin_router as food_admin_router
from tsotsa_api.modules.food_database.router import public_router as foods_router
from tsotsa_api.modules.food_database.schemas import (
    BatchValidationReport,
    FoodDetailRead,
    FoodSummaryRead,
    ImportBatchRead,
    ManualFoodCreate,
)
from tsotsa_api.modules.food_database.service import FoodDatabaseService

__all__ = [
    "BatchValidationReport",
    "Food",
    "FoodCategory",
    "FoodDatabaseRepository",
    "FoodDatabaseService",
    "FoodDetailRead",
    "FoodGroup",
    "FoodName",
    "FoodNutrientValue",
    "FoodRegion",
    "FoodSummaryRead",
    "ImportBatch",
    "ImportBatchRead",
    "ImportBatchRow",
    "ManualFoodCreate",
    "Region",
    "Source",
    "food_admin_router",
    "foods_router",
]
