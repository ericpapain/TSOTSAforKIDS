"""Nutrition equivalence module (Domain E ranking engine)."""

from tsotsa_api.modules.equivalence.router import equivalence_router
from tsotsa_api.modules.equivalence.service import EquivalenceService

__all__ = ["EquivalenceService", "equivalence_router"]
