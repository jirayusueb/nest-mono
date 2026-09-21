import { describe, expect, it } from "vitest";

import {
  mockBucketStore,
  mockMediaRepository,
} from "~/features/media/application/testing/mocks";
import {
  mockDateProvider,
  mockIdGenerator,
} from "~/shared/application/testing/mocks";
import { make } from "~/shared/kernel/types/brand";
import type { UserId } from "~/shared/kernel/types/ids";

import { CreateUploadTargetUseCase } from "./create-upload-target";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const USER_ID = make<UserId>("u1");

function setup() {
  const { repo, records } = mockMediaRepository();

  const store = mockBucketStore();

  const useCase = new CreateUploadTargetUseCase(
    repo,
    store,
    mockIdGenerator(),
    mockDateProvider(NOW),
  );

  return { records, store, useCase };
}

describe("create upload target", () => {
  it("mints a pending row and a presigned URL", async () => {
    const { records, useCase } = setup();

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

    expect(records).toHaveLength(1);
    expect(records[0]?.confirmed).toBe(false);
    expect(records[0]?.contentType).toBe("image/png");
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
