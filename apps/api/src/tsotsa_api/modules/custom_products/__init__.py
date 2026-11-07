"""Custom products module public interface."""

from tsotsa_api.modules.custom_products.router import (
    admin_router as custom_products_admin_router,
)
from tsotsa_api.modules.custom_products.router import user_router as custom_products_router
from tsotsa_api.modules.custom_products.service import CustomProductService

__all__ = [
    "CustomProductService",
    "custom_products_admin_router",
    "custom_products_router",
]
