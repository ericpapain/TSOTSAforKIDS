FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

COPY apps/api/pyproject.toml /app/apps/api/
WORKDIR /app/apps/api
RUN uv pip install --system -e ".[dev]"

COPY apps/api /app/apps/api

EXPOSE 8000

CMD ["uvicorn", "tsotsa_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
