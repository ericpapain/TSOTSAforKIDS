"""Pydantic schemas for Domain C (Persons, Family Links, and Care Access)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

RelationType = Literal["self", "child", "relative"]
SexType = Literal["M", "F"]


class PersonCreate(BaseModel):
    """Payload to register a new family member."""

    first_name: str = Field(..., min_length=1, max_length=120)
    birth_date: date
    sex: SexType
    region_id: str | None = None
    relation: RelationType = "child"


class PersonUpdate(BaseModel):
    """Payload to update an existing family member."""

    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    birth_date: date | None = None
    sex: SexType | None = None
    region_id: str | None = None


class PersonRead(BaseModel):
    """Representation of a followed person for a family member account."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    pseudonym: str
    first_name: str
    birth_date: date
    sex: SexType
    region_id: str | None = None
    relation: str | None = None
    is_primary: bool | None = None
    created_at: datetime


class SecondParentInviteRequest(BaseModel):
    """Payload to invite a second parent or guardian to share access."""

    phone_or_email: str = Field(..., min_length=3, max_length=255)
    relation: RelationType = "child"


class SecondParentInviteResponse(BaseModel):
    """Response containing invitation token for second parent."""

    invitation_id: str
    token: str
    expires_at: datetime
    phone_or_email: str


class AcceptInvitationRequest(BaseModel):
    """Payload to accept an invitation to link a followed person."""

    token: str = Field(..., min_length=8)


class CareAttachmentRequest(BaseModel):
    """Payload to attach a followed person to a health organization."""

    organization_id: str
    primary_caregiver_id: str | None = None


class CaregiverPersonRead(BaseModel):
    """Representation of a followed person seen by medical caregiver."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    pseudonym: str
    first_name: str
    birth_date: date
    sex: SexType
    region_id: str | None = None
    organization_id: str
    primary_caregiver_id: str | None = None
    care_started_at: datetime
    created_at: datetime | None = None
    has_active_consent: bool = True
