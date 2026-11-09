FROM python:3.12-slim

# Create unprivileged application user
RUN groupadd -g 1001 tsotsa && \
    useradd -u 1001 -g tsotsa -s /bin/bash -m tsotsa

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/apps/api/src

# Install minimal system dependencies (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

# Pre-install dependencies to maximize Docker layer cache
COPY apps/api/pyproject.toml apps/api/README.md apps/api/uv.lock* /app/apps/api/
WORKDIR /app/apps/api
RUN uv pip install --system -r pyproject.toml

# Copy API codebase and install in non-editable mode
COPY apps/api /app/apps/api
RUN uv pip install --system --no-deps .

RUN chown -R tsotsa:tsotsa /app

USER tsotsa

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 --start-period=5s \
  CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["uvicorn", "tsotsa_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

