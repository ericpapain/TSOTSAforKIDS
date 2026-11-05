.PHONY: all check check-quality check-api test-api check-web check-mobile e2e-web openapi up smoke

PYTHON ?= python

all: check

check: check-quality check-api check-web check-mobile e2e-web openapi

check-quality:
	$(PYTHON) scripts/check_file_length.py
	$(PYTHON) scripts/check_no_mock.py
	$(PYTHON) -m pytest scripts/tests -q

check-api:
	uv run --directory apps/api --extra dev ruff check src tests
	uv run --directory apps/api --extra dev mypy src --config-file pyproject.toml
	uv run --directory apps/api --extra dev pytest tests --cov=tsotsa_api --cov-report=term-missing --cov-fail-under=80

test-api:
	uv run --directory apps/api --extra dev pytest tests -v

check-web:
	@$(PYTHON) -c "import os, sys; sys.exit(0) if not os.path.isfile('apps/web/package.json') else os.system('pnpm --filter web check')"
	@echo apps/web : pas encore créé

check-mobile:
	@$(PYTHON) -c "import os, sys; sys.exit(0) if not os.path.isfile('apps/mobile/package.json') else os.system('pnpm --filter mobile check')"
	@echo apps/mobile : pas encore créé

e2e-web:
	@$(PYTHON) -c "import os, sys; sys.exit(0) if not os.path.isdir('apps/web/e2e') else os.system('pnpm --filter web test:e2e')"
	@echo e2e-web : pas encore créé

openapi:
	uv run --directory apps/api python -c "import json; from tsotsa_api.main import app; open('../../packages/api-client/openapi.json', 'w', encoding='utf-8').write(json.dumps(app.openapi(), indent=2) + '\n')"

up:
	docker compose up -d

smoke:
	@echo "Test smoke sur l'URL: $(URL)"
