.PHONY: all check check-quality check-api test-api check-openapi check-client check-web check-mobile e2e-web openapi up smoke

PYTHON ?= python

all: check

check: check-quality check-api check-openapi check-client check-web check-mobile e2e-web

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

check-openapi:
	$(PYTHON) scripts/export_openapi.py --check

check-client:
	pnpm --filter @tsotsa/api-client check

check-web:
	pnpm --filter @tsotsa/web check

check-mobile:
	pnpm --filter @tsotsa/mobile check

e2e-web:
	@$(PYTHON) -c "import os, sys; sys.exit(0) if not os.path.isdir('apps/web/e2e') else sys.exit(os.system('pnpm --filter @tsotsa/web test:e2e'))"

openapi:
	$(PYTHON) scripts/export_openapi.py
	pnpm --filter @tsotsa/api-client generate

up:
	docker compose up -d

smoke:
	$(PYTHON) scripts/smoke_test.py $(URL)
