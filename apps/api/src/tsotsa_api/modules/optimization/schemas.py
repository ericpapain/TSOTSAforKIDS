"""Input and output contract schemas for the future mathematical optimization engine."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class OptimizationConstraintInput(BaseModel):
    """Nutrient constraints for linear/mixed-integer optimization."""

    nutrient_code: str
    target_value: Decimal = Field(description="Target quantity in reference unit")
    min_value: Decimal | None = None
    max_value: Decimal | None = None


class OptimizationRequest(BaseModel):
    """Contract input for diet / ration quantity optimization."""

    target_product_id: str
    portion_target_grams: Decimal = Field(default=Decimal("100.0"))
    region: str | None = None
    max_cost_fcfa: Decimal | None = None
    allowed_food_ids: list[str] = Field(default_factory=list)
    nutrient_constraints: list[OptimizationConstraintInput] = Field(default_factory=list)


class FoodPortionOutput(BaseModel):
    """Calculated portion for an optimal food component."""

    food_id: str
    food_name: str
    portion_grams: Decimal
    cost_fcfa: Decimal | None = None


class OptimizationResponse(BaseModel):
    """Contract output for mathematical optimization results."""

    status: str = Field(description="Solver status: optimal, infeasible, etc.")
    total_grams: Decimal
    total_cost_fcfa: Decimal | None = None
    portions: list[FoodPortionOutput]
    nutritional_achievement: dict[str, Decimal]
