"""Persons module (Domain C)."""

from tsotsa_api.modules.persons.models import (
    Person,
    PersonCare,
    PersonInvitation,
    PersonLink,
)
from tsotsa_api.modules.persons.router import caregiver_persons_router, family_router
from tsotsa_api.modules.persons.service import PersonsService
from tsotsa_api.modules.persons.validation_router import patient_validation_router

__all__ = [
    "Person",
    "PersonCare",
    "PersonInvitation",
    "PersonLink",
    "PersonsService",
    "caregiver_persons_router",
    "family_router",
    "patient_validation_router",
]
