"""Business logic service for custom_products module."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ValidationError
from tsotsa_api.modules.custom_products.schemas import CustomProductCreate, CustomProductReview
from tsotsa_api.modules.reference_products.schemas import ProductDetailRead, ProductSummaryRead
from tsotsa_api.modules.reference_products.service import ReferenceProductService


class CustomProductService:
    """Service orchestrating user-created custom products and admin verification."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.reference_service = ReferenceProductService(session)

    async def create_custom_product(
        self, user_id: str, payload: CustomProductCreate
    ) -> ProductDetailRead:
        """Create a custom product owned by user_id with status 'private'."""
        return await self.reference_service.create_custom_product_record(
            user_id=user_id,
            name=payload.name,
            base=payload.base,
            label_photo_file=payload.label_photo_file,
            nutrients=payload.nutrients,
        )

    async def review_custom_product(
        self, product_id: str, admin_user_id: str, payload: CustomProductReview
    ) -> ProductDetailRead:
        """Verify a custom product: publish, keep_private, or correct."""
        if payload.decision == "correct" and payload.name is None and payload.nutrients is None:
            raise ValidationError(
                "Une décision 'correct' requiert au moins un nom ou une composition corrigée."
            )
        return await self.reference_service.review_custom_product_record(
            product_id=product_id,
            admin_user_id=admin_user_id,
            decision=payload.decision,
            updated_name=payload.name,
            updated_nutrients=payload.nutrients,
        )

    async def list_admin_custom_products(self) -> list[ProductSummaryRead]:
        """List all custom products for administrative review."""
        return await self.reference_service.list_admin_products(product_type="custom")
