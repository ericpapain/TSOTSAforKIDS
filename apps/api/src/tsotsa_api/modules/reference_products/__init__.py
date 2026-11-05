"""Reference products module public interface."""

from tsotsa_api.modules.reference_products.router import (
    admin_router as reference_products_admin_router,
)
from tsotsa_api.modules.reference_products.router import public_router as products_router
from tsotsa_api.modules.reference_products.service import ReferenceProductService

__all__ = [
    "ReferenceProductService",
    "products_router",
    "reference_products_admin_router",
]
