"""Module for Domain I (Intakes, offline sync, compliance)."""

from tsotsa_api.modules.intakes.models import Intake
from tsotsa_api.modules.intakes.router import intakes_router
from tsotsa_api.modules.intakes.schemas import (
    ComplianceRateResponse,
    IntakeCreate,
    IntakeRead,
    IntakeSyncRequest,
    IntakeSyncResponse,
)
from tsotsa_api.modules.intakes.service import IntakesService

__all__ = [
    "ComplianceRateResponse",
    "Intake",
    "IntakeCreate",
    "IntakeRead",
    "IntakeSyncRequest",
    "IntakeSyncResponse",
    "IntakesService",
    "intakes_router",
]
