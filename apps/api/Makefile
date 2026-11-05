.PHONY: all check test lint typecheck openapi

PYTHON ?= python

all: check

check: lint typecheck test

lint:
	$(PYTHON) -m ruff check src tests

typecheck:
	$(PYTHON) -m mypy src

test:
	$(PYTHON) -m pytest tests --cov=tsotsa_api --cov-report=term-missing --cov-fail-under=80

openapi:
	$(PYTHON) -c "import json; from tsotsa_api.main import app; open('../../packages/api-client/openapi.json', 'w', encoding='utf-8').write(json.dumps(app.openapi(), indent=2) + '\n')"
