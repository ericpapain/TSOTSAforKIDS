"""Consents module (Domain C)."""

from tsotsa_api.modules.consents.models import Consent, ConsentText
from tsotsa_api.modules.consents.router import (
    admin_consents_router,
    consents_router,
    person_consents_router,
)
from tsotsa_api.modules.consents.service import ConsentsService

__all__ = [
    "Consent",
    "ConsentText",
    "ConsentsService",
    "admin_consents_router",
    "consents_router",
    "person_consents_router",
]
