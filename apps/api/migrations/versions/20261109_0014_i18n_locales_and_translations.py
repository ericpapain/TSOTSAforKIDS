"""i18n: users.preferred_locale, food_translations, products.name_en, nutrients.name_en.

Revision ID: 20261109_0014_i18n_locales_and_translations
Revises: 20261106_0013_domain_a_admin_extensions
Create Date: 2026-11-09 22:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20261109_0014_i18n_locales_and_translations"
down_revision = "20261106_0013_domain_a_admin_extensions"
branch_labels = None
depends_on = None

CANONICAL_NUTRIENT_NAMES_EN: dict[str, str] = {
    "energy": "Energy",
    "protein": "Proteins",
    "fat": "Lipids",
    "carbohydrates": "Carbohydrates",
    "fiber": "Fiber",
    "water": "Water",
    "zinc": "Zinc",
    "magnesium": "Magnesium",
    "copper": "Copper",
    "iron": "Iron",
    "calcium": "Calcium",
    "sodium": "Sodium",
    "potassium": "Potassium",
    "phosphorus": "Phosphorus",
    "iodine": "Iodine",
    "selenium": "Selenium",
    "vitamin_a": "Vitamin A",
    "vitamin_d": "Vitamin D",
    "vitamin_e": "Vitamin E",
    "vitamin_k": "Vitamin K",
    "vitamin_c": "Vitamin C",
    "vitamin_b1": "Vitamin B1",
    "vitamin_b2": "Vitamin B2",
    "vitamin_b3": "Vitamin B3",
    "vitamin_b5": "Vitamin B5",
    "vitamin_b6": "Vitamin B6",
    "vitamin_b8": "Vitamin B8",
    "vitamin_b9": "Vitamin B9",
    "vitamin_b12": "Vitamin B12",
    "phytate": "Phytate",
}


def upgrade() -> None:
    uuid_type = sa.BINARY(16).with_variant(sa.String(36), "sqlite")
    locale_enum = sa.Enum("fr", "en", name="user_preferred_locale_enum")

    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "preferred_locale",
                locale_enum,
                nullable=False,
                server_default="fr",
            )
        )

    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(
            sa.Column("name_en", sa.String(200), nullable=True)
        )

    op.create_table(
        "food_translations",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column(
            "food_id",
            uuid_type,
            sa.ForeignKey("foods.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("locale", sa.String(10), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.UniqueConstraint("food_id", "locale", name="uq_food_translations_food_locale"),
    )
    op.create_index("ix_food_translations_food_id", "food_translations", ["food_id"])

    nutrients_table = sa.table(
        "nutrients",
        sa.column("code", sa.String(50)),
        sa.column("name_en", sa.String(150)),
    )
    for code, name_en in CANONICAL_NUTRIENT_NAMES_EN.items():
        op.execute(
            nutrients_table.update()
            .where(nutrients_table.c.code == code)
            .values(name_en=name_en)
        )


def downgrade() -> None:
    op.drop_index("ix_food_translations_food_id", table_name="food_translations")
    op.drop_table("food_translations")

    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_column("name_en")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("preferred_locale")

