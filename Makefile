.PHONY: all check check-quality check-api check-web check-mobile e2e-web openapi smoke

PYTHON ?= python

all: check

check: check-quality check-api check-web check-mobile e2e-web openapi

check-quality:
	$(PYTHON) scripts/check_file_length.py
	$(PYTHON) scripts/check_no_mock.py
	$(PYTHON) -m pytest scripts/tests -q

check-api:
	@$(PYTHON) -c "import os, sys; sys.exit(0) if not os.path.isfile('apps/api/pyproject.toml') else os.system('make -C apps/api check')"
	@echo apps/api : pas encore créé

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
	@$(PYTHON) -c "import os, sys; sys.exit(0) if not os.path.isfile('apps/api/pyproject.toml') else os.system('make -C apps/api openapi')"
	@echo openapi : pas encore créé

smoke:
	@echo "Test smoke sur l'URL: $(URL)"
