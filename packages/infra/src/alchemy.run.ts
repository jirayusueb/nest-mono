import * as Alchemy from "alchemy";
import * as Docker from "alchemy/Docker";
import * as Effect from "effect/Effect";

const POSTGRES_IMAGE = "postgres:18-alpine";

const RUSTFS_IMAGE = "rustfs/rustfs:latest";

export default Alchemy.Stack(
  "NestMono",
  {
    providers: Docker.providers(),
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const network = yield* Docker.Network("app-network", {
      name: "nest-mono-network",
    });

    const postgresData = yield* Docker.Volume("postgres-data", {
      name: "nest-mono-pgdata",
    }).pipe(Alchemy.RemovalPolicy.retain());

    const rustfsData = yield* Docker.Volume("rustfs-data", {
      name: "nest-mono-fsdata",
    }).pipe(Alchemy.RemovalPolicy.retain());

    const postgres = yield* Docker.Container("postgres", {
      name: "nest-mono-postgres",
      image: POSTGRES_IMAGE,
      environment: {
        POSTGRES_DB: "nest_mono",
        POSTGRES_USER: "app",
        POSTGRES_PASSWORD: "app",
      },
      ports: [{ external: 5432, internal: 5432 }],
      volumes: [
        { hostPath: postgresData.name, containerPath: "/var/lib/postgresql" },
      ],
      networks: [{ name: network.name, aliases: ["postgres"] }],
      healthcheck: {
        cmd: "pg_isready -U app -d nest_mono",
        interval: "5 seconds",
        timeout: "5 seconds",
        retries: 10,
      },
      restart: "unless-stopped",
      start: true,
    });

    const rustfs = yield* Docker.Container("rustfs", {
      name: "nest-mono-rustfs",
      image: RUSTFS_IMAGE,
      environment: {
        RUSTFS_ACCESS_KEY: "nest-mono",
        RUSTFS_SECRET_KEY: "nest-mono-secret",
        RUSTFS_CORS_ALLOWED_ORIGINS: "http://localhost:5173",
        RUSTFS_ADDRESS: ":9000",
        RUSTFS_CONSOLE_ADDRESS: ":9001",
        RUSTFS_CONSOLE_ENABLE: "true",
      },
      ports: [
        { external: 9000, internal: 9000 },
        { external: 9001, internal: 9001 },
      ],
      volumes: [{ hostPath: rustfsData.name, containerPath: "/data" }],
      networks: [{ name: network.name, aliases: ["rustfs"] }],
      restart: "unless-stopped",
      start: true,
    });

    if (process.env.DEPLOY_APPS !== "true") {
      return { postgres: postgres.name, rustfs: rustfs.name };
    }

    const serverImage = yield* Docker.Image("server-image", {
      name: "nest-mono-server",
      tag: "local",
      build: {
        context: "../..",
        dockerfile: "apps/server/Dockerfile",
      },
    });

    const server = yield* Docker.Container("server", {
      name: "nest-mono-server",
      image: serverImage,
      environment: {
        DATABASE_URL: "postgres://app:app@postgres:5432/nest_mono",
        PORT: "3000",
        WEB_ORIGIN: "http://localhost:5173",
        S3_ENDPOINT: "http://rustfs:9000",
        S3_REGION: "us-east-1",
        S3_BUCKET: "media",
        S3_ACCESS_KEY_ID: "nest-mono",
        S3_SECRET_ACCESS_KEY: "nest-mono-secret",
      },
      ports: [{ external: 13000, internal: 3000 }],
      networks: [{ name: network.name, aliases: ["server"] }],
      restart: "on-failure",
      start: true,
    });

    return {
      postgres: postgres.name,
      rustfs: rustfs.name,
      server: server.name,
    };
  }),
);
