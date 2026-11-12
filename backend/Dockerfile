# syntax=docker/dockerfile:1

FROM debian:bookworm-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Copy backend source, CMake definition, and bundled third_party dependencies
COPY . .

# Configure Release build and compile only the production REST server target
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --config Release --target supermarket_server -j1


FROM debian:bookworm-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    libstdc++6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appuser \
    && useradd --system --gid appuser --home-dir /app --shell /usr/sbin/nologin appuser \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app

WORKDIR /app

COPY --from=builder --chown=appuser:appuser /src/build/supermarket_server /app/supermarket_server

USER appuser

ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/supermarket.db
ENV SESSION_DURATION_SECONDS=3600

EXPOSE 8080

CMD ["./supermarket_server"]
