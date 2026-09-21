import { describe, expect, it } from "vitest";

import {
  mockBucketStore,
  mockMediaRepository,
  storedMedia,
} from "~/features/media/application/testing/mocks";
import { make } from "~/shared/kernel/types/brand";
import type { UserId } from "~/shared/kernel/types/ids";

import { DeleteMediaUseCase } from "./delete-media";

const OWNER = make<UserId>("u1");

const OTHER_USER = make<UserId>("u2");

function setup() {
  const { repo, records } = mockMediaRepository();

  const store = mockBucketStore();

  return {
    repo,
    records,
    store,
    deleteMedia: new DeleteMediaUseCase(repo, store),
  };
}

describe("delete media", () => {
  it("rejects a key owned by another user and deletes nothing", async () => {
    const { records, store, deleteMedia } = setup();
    records.push(storedMedia({ userId: OTHER_USER, key: "u2/pic.png" }));

    const result = await deleteMedia.execute({
      key: "u2/pic.png",
      userId: OWNER,
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("NotFound");
    expect(records.map((r) => r.key)).toEqual(["u2/pic.png"]);
    expect(store.delete).not.toHaveBeenCalled();
  });

  it("deletes the owner's record and object", async () => {
    const { records, store, deleteMedia } = setup();
    records.push(storedMedia({ key: "u1/pic.png" }));

    const result = await deleteMedia.execute({
      key: "u1/pic.png",
      userId: OWNER,
    });

    expect(result.isOk()).toBe(true);
    expect(records).toEqual([]);
    expect(store.delete).toHaveBeenCalledWith("u1/pic.png");
  });
});
