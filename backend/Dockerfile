FROM docker.io/python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Set environment variables
ENV PYTHONPATH=/app

# Copy all files at once to avoid multiple network-dependent steps
COPY . /app/

# Use offline installation mode with the --no-index flag to avoid network
# First try to use any existing packages in the local environment
RUN python -m pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --no-deps -e .

# Copy application files
# Already copied everything above

CMD ["python", "-m", "app.main"]
