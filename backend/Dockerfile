# PocketBase backend — single binary, SQLite-backed, with auto-applied migrations.
FROM alpine:3.20

ARG PB_VERSION=0.39.4
RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /pb

# Download the right PocketBase build for the image architecture.
RUN ARCH="$(uname -m)"; \
    case "$ARCH" in \
      x86_64)         PB_ARCH=amd64 ;; \
      aarch64|arm64)  PB_ARCH=arm64 ;; \
      armv7l)         PB_ARCH=armv7 ;; \
      *)              PB_ARCH=amd64 ;; \
    esac; \
    wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY docker-entrypoint.sh /pb/docker-entrypoint.sh
RUN chmod +x /pb/docker-entrypoint.sh /pb/pocketbase

EXPOSE 8090
ENTRYPOINT ["/pb/docker-entrypoint.sh"]
