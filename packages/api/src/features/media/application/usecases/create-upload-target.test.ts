import { describe, expect, it } from "bun:test";
import {
  MockDateProvider,
  MockIdGenerator,
} from "../../../../shared/application/testing/mocks";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { make } from "../../../../shared/kernel/types/brand";
import { CreateUploadTarget } from "./create-upload-target";
import { MockBucketStore, MockMediaRepository } from "../testing/mocks";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const USER_ID = make<UserId>("u1");

function setup() {
  const repo = new MockMediaRepository();
  const store = new MockBucketStore();

  const useCase = new CreateUploadTarget(
    repo,
    store,
    new MockIdGenerator(),
    new MockDateProvider(NOW),
  );

  return { repo, store, useCase };
}

describe("create upload target", () => {
  it("mints a pending row and a presigned URL", async () => {
    const { repo, useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      contentType: "image/png",
      bytes: 2048,
    });

    expect(result.isOk()).toBe(true);
    const dto = result.unwrap();
    expect(dto.key).toMatch(/^u1\/.+\.png$/);
    expect(dto.uploadUrl).toContain("X-Amz-Signature=test-sig");
    expect(dto.url).toBe(`http://s3/media/${dto.key}`);

    expect(repo.records).toHaveLength(1);
    expect(repo.records[0]?.confirmed).toBe(false);
    expect(repo.records[0]?.contentType).toBe("image/png");
  });

  it("rejects an oversize upload", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      contentType: "image/png",
      bytes: 10_485_761,
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
  });

  it("rejects a non-image content type", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      contentType: "video/mp4",
      bytes: 100,
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
  });
});
