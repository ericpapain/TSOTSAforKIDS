FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH="/app/apps/api/src:${PYTHONPATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

# Install dependencies first to maximize Docker layer cache
COPY apps/api/pyproject.toml apps/api/README.md apps/api/uv.lock* /app/apps/api/
WORKDIR /app/apps/api
RUN uv pip install --system -r pyproject.toml --extra dev

# Copy full application source and install project in editable mode
COPY apps/api /app/apps/api
RUN uv pip install --system --no-deps -e .

EXPOSE 8000

CMD ["uvicorn", "tsotsa_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
