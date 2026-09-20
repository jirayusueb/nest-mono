import { describe, expect, it } from "vitest";
import { ConfirmMediaUseCase } from "./confirm-media";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { make } from "../../../../shared/kernel/types/brand";
import { ListMediaUseCase } from "./list-media";
import { MAX_UPLOAD_BYTES } from "../../domain/rules/media-rules";
import {
  mockBucketStore,
  mockMediaRepository,
  storedMedia,
} from "../testing/mocks";

const OWNER = make<UserId>("u1");

const OTHER_USER = make<UserId>("u2");

function setup(headResult: { bytes: number; contentType: string } | null) {
  const { repo, records } = mockMediaRepository();

  const store = mockBucketStore(headResult);

  return {
    repo,
    records,
    store,
    confirm: new ConfirmMediaUseCase(repo, store),
    list: new ListMediaUseCase(repo, store),
  };
}

describe("confirm media", () => {
  it("rejects when the object never landed", async () => {
    const { records, confirm } = setup(null);

    records.push(storedMedia({ confirmed: false }));

    const result = await confirm.execute({ key: "u1/pic.png", userId: OWNER });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("NotFound");
  });

  it("rejects a key owned by another user without confirming it", async () => {
    const { repo, records, confirm } = setup({
      bytes: 2048,
      contentType: "image/png",
    });

    records.push(
      storedMedia({ userId: OTHER_USER, key: "u2/pic.png", confirmed: false }),
    );

    const result = await confirm.execute({ key: "u2/pic.png", userId: OWNER });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("NotFound");
    expect(repo.confirm).not.toHaveBeenCalled();
    expect(records[0]?.confirmed).toBe(false);
  });

  it("rejects an oversize object", async () => {
    const { repo, records, confirm } = setup({
      bytes: MAX_UPLOAD_BYTES + 1,
      contentType: "image/png",
    });

    records.push(storedMedia({ confirmed: false }));

    const result = await confirm.execute({ key: "u1/pic.png", userId: OWNER });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
    expect(repo.confirm).not.toHaveBeenCalled();
  });

  it("rejects a content type outside the allowed image types", async () => {
    const { repo, records, confirm } = setup({
      bytes: 2048,
      contentType: "image/svg+xml",
    });

    records.push(storedMedia({ confirmed: false }));

    const result = await confirm.execute({ key: "u1/pic.png", userId: OWNER });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("ValidationFailed");
    expect(repo.confirm).not.toHaveBeenCalled();
  });

  it("confirms with the object's real bytes and content type", async () => {
    const { records, confirm } = setup({
      bytes: 4096,
      contentType: "image/png",
    });

    records.push(storedMedia({ confirmed: false, bytes: 0 }));

    const result = await confirm.execute({ key: "u1/pic.png", userId: OWNER });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ url: "http://s3/media/u1/pic.png" });
    expect(records[0]?.confirmed).toBe(true);
    expect(records[0]?.bytes).toBe(4096);
  });
});

describe("list media", () => {
  it("returns only confirmed uploads with public URLs", async () => {
    const { records, list } = setup({ bytes: 1, contentType: "image/png" });

    records.push(
      storedMedia({ key: "u1/a.png" }),
      storedMedia({ key: "u1/b.png", confirmed: false }),
    );

    const output = await list.execute({ userId: OWNER });

    expect(output.media.map((m) => m.key)).toEqual(["u1/a.png"]);
    expect(output.media[0]?.url).toBe("http://s3/media/u1/a.png");
  });
});
