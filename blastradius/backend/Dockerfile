FROM python:3.11-slim

WORKDIR /app

# Install git and curl for repository cloning and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8090
ENV FALKORDB_HOST=localhost
ENV FALKORDB_PORT=6379

EXPOSE 8090

CMD ["sh", "-c", "uvicorn api_server:app --host 0.0.0.0 --port ${PORT:-8090}"]
