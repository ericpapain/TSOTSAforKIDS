"""FastAPI router stub for future optimization engine."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from tsotsa_api.modules.optimization.schemas import OptimizationRequest, OptimizationResponse

optimization_router = APIRouter(prefix="/optimization", tags=["Nutrition - Optimization (Futur)"])


@optimization_router.post(
    "/solve",
    response_model=OptimizationResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def solve_ration_optimization(payload: OptimizationRequest) -> OptimizationResponse:
    """Reserved endpoint for future LP/MIP optimization model. Always returns 501."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Le moteur d'optimisation mathématique (calcul automatique des quantités et rations) "
            "est réservé pour une version ultérieure."
        ),
    )
