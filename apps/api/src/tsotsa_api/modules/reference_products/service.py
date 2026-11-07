"""Business logic service for Domain F (Products) and Domain L (Audit Log)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from tsotsa_api.core.errors import ForbiddenError, NotFoundError, ValidationError
from tsotsa_api.modules.audit.service import AuditService
from tsotsa_api.modules.nutrients.service import NutrientService
from tsotsa_api.modules.reference_products.helpers import (
    build_essential_models,
    build_nutrient_models,
    normalize_base,
    normalize_ref_status,
    normalize_usage,
    to_product_detail,
    to_product_summary,
)
from tsotsa_api.modules.reference_products.models import Product
from tsotsa_api.modules.reference_products.repository import ProductsRepository
from tsotsa_api.modules.reference_products.schemas import (
    AuditLogRead,
    ProductDetailRead,
    ProductNutrientInput,
    ProductSummaryRead,
    ReferenceProductCreate,
    ReferenceProductUpdate,
)


class ReferenceProductService:
    """Service managing reference products, visibility rules, and audit trails."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProductsRepository(session)
        self.nutrient_service = NutrientService(session)
        self.audit = AuditService(session)

    async def create_reference_product(
        self, admin_user_id: str, payload: ReferenceProductCreate
    ) -> ProductDetailRead:
        if not payload.source_reference or not payload.source_reference.strip():
            raise ValidationError("Source obligatoire manquante pour un produit de référence.")

        base = normalize_base(payload.base)
        usage = normalize_usage(payload.usage)
        status = normalize_ref_status(payload.status)

        product = Product(
            type="reference",
            name=payload.name.strip(),
            base=base,
            usage=usage,
            status=status,
            source_reference=payload.source_reference.strip(),
            unit_label=payload.unit_label,
            created_by=admin_user_id,
            validated_by=admin_user_id if status == "validated" else None,
        )
        self.session.add(product)
        await self.session.flush()

        for nv in await build_nutrient_models(product.id, payload.nutrients, self.nutrient_service):
            self.session.add(nv)
        for en in await build_essential_models(
            product.id, payload.essential_nutrients, self.nutrient_service
        ):
            self.session.add(en)

        await self.audit.log(
            actor_user_id=admin_user_id,
            action="create",
            entity="reference_product",
            entity_id=product.id,
            details={"name": product.name, "status": status, "source": product.source_reference},
        )
        await self.session.flush()
        loaded = await self.repo.get_product_by_id(product.id)
        return to_product_detail(loaded or product)

    async def update_reference_product(
        self, product_id: str, admin_user_id: str, payload: ReferenceProductUpdate
    ) -> ProductDetailRead:
        product = await self.repo.get_product_by_id(product_id)
        if not product or product.type != "reference":
            raise NotFoundError("Produit de référence introuvable.")

        changes = self._apply_reference_field_updates(product, payload)
        await self._apply_reference_composition_updates(product, payload, changes)

        await self.audit.log(
            actor_user_id=admin_user_id,
            action="update",
            entity="reference_product",
            entity_id=product.id,
            details=changes,
        )
        await self.session.flush()
        loaded = await self.repo.get_product_by_id(product_id)
        return to_product_detail(loaded or product)

    def _apply_reference_field_updates(
        self, product: Product, payload: ReferenceProductUpdate
    ) -> dict[str, str]:
        changes: dict[str, str] = {}
        if payload.name is not None:
            product.name = payload.name.strip()
            changes["name"] = product.name
        if payload.base is not None:
            product.base = normalize_base(payload.base)
            changes["base"] = product.base
        if payload.usage is not None:
            product.usage = normalize_usage(payload.usage)
            changes["usage"] = product.usage
        if payload.source_reference is not None:
            if not payload.source_reference.strip():
                raise ValidationError("La source d'un produit de référence ne peut pas être vide.")
            product.source_reference = payload.source_reference.strip()
            changes["source_reference"] = product.source_reference
        if payload.unit_label is not None:
            product.unit_label = payload.unit_label
        if payload.status is not None:
            product.status = normalize_ref_status(payload.status)
            changes["status"] = product.status
        return changes

    async def _apply_reference_composition_updates(
        self, product: Product, payload: ReferenceProductUpdate, changes: dict[str, str]
    ) -> None:
        if payload.nutrients is not None:
            await self.repo.clear_product_nutrients(product.id)
            for nv in await build_nutrient_models(
                product.id, payload.nutrients, self.nutrient_service
            ):
                self.session.add(nv)
            changes["nutrients_updated"] = "true"

        if payload.essential_nutrients is not None:
            await self.repo.clear_product_essential_nutrients(product.id)
            for en in await build_essential_models(
                product.id, payload.essential_nutrients, self.nutrient_service
            ):
                self.session.add(en)
            changes["essentials_updated"] = "true"

    async def update_reference_product_status(
        self, product_id: str, admin_user_id: str, raw_status: str
    ) -> ProductDetailRead:
        product = await self.repo.get_product_by_id(product_id)
        if not product or product.type != "reference":
            raise NotFoundError("Produit de référence introuvable.")

        new_status = normalize_ref_status(raw_status)
        old_status = product.status
        product.status = new_status
        if new_status == "validated":
            product.validated_by = admin_user_id

        await self.audit.log(
            actor_user_id=admin_user_id,
            action="status_change",
            entity="reference_product",
            entity_id=product.id,
            details={"old_status": old_status, "new_status": new_status},
        )
        await self.session.flush()
        return to_product_detail(product)

    async def list_visible_products(self, user_id: str | None = None) -> list[ProductSummaryRead]:
        items = await self.repo.list_visible_products(user_id=user_id)
        return [to_product_summary(p) for p in items]

    async def list_admin_products(
        self, product_type: str | None = None
    ) -> list[ProductSummaryRead]:
        items = await self.repo.list_admin_products(product_type=product_type)
        return [to_product_summary(p) for p in items]

    async def get_product_detail(
        self, product_id: str, user_id: str | None = None, is_admin: bool = False
    ) -> ProductDetailRead:
        product = await self.repo.get_product_by_id(product_id)
        if not product:
            raise NotFoundError("Produit introuvable.")

        if product.type == "reference" and product.status != "validated" and not is_admin:
            raise ForbiddenError("Ce produit de référence n'est pas encore validé.")

        if (
            product.type == "custom"
            and product.status != "published"
            and not is_admin
            and product.owner_user_id != user_id
        ):
            raise ForbiddenError("Ce produit personnalisé est privé.")

        return to_product_detail(product)

    async def create_custom_product_record(
        self,
        user_id: str,
        name: str,
        base: str,
        label_photo_file: str | None,
        nutrients: list[ProductNutrientInput],
    ) -> ProductDetailRead:
        norm_base = normalize_base(base)
        product = Product(
            type="custom",
            name=name.strip(),
            base=norm_base,
            owner_user_id=user_id,
            status="private",
            label_photo_file=label_photo_file,
            created_by=user_id,
        )
        self.session.add(product)
        await self.session.flush()

        for nv in await build_nutrient_models(product.id, nutrients, self.nutrient_service):
            self.session.add(nv)

        await self.audit.log(
            actor_user_id=user_id,
            action="create",
            entity="custom_product",
            entity_id=product.id,
            details={"name": product.name, "status": "private"},
        )
        await self.session.flush()
        loaded = await self.repo.get_product_by_id(product.id)
        return to_product_detail(loaded or product)

    async def review_custom_product_record(
        self,
        product_id: str,
        admin_user_id: str,
        decision: str,
        updated_name: str | None = None,
        updated_nutrients: list[ProductNutrientInput] | None = None,
    ) -> ProductDetailRead:
        product = await self.repo.get_product_by_id(product_id)
        if not product or product.type != "custom":
            raise NotFoundError("Produit personnalisé introuvable.")

        if updated_name is not None:
            product.name = updated_name.strip()
        if updated_nutrients is not None:
            await self.repo.clear_product_nutrients(product.id)
            for nv in await build_nutrient_models(
                product.id, updated_nutrients, self.nutrient_service
            ):
                self.session.add(nv)

        if decision == "publish":
            product.status = "published"
            product.validated_by = admin_user_id
        elif decision == "keep_private":
            product.status = "private"
        elif decision == "correct":
            pass
        else:
            raise ValidationError(f"Décision invalide : '{decision}'.")

        await self.audit.log(
            actor_user_id=admin_user_id,
            action=f"review_{decision}",
            entity="custom_product",
            entity_id=product.id,
            details={"decision": decision, "status": product.status},
        )
        await self.session.flush()
        loaded = await self.repo.get_product_by_id(product_id)
        return to_product_detail(loaded or product)

    async def list_audit_logs(
        self, entity: str | None = None, entity_id: str | None = None
    ) -> list[AuditLogRead]:
        logs = await self.audit.list_logs(entity=entity, entity_id=entity_id)
        return [AuditLogRead.model_validate(entry) for entry in logs]
