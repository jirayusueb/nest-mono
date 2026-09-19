import type { UserId } from "../../../../shared/kernel/types/ids";
import type { MediaRecord } from "../dtos/media-dtos";

export function storedMedia(overrides: Partial<MediaRecord> = {}): MediaRecord {
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

export class MockMediaRepository {
  records: MediaRecord[] = [];
  confirmedKeys: string[] = [];

  async save(record: MediaRecord): Promise<void> {
    const existing = this.records.findIndex((r) => r.key === record.key);

    if (existing === -1) {
      this.records.push(record);
    } else {
      this.records[existing] = record;
    }
  }

  async findByKey(key: string): Promise<MediaRecord | null> {
    return this.records.find((r) => r.key === key) ?? null;
  }

  async listByUser(userId: UserId): Promise<MediaRecord[]> {
    return this.records.filter((r) => r.userId === userId);
  }

  async confirm(
    key: string,
    bytes: number,
    contentType: string,
  ): Promise<void> {
    this.confirmedKeys.push(key);
    const row = this.records.find((r) => r.key === key);

    if (row) {
      row.bytes = bytes;
      row.contentType = contentType;
      row.confirmed = true;
    }
  }

  async deleteByKey(key: string): Promise<void> {
    this.records = this.records.filter((r) => r.key !== key);
  }
}

export class MockBucketStore {
  deletedKeys: string[] = [];

  constructor(
    private readonly headResult: {
      bytes: number;
      contentType: string;
    } | null = {
      bytes: 2048,
      contentType: "image/png",
    },
  ) {}

  async presignPut(key: string): Promise<string> {
    return `http://s3/media/${key}?X-Amz-Signature=test-sig`;
  }

  async head(): Promise<{ bytes: number; contentType: string } | null> {
    return this.headResult;
  }

  async delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
  }

  publicUrl(key: string): string {
    return `http://s3/media/${key}`;
  }
}
