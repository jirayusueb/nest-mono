import { describe, expect, it } from "bun:test";
import { ConfirmMedia } from "./confirm-media";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { make } from "../../../../shared/kernel/types/brand";
import { ListMedia } from "./list-media";
import {
  MockBucketStore,
  MockMediaRepository,
  storedMedia,
} from "../testing/mocks";

function setup(headResult: { bytes: number; contentType: string } | null) {
  const repo = new MockMediaRepository();
  const store = new MockBucketStore(headResult);

  return {
    repo,
    store,
    confirm: new ConfirmMedia(repo, store),
    list: new ListMedia(repo, store),
  };
}

describe("confirm media", () => {
  it("rejects when the object never landed", async () => {
    const { confirm } = setup(null);

    const result = await confirm.execute({ key: "u1/pic.png" });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("NotFound");
  });

  it("confirms with the object's real bytes and content type", async () => {
    const { repo, confirm } = setup({
      bytes: 4096,
      contentType: "image/png",
    });

    repo.records.push(storedMedia({ confirmed: false, bytes: 0 }));

    const result = await confirm.execute({ key: "u1/pic.png" });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ url: "http://s3/media/u1/pic.png" });
    expect(repo.records[0]?.confirmed).toBe(true);
    expect(repo.records[0]?.bytes).toBe(4096);
  });
});

describe("list media", () => {
  it("returns only confirmed uploads with public URLs", async () => {
    const { repo, list } = setup({ bytes: 1, contentType: "image/png" });
    repo.records.push(
      storedMedia({ key: "u1/a.png" }),
      storedMedia({ key: "u1/b.png", confirmed: false }),
    );

    const result = await list.execute({ userId: make<UserId>("u1") });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().media.map((m) => m.key)).toEqual(["u1/a.png"]);
    expect(result.unwrap().media[0]?.url).toBe("http://s3/media/u1/a.png");
  });
});
