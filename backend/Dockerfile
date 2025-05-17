FROM docker.io/python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Set environment variables
=======
# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Copy dependency files first
COPY ./pyproject.toml ./uv.lock /app/

# Install dependencies
# Using a more compatible approach without buildx cache mounts
RUN uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

# Copy all files at once to avoid multiple network-dependent steps
COPY . /app/

# Use offline installation mode with the --no-index flag to avoid network
# First try to use any existing packages in the local environment
RUN python -m pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --no-deps -e .

# Copy application files
# Already copied everything above
=======
# Sync the project
RUN uv sync

CMD ["python", "-m", "app.main"]
