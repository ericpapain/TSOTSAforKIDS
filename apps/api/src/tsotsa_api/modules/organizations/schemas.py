"""Pydantic schemas for Domain B (Organizations, Regions) and Caregiver Isolation."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OrganizationType = Literal["hopital", "cma", "centre_de_sante", "ong"]
OrganizationStatus = Literal["active", "inactive"]
SexType = Literal["M", "F"]


class RegionCreate(BaseModel):
    """Payload for administration to create a geographical region."""

    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    country_code: str = Field(default="CMR", min_length=2, max_length=10)


class RegionUpdate(BaseModel):
    """Payload for administration to update a geographical region."""

    code: str | None = Field(default=None, min_length=2, max_length=50)
    name: str | None = Field(default=None, min_length=2, max_length=100)
    country_code: str | None = Field(default=None, min_length=2, max_length=10)


class RegionRead(BaseModel):
    """Representation of a geographical region."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    country_code: str


class UserRegionPreferenceUpdate(BaseModel):
    """Payload to update the authenticated user's preferred region."""

    region_id: str | None = None


class UserRegionPreferenceRead(BaseModel):
    """Representation of the user's preferred region."""

    user_id: str
    preferred_region_id: str | None = None
    region: RegionRead | None = None


class OrganizationCreate(BaseModel):
    """Payload for administration to register a health establishment."""

    name: str = Field(..., min_length=2, max_length=200)
    type: OrganizationType
    region_id: str | None = None
    address: str | None = Field(default=None, max_length=255)
    status: OrganizationStatus = "active"


class OrganizationUpdate(BaseModel):
    """Payload for administration to update a health establishment."""

    name: str | None = Field(default=None, min_length=2, max_length=200)
    type: OrganizationType | None = None
    region_id: str | None = None
    address: str | None = Field(default=None, max_length=255)
    status: OrganizationStatus | None = None


class OrganizationRead(BaseModel):
    """Representation of a health establishment."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: OrganizationType
    region_id: str | None = None
    address: str | None = None
    status: OrganizationStatus
    created_at: datetime


class CaregiverAttachmentRequest(BaseModel):
    """Payload to attach a caregiver account to an organization."""

    user_id: str
    licence_number: str | None = Field(default=None, max_length=100)
    approve: bool = True


class CaregiverAttachmentRead(BaseModel):
    """Result of attaching a caregiver to an organization."""

    user_id: str
    organization_id: str
    licence_number: str | None = None
    verification_status: str


class PersonInCareCreate(BaseModel):
    """Payload to register a followed person within a health establishment."""

    pseudonym: str = Field(..., min_length=2, max_length=30, pattern=r"^#[A-Z0-9\-]+$")
    first_name: str = Field(..., min_length=1, max_length=120)
    birth_date: date
    sex: SexType
    region_id: str | None = None


class PersonInCareRead(BaseModel):
    """Representation of a followed person visible within an establishment."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    pseudonym: str
    first_name: str
    birth_date: date
    sex: SexType
    region_id: str | None = None
    organization_id: str
    created_at: datetime
