import { Inject, Injectable } from "@nestjs/common";
import { AwsClient } from "aws4fetch";

import type {
  BucketObjectHead,
  IBucketStore,
} from "~/features/media/application/ports/i-bucket-store";
import { CONFIG, type Env } from "~/shared/infrastructure/config/env";

import { newS3Client, s3Config, type S3Config } from "./s3";

@Injectable()
export class RustFsBucketStore implements IBucketStore {
  private readonly config: S3Config;
  private readonly client: AwsClient;

  constructor(@Inject(CONFIG) env: Env) {
    this.config = s3Config(env);
    this.client = newS3Client(env);
  }

  async presignPut(
    key: string,
    _contentType: string,
    expiresSeconds: number,
  ): Promise<string> {
    const url = new URL(`${this.config.endpoint}/${this.config.bucket}/${key}`);

    url.searchParams.set("X-Amz-Expires", String(expiresSeconds));

    const signed = await this.client.sign(url, {
      method: "PUT",
      aws: { signQuery: true },
    });

    return signed.url;
  }

  async head(key: string): Promise<BucketObjectHead | null> {
    const res = await this.client.fetch(
      `${this.config.endpoint}/${this.config.bucket}/${key}`,
      { method: "HEAD" },
    );

    if (!res.ok) {
      return null;
    }

    return {
      bytes: Number(res.headers.get("content-length") ?? "0"),
      contentType:
        res.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  async delete(key: string): Promise<void> {
    const res = await this.client.fetch(
      `${this.config.endpoint}/${this.config.bucket}/${key}`,
      { method: "DELETE" },
    );

    if (!res.ok && res.status !== 404) {
      throw new Error(`S3 delete failed: ${res.status}`);
    }
  }

  publicUrl(key: string): string {
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }
}
