import os

files_to_update = [
    # Web
    "apps/web/index.html",
    "apps/web/src/components/BrandLogo.tsx",
    "apps/web/src/components/__tests__/BrandLogo.test.tsx",
    
    # Mobile
    "apps/mobile/app.json",
    "apps/mobile/src/components/BrandLogo.tsx",
    "apps/mobile/app/u-google.tsx",
    "apps/mobile/src/features/auth/__tests__/GoogleScreen.test.tsx",
    
    # i18n
    "packages/i18n/locales/fr/admin.json",
    "packages/i18n/locales/fr/auth.json",
    "packages/i18n/locales/fr/caregiver.json",
    "packages/i18n/locales/fr/common.json",
    "packages/i18n/locales/fr/mobile.json",
    "packages/i18n/locales/fr/notifications.json",
    "packages/i18n/locales/fr/nutrition.json",
    "packages/i18n/locales/en/admin.json",
    "packages/i18n/locales/en/auth.json",
    "packages/i18n/locales/en/caregiver.json",
    "packages/i18n/locales/en/common.json",
    "packages/i18n/locales/en/mobile.json",
    "packages/i18n/locales/en/notifications.json",
    "packages/i18n/locales/en/nutrition.json",

    # API
    "apps/api/src/tsotsa_api/main.py",
    "apps/api/src/tsotsa_api/core/config.py",
    "apps/api/src/tsotsa_api/i18n/templates/fr/emails.json",
    "apps/api/src/tsotsa_api/i18n/templates/fr/sms.json",
    "apps/api/src/tsotsa_api/i18n/templates/en/emails.json",
    "apps/api/src/tsotsa_api/i18n/templates/en/sms.json",
]

for rel_path in files_to_update:
    if not os.path.exists(rel_path):
        print(f"Skipping {rel_path} (does not exist)")
        continue
    with open(rel_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content.replace("TSOTSA4Kids", "TSOTSA for Kids")
    if rel_path.endswith("BrandLogo.tsx") or rel_path.endswith("BrandLogo.test.tsx"):
        new_content = new_content.replace(">KIDS<", ">4KIDS<").replace("('KIDS')", "('4KIDS')").replace('("KIDS")', '("4KIDS")').replace('"KIDS"', '"4KIDS"')

    if content != new_content:
        with open(rel_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {rel_path}")
    else:
        print(f"No changes in {rel_path}")

