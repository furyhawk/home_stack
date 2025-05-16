FROM docker.io/python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Copy requirements
COPY ./pyproject.toml /app/

# Install dependencies using pip instead of uv to avoid networking issues
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

ENV PYTHONPATH=/app

COPY ./scripts /app/scripts
COPY ./alembic.ini /app/
COPY ./app /app/app

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]
