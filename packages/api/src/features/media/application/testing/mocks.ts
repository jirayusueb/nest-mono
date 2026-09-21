import { createMock, type DeepMocked } from "@golevelup/ts-vitest";

import type { MediaRecord } from "~/features/media/application/dtos/media-dtos";
import type {
  BucketObjectHead,
  IBucketStore,
} from "~/features/media/application/ports/i-bucket-store";
import type { IMediaRepository } from "~/features/media/application/ports/i-media-repository";
import type { UserId } from "~/shared/kernel/types/ids";

interface StoredMediaOverrides {
  id?: string;
  userId?: UserId;
  key?: string;
  contentType?: string;
  bytes?: number;
  confirmed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export function storedMedia(overrides: StoredMediaOverrides = {}): MediaRecord {
  // SAFETY: fixture literals stand in for schema-issued ids.
  return {
    id: "m1",
    userId: "u1" as UserId,
    key: "u1/pic.png",
    contentType: "image/png",
    bytes: 1000,
    confirmed: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export interface MockMediaRepo {
  repo: DeepMocked<IMediaRepository>;
  records: MediaRecord[];
}

export function mockMediaRepository(seed: MediaRecord[] = []): MockMediaRepo {
  const records = [...seed];

  const repo = createMock<IMediaRepository>({
    save: async (record) => {
      const index = records.findIndex((r) => r.key === record.key);

      if (index === -1) {
        records.push(record);
      } else {
        records[index] = record;
      }
    },
    findByKey: async (key) => records.find((r) => r.key === key) ?? null,
    listConfirmedByUser: async (userId) =>
      records.filter((r) => r.userId === userId && r.confirmed),
    confirm: async (key, bytes, contentType) => {
      const row = records.find((r) => r.key === key);

      if (row) {
        row.bytes = bytes;
        row.contentType = contentType;
        row.confirmed = true;
      }
    },
    deleteByKey: async (key) => {
      const index = records.findIndex((r) => r.key === key);

      if (index !== -1) {
        records.splice(index, 1);
      }
    },
  });

  return { repo, records };
}

export function mockBucketStore(
  objectHead: BucketObjectHead | null = {
    bytes: 2048,
    contentType: "image/png",
  },
): DeepMocked<IBucketStore> {
  return createMock<IBucketStore>({
    presignPut: async (key) =>
      `http://s3/media/${key}?X-Amz-Signature=test-sig`,
    head: async () => objectHead,
    publicUrl: (key) => `http://s3/media/${key}`,
  });
}
