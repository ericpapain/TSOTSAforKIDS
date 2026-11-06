"""Organizations and Regions module (Domain B & Domain C isolation)."""

from tsotsa_api.modules.organizations.models import Organization, Person, PersonCare
from tsotsa_api.modules.organizations.router import (
    admin_router,
    organizations_router,
    regions_router,
    users_region_router,
)
from tsotsa_api.modules.organizations.service import OrganizationsService

__all__ = [
    "Organization",
    "OrganizationsService",
    "Person",
    "PersonCare",
    "admin_router",
    "organizations_router",
    "regions_router",
    "users_region_router",
]
